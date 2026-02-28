import torch
import torchvision.transforms as T
from PIL import Image

DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "mps" if torch.backends.mps.is_available() else "cpu"
)

VAE_SIZE = 512
CLIP_SIZE = 224

VAE_MEAN = [0.5, 0.5, 0.5]
VAE_STD = [0.5, 0.5, 0.5]

CLIP_MEAN = [0.48145466, 0.4578275, 0.40821073]
CLIP_STD = [0.26862954, 0.26130258, 0.27577711]


vae_preprocess = T.Compose(
    [
        T.Resize((VAE_SIZE, VAE_SIZE)),
        T.ToTensor(),
        T.Normalize(mean=VAE_MEAN, std=VAE_STD),
    ]
)

clip_preprocess = T.Compose(
    [
        T.Resize((CLIP_SIZE, CLIP_SIZE)),
        T.ToTensor(),
        T.Normalize(mean=CLIP_MEAN, std=CLIP_STD),
    ]
)


def pil_to_vae_tensor(image: Image.Image) -> torch.Tensor:
    """Converts PIL image to normalised VAE-ready tensor [1, 3, 512, 512]."""
    return vae_preprocess(image.convert("RGB")).unsqueeze(0).to(DEVICE)


def pil_to_clip_tensor(image: Image.Image) -> torch.Tensor:
    """Converts PIL image to CLIP-normalised tensor [1, 3, 224, 224]."""
    return clip_preprocess(image.convert("RGB")).unsqueeze(0).to(DEVICE)


def vae_denormalize(tensor: torch.Tensor) -> torch.Tensor:
    """Undoes VAE normalisation and clamps to [0, 1]."""
    mean = torch.tensor(VAE_MEAN, device=DEVICE).view(3, 1, 1)
    std = torch.tensor(VAE_STD, device=DEVICE).view(3, 1, 1)
    return (tensor * std + mean).clamp(0, 1)


def tensor_to_pil(tensor: torch.Tensor, original_size: tuple) -> Image.Image:
    """Converts output tensor back to PIL image at original resolution."""
    denormed = vae_denormalize(tensor.squeeze(0).cpu())
    img = T.ToPILImage()(denormed)
    return img.resize(original_size, Image.Resampling.LANCZOS)
