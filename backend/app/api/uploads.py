"""이미지 업로드 엔드포인트. 인증 필수 — 로그인한 사용자 폴더에만 저장된다."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app import models, schemas
from app.api.deps import get_current_user
from app.services import uploads

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/image", response_model=schemas.ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(..., description="이미지 파일 (jpg/png/webp/gif, 5MB 이하)"),
    user: models.User = Depends(get_current_user),
):
    """이미지 하나를 Cloudinary 에 올리고 URL 을 돌려준다."""
    try:
        data = await uploads.read_limited(file)
        url = uploads.upload_image(data, file.content_type, user.id)
    except uploads.ImageTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=str(exc)
        ) from exc
    except uploads.InvalidImageError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except uploads.ImageStorageError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return schemas.ImageUploadResponse(url=url)
