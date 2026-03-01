from sqlalchemy import Integer, String, Float, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column
from engine.api.db.base import Base

class Image(Base):
    __tablename__ = "images_v5"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    image_url: Mapped[str] = mapped_column(String)
    original_data: Mapped[bytes] = mapped_column(LargeBinary)
    password: Mapped[str] = mapped_column(String)
    epsilon: Mapped[float] = mapped_column(Float)