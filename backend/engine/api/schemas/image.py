from pydantic import BaseModel

class ImageBase(BaseModel):
    image_url: str

class ImageCreate(ImageBase):
    pass

class ImageResponse(ImageBase):
    id: int
    image_url: str

    class Config:
        from_attributes = True