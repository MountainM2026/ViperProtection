from sqlalchemy.orm import Session
from engine.api.models.image import Image
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_image(db: Session, image_url: str, original_url: str, password: str) -> Image:
    db_image = Image(
        image_url=image_url,
        original_url=original_url,
        password=hash_password(password)
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def get_image(db: Session, image_id: int) -> Image:
    return db.query(Image).filter(Image.id == image_id).first()

def get_all_images(db: Session) -> list[Image]:
    return db.query(Image).all()

def get_original_image(db: Session, image_id: int, password: str) -> Image | None:
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        return None
    if not verify_password(password, image.password):
        return None
    return image

def delete_image(db: Session, image_id: int) -> Image:
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if db_image:
        db.delete(db_image)
        db.commit()
    return db_image