from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from engine.api.db.base import Base

class Image(Base):
    __tablename__ = "images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    image_url: Mapped[str] = mapped_column(String)