import io
import base64
import time
import torch
import torch.nn.functional as F
from PIL import Image
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
import requests

from change import pil_to_vae_tensor, pil_to_clip_tensor, tensor_to_pil, DEVICE
from loop import apply_styleguard
from extractor import vae_extractor, clip_extractor, gram_matrix

router = APIRouter()


def _decode_to_pil(latents: torch.Tensor) -> Image.Image:
    
    out = vae_extractor.vae.decode(latents)
    sample = out.sample if hasattr(out, "sample") else out[0]
    return tensor_to_pil(sample.detach(), (512, 512))


def _degradation(sim_score: float, style_dist: float) -> float:
    semantic_hit = max(0, (1.0 - sim_score) * 100)
    style_hit = min(50, style_dist * 5)
    return round(min(99.9, semantic_hit * 0.7 + style_hit * 0.3), 2)


def _to_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


@router.get("/protect")
async def protect_image(
    url: str = Query(..., description="URL of image to protect"),
    epsilon: float = Query(0.23, ge=0.01, le=0.2, description="Poison strength"),
):
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch image: {e}")

    orig_size = img.size
    start = time.time()

    vae_in = pil_to_vae_tensor(img)
    with torch.set_grad_enabled(True):
        poisoned = apply_styleguard(vae_in, eps=epsilon)

    elapsed = round(time.time() - start, 2)

    with torch.no_grad():
        feat_og = vae_extractor(vae_in)
        feat_poison = vae_extractor(poisoned)
        style_dist = torch.dist(gram_matrix(feat_og), gram_matrix(feat_poison)).item()

        img_poisoned = tensor_to_pil(poisoned, orig_size)

        emb_og = F.normalize(clip_extractor(pil_to_clip_tensor(img)), dim=-1)
        emb_poison = F.normalize(
            clip_extractor(pil_to_clip_tensor(img_poisoned)), dim=-1
        )
        sim_score = torch.sum(emb_og * emb_poison).item()

        ai_view_og = _decode_to_pil(feat_og)
        ai_view_poisoned = _decode_to_pil(feat_poison)

    return JSONResponse(
        {
            "status": "success",
            "metrics": {
                "time_elapsed": elapsed,
                "similarity": round(sim_score, 4),
                "protection_score": _degradation(sim_score, style_dist),
                "epsilon_used": epsilon,
            },
            "images": {
                "poisoned_img": _to_b64(img_poisoned),
                "ai_view_original": _to_b64(ai_view_og),
                "ai_view_poisoned": _to_b64(ai_view_poisoned),
            },
        }
    )
