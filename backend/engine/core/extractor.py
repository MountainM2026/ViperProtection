import torch
import torch.nn as nn
from diffusers.models.autoencoders.autoencoder_kl import AutoencoderKL
from transformers import CLIPModel
from torchvision.transforms.functional import resize

DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "mps" if torch.backends.mps.is_available() else "cpu"
)

SD_MODEL_ID = "stabilityai/sd-vae-ft-mse"
CLIP_MODEL_ID = "openai/clip-vit-large-patch14"


class VAEExtractor(nn.Module):
    def __init__(self):
        super().__init__()
        self.vae = AutoencoderKL.from_pretrained(SD_MODEL_ID).eval()
        for p in self.parameters():
            p.requires_grad = False

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        output = self.vae.encode(x)

        if isinstance(output, tuple):
            latent_dist = output[0]
        else:
            latent_dist = output.latent_dist

        return latent_dist.mean


class CLIPExtractor(nn.Module):
    def __init__(self):
        super().__init__()
        clip = CLIPModel.from_pretrained(CLIP_MODEL_ID)
        self.vision_model = clip.vision_model.eval()
        self.visual_projection = clip.visual_projection.eval()
        for p in self.parameters():
            p.requires_grad = False

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if x.shape[-1] != 224:
            x = resize(x, [224, 224], antialias=False)
        vision_out = self.vision_model(pixel_values=x)
        pooled = vision_out.pooler_output
        return self.visual_projection(pooled)


def gram_matrix(features: torch.Tensor) -> torch.Tensor:
    b, c, h, w = features.shape
    f = features.view(b, c, -1)
    return torch.bmm(f, f.transpose(1, 2)) / (c * h * w)


def cosine_deviation(a: torch.Tensor, b: torch.Tensor) -> torch.Tensor:
    a_norm = nn.functional.normalize(a, dim=-1)
    b_norm = nn.functional.normalize(b, dim=-1)
    return torch.mean(torch.sum(a_norm * b_norm, dim=-1))


print(f"Loading models onto {DEVICE}...")
vae_extractor = VAEExtractor().to(DEVICE)
clip_extractor = CLIPExtractor().to(DEVICE)
