"""
이미지 업로드 엔드포인트 통합 테스트.

Cloudinary 로 실제 네트워크 요청을 보내지 않도록 _upload_to_cloudinary 만
가짜로 바꿔치기한다(monkeypatch). 검증·인증·폴더 규칙은 진짜 코드를 그대로 탄다.
"""

import pytest

from app.services import uploads

# 각 포맷의 진짜 파일 시그니처(매직 넘버) — 뒤 내용은 검사하지 않으므로 아무 바이트나 붙인다.
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"0" * 32
GIF = b"GIF89a" + b"0" * 32
WEBP = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"0" * 32


@pytest.fixture
def fake_cloudinary(monkeypatch):
    """업로드 호출을 가로채 기록만 하고 가짜 URL 을 돌려준다."""
    calls = []

    def _fake(data: bytes, folder: str) -> dict:
        calls.append({"data": data, "folder": folder})
        return {"secure_url": f"https://res.cloudinary.com/demo/{folder}/abc.png"}

    monkeypatch.setattr(uploads, "_upload_to_cloudinary", _fake)
    return calls


def _post(client, content: bytes, filename="a.png", content_type="image/png"):
    return client.post(
        "/uploads/image", files={"file": (filename, content, content_type)}
    )


def test_upload_image_returns_url(client, fake_cloudinary):
    res = _post(client, PNG)

    assert res.status_code == 200
    assert res.json()["url"].startswith("https://")
    assert len(fake_cloudinary) == 1


@pytest.mark.parametrize(
    "content,filename,content_type",
    [
        (JPEG, "a.jpg", "image/jpeg"),
        (GIF, "a.gif", "image/gif"),
        (WEBP, "a.webp", "image/webp"),
    ],
)
def test_upload_allows_each_image_format(client, fake_cloudinary, content, filename, content_type):
    assert _post(client, content, filename, content_type).status_code == 200


def test_upload_requires_login(anon_client):
    """로그인하지 않으면 401 (파일을 읽기도 전에 막힌다)."""
    res = anon_client.post("/uploads/image", files={"file": ("a.png", PNG, "image/png")})
    assert res.status_code == 401


def test_upload_rejects_non_image_type(client, fake_cloudinary):
    res = _post(client, b"plain text", "note.txt", "text/plain")

    assert res.status_code == 400
    assert fake_cloudinary == []  # 업로드까지 가지 않는다


def test_upload_rejects_disguised_file(client, fake_cloudinary):
    """Content-Type 만 이미지로 속인 파일은 실제 바이트 검사에서 걸린다."""
    res = _post(client, b"<script>alert(1)</script>", "evil.png", "image/png")

    assert res.status_code == 400
    assert fake_cloudinary == []


def test_upload_rejects_format_mismatch(client, fake_cloudinary):
    """png 라고 보냈지만 내용은 jpeg → 거부."""
    assert _post(client, JPEG, "a.png", "image/png").status_code == 400
    assert fake_cloudinary == []


def test_upload_rejects_empty_file(client, fake_cloudinary):
    assert _post(client, b"", "a.png", "image/png").status_code == 400
    assert fake_cloudinary == []


def test_upload_rejects_too_large_file(client, fake_cloudinary):
    """5MB 초과는 413."""
    too_big = PNG + b"0" * uploads.MAX_IMAGE_BYTES

    res = _post(client, too_big)

    assert res.status_code == 413
    assert fake_cloudinary == []


def test_upload_accepts_file_at_size_limit(client, fake_cloudinary):
    """정확히 제한 크기까지는 통과 (경계값)."""
    at_limit = PNG + b"0" * (uploads.MAX_IMAGE_BYTES - len(PNG))
    assert len(at_limit) == uploads.MAX_IMAGE_BYTES

    assert _post(client, at_limit).status_code == 200


def test_upload_goes_to_current_user_folder(client, fake_cloudinary):
    """폴더는 서버가 로그인 사용자 id 로 정한다 — 사용자가 바뀌면 폴더도 바뀐다."""
    _post(client, PNG)
    assert fake_cloudinary[-1]["folder"] == "orbit/1"

    client.current["id"] = 2  # 다른 사용자로 전환
    _post(client, PNG)
    assert fake_cloudinary[-1]["folder"] == "orbit/2"


def test_upload_folder_cannot_be_set_by_client(client, fake_cloudinary):
    """클라이언트가 folder 를 끼워 넣어도 무시되고 자기 폴더로만 간다."""
    res = client.post(
        "/uploads/image",
        files={"file": ("a.png", PNG, "image/png")},
        data={"folder": "orbit/2", "user_id": "2"},
    )

    assert res.status_code == 200
    assert fake_cloudinary[-1]["folder"] == "orbit/1"


def test_upload_reports_storage_failure(client, monkeypatch):
    """Cloudinary 가 실패하면 500 이 아니라 502 로 알린다."""

    def _boom(data, folder):
        raise RuntimeError("cloudinary down")

    monkeypatch.setattr(uploads, "_upload_to_cloudinary", _boom)

    assert _post(client, PNG).status_code == 502
