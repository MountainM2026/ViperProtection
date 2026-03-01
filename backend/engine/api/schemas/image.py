from pydantic import BaseModel
from enum import Enum

class EpsilonLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

EPSILON_VALUES = {
    "low": 0.03,
    "medium": 0.05,
    "high": 0.07
}

class ImageBase(BaseModel):
    image_url: str

class ImageCreate(ImageBase):
    original_url: str
    password: str
    epsilon: float

class ImageResponse(ImageBase):
    id: int
    image_url: str
    epsilon: float

    class Config:
        from_attributes = True

class ImageOriginalRequest(BaseModel):
    password: str

class ImageOriginalResponse(BaseModel):
    id: int
    original_url: str

    class Config:
        from_attributes = True