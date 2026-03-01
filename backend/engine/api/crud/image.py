from sqlalchemy.orm import Session
from engine.api.models.image import Image
from engine.api.schemas.image import ImageCreate

# frontend -> router -> crud -> db

def create_image(db: Session, image_url: str) -> Image:
    db_image = Image(image_url=image_url)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def get_image(db: Session, image_id: int) -> Image:
    return db.query(Image).filter(Image.id == image_id).first()

def get_all_images(db: Session) -> list[Image]:
    return db.query(Image).all()

def delete_image(db: Session, image_id: int) -> Image:
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if db_image:
        db.delete(db_image)
        db.commit()
    return db_image