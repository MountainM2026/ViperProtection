from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from engine.api.db.session import get_db
from engine.api.crud.image import create_image, get_image, get_all_images, delete_image
from engine.api.schemas.image import ImageResponse
from engine.api.utils.spaces import upload_image
import uuid

router = APIRouter(prefix="/images", tags=["images"])

@router.post("/upload", response_model=ImageResponse)
def upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Generate a unique filename to avoid overwriting existing images
    filename = f"{uuid.uuid4()}{file.filename}"
    
    # Upload to Digital Ocean Spaces and get the URL back
    image_url = upload_image(file.file, filename)
    
    # Save the URL to the database
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


                   