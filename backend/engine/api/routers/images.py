from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from PIL import Image
import io
import uuid
import requests
import base64

from engine.api.db.session import get_db
from engine.api.crud.image import create_image, get_image, get_all_images, delete_image, get_original_image
from engine.api.schemas.image import ImageResponse, ImageOriginalRequest, EpsilonLevel, EPSILON_VALUES
from engine.api.utils.spaces import upload_image
from engine.core.image_processing import pixelate, blur, add_watermark

router = APIRouter(prefix="/images", tags=["images"])

POISONER_URL = "https://eliseo-nonconducive-deadpan.ngrok-free.dev"


@router.post("/upload")
def upload(
    file: UploadFile = File(...),
    password: str = "",
    epsilon: EpsilonLevel = EpsilonLevel.medium,
    apply_pixelate: bool = False,
    apply_blur: bool = False,
    apply_watermark: bool = False,
    apply_poison: bool = False,
    db: Session = Depends(get_db)
):
    image = Image.open(file.file)
    epsilon_value = EPSILON_VALUES[epsilon.value]

    # Store original as raw bytes in DB
    original_buffer = io.BytesIO()
    image.save(original_buffer, format="PNG")
    original_data = original_buffer.getvalue()

    poison_metrics = None
    ai_view_original = None
    ai_view_poisoned = None

    # Apply effects
    if apply_pixelate:
        image = pixelate(image)
    if apply_blur:
        image = blur(image)
    if apply_watermark:
        image = add_watermark(image)

    if apply_poison:
        # Upload original to Spaces temporarily to get a URL for the poisoner
        temp_buffer = io.BytesIO(original_data)
        temp_filename = f"temp_{uuid.uuid4()}.png"
        temp_url = upload_image(temp_buffer, temp_filename)

        # Call the poisoner API
        poison_response = requests.get(
            f"{POISONER_URL}/protect",
            params={"url": temp_url, "epsilon": epsilon_value},
            headers={"ngrok-skip-browser-warning": "true"}
        )
        poison_data = poison_response.json()

        if poison_data.get("status") == "success":
            poisoned_bytes = base64.b64decode(poison_data["images"]["poisoned_img"])
            image = Image.open(io.BytesIO(poisoned_bytes))
            poison_metrics = poison_data["metrics"]
            ai_view_original = poison_data["images"]["ai_view_original"]
            ai_view_poisoned = poison_data["images"]["ai_view_poisoned"]
        else:
            raise HTTPException(status_code=500, detail="Poisoner API failed")

    # Save processed image to Spaces
    processed_buffer = io.BytesIO()
    image.save(processed_buffer, format="PNG")
    processed_buffer.seek(0)
    filename = f"{uuid.uuid4()}_{file.filename.replace(' ', '_')}"
    image_url = upload_image(processed_buffer, filename)

    db_record = create_image(db, image_url, original_data, password, epsilon_value)

    return {
        "id": db_record.id,
        "image_url": db_record.image_url,
        "epsilon": db_record.epsilon,
        "metrics": poison_metrics,
        "ai_view_original": ai_view_original,
        "ai_view_poisoned": ai_view_poisoned,
    }


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