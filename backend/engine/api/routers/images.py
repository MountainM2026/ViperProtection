from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image
import io
import uuid

from engine.api.db.session import get_db
from engine.api.crud.image import create_image, get_image, get_all_images, delete_image
from engine.api.schemas.image import ImageResponse
from engine.api.utils.spaces import upload_image
from engine.core.image_processing import pixelate, blur, add_watermark

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/upload", response_model=ImageResponse)
def upload(
    file: UploadFile = File(...),
    apply_pixelate: bool = False,
    apply_blur: bool = False,
    apply_watermark: bool = False,
    db: Session = Depends(get_db)
):
    image = Image.open(file.file)

    if apply_pixelate:
        image = pixelate(image)
    if apply_blur:
        image = blur(image)
    if apply_watermark:
        image = add_watermark(image)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)

    filename = f"{uuid.uuid4()}_{file.filename.replace(' ', '_')}"
    image_url = upload_image(buffer, filename)
    return create_image(db, image_url)

@router.get("/{image_id}", response_model=ImageResponse)
def get_one(image_id: int, db: Session = Depends(get_db)):
    image = get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image

@router.get("/", response_model=list[ImageResponse])
def get_all(db: Session = Depends(get_db)):
    return get_all_images(db)

@router.delete("/{image_id}")
def delete(image_id: int, db: Session = Depends(get_db)):
    image = delete_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image deleted successfully"}