from PIL import Image, ImageFilter
from pathlib import Path

WATERMARK_PATH = Path(__file__).parent / "assets" / "viper.png"

def pixelate(image: Image.Image, pixel_size: int = 10) -> Image.Image:
    """Pixelates image by downscaling then upscaling."""
    original_size = image.size
    small = image.resize(
        (image.width // pixel_size, image.height // pixel_size),
        Image.NEAREST
    )
    return small.resize(original_size, Image.NEAREST)


def blur(image: Image.Image, radius: int = 5) -> Image.Image:
    """Applies gaussian blur to image."""
    return image.filter(ImageFilter.GaussianBlur(radius))


def add_watermark(image: Image.Image, opacity: int = 80) -> Image.Image:
    """Adds a semi-transparent watermark image centered on the image."""
    image = image.convert("RGBA")
    
    watermark = Image.open(WATERMARK_PATH).convert("RGBA")
    
    wm_width = image.width
    wm_ratio = wm_width / watermark.width
    wm_height = int(watermark.height * wm_ratio)
    watermark = watermark.resize((wm_width, wm_height), Image.LANCZOS)


    r, g, b, a = watermark.split()
    a = a.point(lambda x: x * opacity // 255)
    watermark.putalpha(a)


    x = (image.width - wm_width) // 2
    y = (image.height - wm_height) // 2

 
    image.paste(watermark, (x, y), watermark)
    
    return image.convert("RGB")
