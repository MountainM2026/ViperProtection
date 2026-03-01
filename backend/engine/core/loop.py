import torch
import torchvision.transforms as T
from extractor import (
    vae_extractor,
    clip_extractor,
    gram_matrix,
    cosine_deviation,
    DEVICE,
)

STEPS = 50
STEP_SIZE = 0.005
CLIP_WEIGHT = 0.4
VAE_WEIGHT = 1.0
MOMENTUM = 0.5


def _purify(tensor: torch.Tensor) -> torch.Tensor:
    return T.GaussianBlur(kernel_size=3, sigma=0.5)(tensor)


def _compute_losses(
    perturbed: torch.Tensor,
    original_vae_gram: torch.Tensor,
    original_clip_embed: torch.Tensor,
) -> torch.Tensor:
    purified = _purify(perturbed)
    vae_loss = -torch.mean(
        (gram_matrix(vae_extractor(purified)) - original_vae_gram) ** 2
    )
    clip_loss = cosine_deviation(clip_extractor(purified), original_clip_embed)
    return VAE_WEIGHT * vae_loss + CLIP_WEIGHT * clip_loss


def apply_styleguard(image_tensor: torch.Tensor, eps: float) -> torch.Tensor:
    original = image_tensor.clone().to(DEVICE)

    with torch.no_grad():
        original_vae_gram = gram_matrix(vae_extractor(original))
        original_clip_embed = clip_extractor(original)

    delta = torch.zeros_like(original)
    velocity = torch.zeros_like(original)

    for i in range(STEPS):
        delta = delta.detach().requires_grad_(True)
        loss = _compute_losses(original + delta, original_vae_gram, original_clip_embed)
        loss.backward()

        if i % 10 == 0:
            print(f"Step {i}/{STEPS} | Loss: {loss.item():.6f}")

        with torch.no_grad():
            velocity = MOMENTUM * velocity + (1 - MOMENTUM) * delta.grad.sign()
            new_delta = (delta - STEP_SIZE * velocity).clamp(-eps, eps)
            delta = (original + new_delta).clamp(-3.0, 3.0) - original

    return (original + delta).clamp(-3.0, 3.0)
