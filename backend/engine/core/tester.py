import torch
import torch.nn.functional as F
import time
from PIL import Image
from change import pil_to_vae_tensor, pil_to_clip_tensor, tensor_to_pil, DEVICE
from loop import apply_styleguard
from extractor import vae_extractor, clip_extractor, gram_matrix


def calculate_training_degradation(sim_score, style_dist):
    semantic_hit = max(0, (1.0 - sim_score) * 100)
    style_hit = min(50, style_dist * 5)
    total_degradation = min(99.9, (semantic_hit * 0.7) + (style_hit * 0.3))
    return round(total_degradation, 2)


def process_viper_request(input_image: Image.Image, epsilon: float):
    start_time = time.time()
    orig_size = input_image.size

    vae_in = pil_to_vae_tensor(input_image).to(DEVICE)

    with torch.set_grad_enabled(True):
        poisoned_tensor = apply_styleguard(vae_in, eps=epsilon)

    processing_time = round(time.time() - start_time, 2)

    with torch.no_grad():
        feat_og = vae_extractor(vae_in)
        feat_poison = vae_extractor(poisoned_tensor)

        style_dist = torch.dist(gram_matrix(feat_og), gram_matrix(feat_poison)).item()

        img_poison_pil = tensor_to_pil(poisoned_tensor, orig_size)

        clip_og_in = pil_to_clip_tensor(input_image)
        clip_poison_in = pil_to_clip_tensor(img_poison_pil)

        emb_og = F.normalize(clip_extractor(clip_og_in), dim=-1)
        emb_poison = F.normalize(clip_extractor(clip_poison_in), dim=-1)
        sim_score = torch.sum(emb_og * emb_poison).item()

        def decode_to_pil(latents):
            out = vae_extractor.vae.decode(latents)
            sample = out.sample if hasattr(out, "sample") else out[0]
            return tensor_to_pil(sample.detach(), (512, 512))

        ai_view_og = decode_to_pil(feat_og)
        ai_view_poison = decode_to_pil(feat_poison)

    degradation_pct = calculate_training_degradation(sim_score, style_dist)

    return {
        "status": "success",
        "metrics": {
            "time_elapsed": processing_time,
            "similarity": round(sim_score, 4),
            "protection_score": degradation_pct,
        },
        "outputs": {
            "poisoned_img": img_poison_pil,
            "ai_view_original": ai_view_og,
            "ai_view_poisoned": ai_view_poison,
        },
    }
