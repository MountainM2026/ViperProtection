import torch
import torchvision.transforms as T
from torchvision.transforms.functional import resize
from engine.core.extractor import (
    vae_extractor,
    clip_extractor,
    gram_matrix,
    cosine_deviation,
    DEVICE,
)

EPSILON = 0.05
STEPS = 75
STEP_SIZE = 0.004
CLIP_WEIGHT = 0.4
VAE_WEIGHT = 0.6
MOMENTUM = 0.9
PURIFICATION_SCALE = 2


def _simulate_purification(tensor: torch.Tensor) -> torch.Tensor:
    """Simulates upscale + blur purification attack to harden the poison against stripping."""
    _, _, h, w = tensor.shape
    downscaled = resize(
        tensor, [h // PURIFICATION_SCALE, w // PURIFICATION_SCALE], antialias=True
    )
    upscaled = resize(downscaled, [h, w], antialias=True)
    blurred = T.GaussianBlur(kernel_size=3, sigma=0.5)(upscaled)
    return blurred


def _compute_losses(
    perturbed: torch.Tensor,
    original_vae_gram: torch.Tensor,
    original_clip_embed: torch.Tensor,
) -> torch.Tensor:
    """
    Computes combined VAE + CLIP loss on the purified image.
    Running losses on the purified version forces the poison to survive stripping attempts.
    """
    purified = _simulate_purification(perturbed)

    vae_features = vae_extractor(purified)
    current_vae_gram = gram_matrix(vae_features)
    vae_loss = -torch.mean((current_vae_gram - original_vae_gram) ** 2)

    clip_embed = clip_extractor(purified)
    clip_loss = cosine_deviation(clip_embed, original_clip_embed)

    return VAE_WEIGHT * vae_loss + CLIP_WEIGHT * clip_loss


def apply_styleguard(image_tensor: torch.Tensor) -> torch.Tensor:
    """
    Runs dual-encoder PGD attack with purification-hardened loss.
    Input:  normalised [1, 3, H, W] tensor
    Output: adversarially perturbed tensor of same shape
    """
    original = image_tensor.clone().to(DEVICE)

    with torch.no_grad():
        original_vae_gram = gram_matrix(vae_extractor(original))
        original_clip_embed = clip_extractor(original)

    delta = torch.zeros_like(original)
    velocity = torch.zeros_like(original)

    for _ in range(STEPS):
        delta = delta.detach().requires_grad_(True)

        perturbed = original + delta
        loss = _compute_losses(perturbed, original_vae_gram, original_clip_embed)
        loss.backward()

        with torch.no_grad():
            velocity = MOMENTUM * velocity + (1 - MOMENTUM) * delta.grad.sign()

            new_delta = delta - STEP_SIZE * velocity
            new_delta = new_delta.clamp(-EPSILON, EPSILON)

            combined = (original + new_delta).clamp(-3.0, 3.0)
            delta = combined - original

    return (original + delta).clamp(-3.0, 3.0)
