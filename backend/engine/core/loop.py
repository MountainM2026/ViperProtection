import torch
from engine.core.extractor import extractor, gram_matrix, DEVICE

EPSILON = 0.05
STEPS = 50
STEP_SIZE = 0.005


def apply_styleguard(image_tensor: torch.Tensor) -> torch.Tensor:
    # og imag
    original = image_tensor.clone().to(DEVICE)

    with torch.no_grad():
        original_features = extractor(original)
        original_gram = gram_matrix(original_features)

    # here we create the delta empty rn
    delta = torch.zeros_like(original, requires_grad=True, device=DEVICE)
    # for trainig loop
    for step in range(STEPS):
        # currPoison
        perturbed = original + delta
        features = extractor(perturbed)
        current_gram = gram_matrix(features)

        # Loss:  how diff is it, negate to maximmize
        loss = -torch.mean((current_gram - original_gram) ** 2)

        loss.backward()

        if delta.grad is not None:
            with torch.no_grad():
                # nudge it
                delta.data -= STEP_SIZE * delta.grad.sign()

                # Clamp
                delta.data.clamp_(-EPSILON, EPSILON)

                #  clamp it in valid range
                (original + delta).clamp_(-2.5, 2.5)

        else:
            print("wraning not gradient")
            break

    return original + delta.detach()
