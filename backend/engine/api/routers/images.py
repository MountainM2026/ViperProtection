from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from PIL import Image
import io
import uuid

from engine.api.db.session import get_db
from engine.api.crud.image import create_image, get_image, get_all_images, delete_image, get_original_image
from engine.api.schemas.image import ImageResponse, ImageOriginalRequest, ImageOriginalResponse, EpsilonLevel, EPSILON_VALUES
from engine.api.utils.spaces import upload_image
from engine.core.image_processing import pixelate, blur, add_watermark

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/upload", response_model=ImageResponse)
def upload(
    file: UploadFile = File(...),
    password: str = "",
    epsilon: EpsilonLevel = EpsilonLevel.medium,
    apply_pixelate: bool = False,
    apply_blur: bool = False,
    apply_watermark: bool = False,
    db: Session = Depends(get_db)
):
    # Open image
    image = Image.open(file.file)
    epsilon_value = EPSILON_VALUES[epsilon.value]

    # Save original to Spaces before applying effects
    original_buffer = io.BytesIO()
    image.save(original_buffer, format="PNG")
    original_data = original_buffer.getvalue()

    # Apply selected effects
    if apply_pixelate:
        image = pixelate(image)
    if apply_blur:
        image = blur(image)
    if apply_watermark:
        image = add_watermark(image)

    # Save processed image to Spaces
    processed_buffer = io.BytesIO()
    image.save(processed_buffer, format="PNG")
    processed_buffer.seek(0)
    filename = f"{uuid.uuid4()}_{file.filename.replace(' ', '_')}"
    image_url = upload_image(processed_buffer, filename)

    # Save both URLs and password to database
    return create_image(db, image_url, original_data, password, epsilon_value)


@router.post("/{image_id}/original")
def get_original(image_id: int, request: ImageOriginalRequest, db: Session = Depends(get_db)):
    image = get_original_image(db, image_id, request.password)
    if not image:
        raise HTTPException(status_code=401, detail="Invalid password or image not found")
    return Response(content=image.original_data, media_type="image/png")


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