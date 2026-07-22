"""
이미지 업로드 서비스 — 검증 + Cloudinary 저장.

라우터(api/uploads.py)는 여기 두 함수만 부른다:
  read_limited (용량 제한하며 읽기) → upload_image (검증 후 Cloudinary 업로드)

Cloudinary SDK 를 아는 곳은 이 파일뿐이다. 저장소를 S3 등으로 바꿔도
라우터와 프론트는 그대로 둘 수 있다.
"""

import cloudinary
import cloudinary.uploader

from app.core import config

# ── 정책값 ──
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB

# 허용 MIME 타입 → 그 포맷임을 증명하는 파일 시그니처(매직 넘버) 판별 함수.
# 확장자·Content-Type 은 클라이언트가 마음대로 보낼 수 있으므로 실제 바이트로 한 번 더 확인한다.
ALLOWED_TYPES: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


class InvalidImageError(Exception):
    """클라이언트가 보낸 파일이 규칙에 맞지 않음 (→ 400)."""


class ImageTooLargeError(Exception):
    """용량 제한 초과 (→ 413)."""


class ImageStorageError(Exception):
    """Cloudinary 쪽 실패 (→ 502)."""


def _sniff_format(data: bytes) -> str | None:
    """파일 앞부분 바이트로 실제 이미지 포맷을 알아낸다. 모르면 None."""
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    # WEBP 는 "RIFF" + 4바이트 길이 + "WEBP"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


async def read_limited(file, max_bytes: int = MAX_IMAGE_BYTES) -> bytes:
    """
    업로드 스트림을 최대 max_bytes 까지만 읽는다.

    한 번에 file.read() 하면 거대한 파일이 통째로 메모리에 올라오므로,
    조각(chunk)으로 읽다가 제한을 넘는 순간 바로 끊는다.
    """
    chunks: list[bytes] = []
    total = 0
    while chunk := await file.read(64 * 1024):
        total += len(chunk)
        if total > max_bytes:
            raise ImageTooLargeError(
                f"이미지는 {max_bytes // (1024 * 1024)}MB 이하만 업로드할 수 있습니다."
            )
        chunks.append(chunk)
    return b"".join(chunks)


def validate_image(data: bytes, content_type: str | None) -> str:
    """이미지 파일인지 검사하고 포맷명을 돌려준다. 아니면 InvalidImageError."""
    if not data:
        raise InvalidImageError("빈 파일은 업로드할 수 없습니다.")

    declared = (content_type or "").split(";")[0].strip().lower()
    if declared not in ALLOWED_TYPES:
        raise InvalidImageError("jpg, png, webp, gif 이미지만 업로드할 수 있습니다.")

    actual = _sniff_format(data)
    if actual is None or actual != ALLOWED_TYPES[declared]:
        # 확장자만 바꾼 파일(예: script.js → cat.png) 차단
        raise InvalidImageError("이미지 파일이 아니거나 형식이 확장자와 다릅니다.")
    return actual


def _configure() -> None:
    """Cloudinary 자격증명 주입. 값이 없으면 업로드 자체가 불가능하므로 여기서 막는다."""
    if not all(
        (
            config.CLOUDINARY_CLOUD_NAME,
            config.CLOUDINARY_API_KEY,
            config.CLOUDINARY_API_SECRET,
        )
    ):
        raise ImageStorageError("이미지 저장소(Cloudinary) 설정이 없습니다.")
    cloudinary.config(
        cloud_name=config.CLOUDINARY_CLOUD_NAME,
        api_key=config.CLOUDINARY_API_KEY,
        api_secret=config.CLOUDINARY_API_SECRET,
        secure=True,  # https URL 로 받는다
    )


def _upload_to_cloudinary(data: bytes, folder: str) -> dict:
    """실제 네트워크 호출 지점 — 테스트에서는 이 함수만 바꿔치기한다."""
    _configure()
    return cloudinary.uploader.upload(
        data,
        folder=folder,
        resource_type="image",  # 이미지가 아니면 Cloudinary 쪽에서도 거부
    )


def upload_image(data: bytes, content_type: str | None, user_id: int) -> str:
    """검증 → 업로드. 저장된 이미지의 https URL 을 돌려준다."""
    validate_image(data, content_type)

    # 폴더는 로그인 사용자 id 로 서버가 정한다 (클라이언트가 지정할 수 없음)
    folder = f"orbit/{user_id}"
    try:
        result = _upload_to_cloudinary(data, folder)
    except (InvalidImageError, ImageTooLargeError, ImageStorageError):
        raise
    except Exception as exc:  # 네트워크·인증 등 SDK 예외를 하나로 뭉친다
        raise ImageStorageError("이미지 업로드에 실패했습니다.") from exc

    url = result.get("secure_url") or result.get("url")
    if not url:
        raise ImageStorageError("이미지 업로드 응답에 URL 이 없습니다.")
    return url
