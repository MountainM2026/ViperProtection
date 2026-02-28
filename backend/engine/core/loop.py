import torch
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


def _compute_losses(perturbed, original_vae_gram, original_clip_embed):
    """Computes combined VAE style loss and CLIP semantic loss against original embeddings."""
    vae_features = vae_extractor(perturbed)
    current_vae_gram = gram_matrix(vae_features)
    vae_loss = -torch.mean((current_vae_gram - original_vae_gram) ** 2)

    clip_embed = clip_extractor(perturbed)
    clip_loss = cosine_deviation(clip_embed, original_clip_embed)

    return VAE_WEIGHT * vae_loss + CLIP_WEIGHT * clip_loss


def apply_styleguard(image_tensor: torch.Tensor) -> torch.Tensor:
    """
    Runs dual-encoder PGD attack to corrupt both VAE latent and CLIP embedding.
    Input:  normalised [1, 3, H, W] tensor
    Output: adversarially perturbed tensor of same shape
    """
    original = image_tensor.clone().to(DEVICE)

    with torch.no_grad():
        original_vae_gram = gram_matrix(vae_extractor(original))
        original_clip_embed = clip_extractor(original)

    delta = torch.zeros_like(original, requires_grad=True)
    velocity = torch.zeros_like(original)

    for step in range(STEPS):
        perturbed = original + delta

        loss = _compute_losses(perturbed, original_vae_gram, original_clip_embed)
        loss.backward()

        with torch.no_grad():
            grad = delta.grad.sign()

            # momentum-based update so the poison builds more directionally
            velocity = MOMENTUM * velocity + (1 - MOMENTUM) * grad
            delta.data -= STEP_SIZE * velocity

            delta.data.clamp_(-EPSILON, EPSILON)

            # ensure final pixel values stay sane after adding delta
            combined = (original + delta).clamp(-3.0, 3.0)
            delta.data = combined - original

        delta.grad.zero_()

    return (original + delta.detach()).clamp(-3.0, 3.0)
