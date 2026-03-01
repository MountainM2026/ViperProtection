from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from middleware import ScraperMiddleware
from detector import detector
from honeypot import generate_honeypot_page, trap_response
import random

app = FastAPI()

app.add_middleware(ScraperMiddleware)

# ── Real routes ──────────────────────────────────────

@app.get("/")
async def home():
    return {"message": "Welcome to Basilisk 🐍", "status": "real site"}

@app.post("/api/poison")
async def poison_image():
    # poisoning logic goes here
    return {"message": "image poisoned"}

@app.get("/api/health")
async def health():
    return {"status": "alive"}

# ── Bot monitoring dashboard ─────────────────────────

@app.get("/api/bot-stats")
async def bot_stats():
    return detector.get_bot_stats()

@app.get("/crawler-trap")
async def crawler_trap(request: Request):
    from fastapi.responses import StreamingResponse, RedirectResponse
    import asyncio
    import random
    import string

    is_bot, reasons = detector.is_bot(request)
    
    if is_bot:
        detector.mark_trapped(request)
        async def junk_stream():
            chars = string.printable.encode()
            while True:
                yield bytes([random.choice(chars)])
                await asyncio.sleep(1)
        
        return StreamingResponse(
            junk_stream(),
            media_type="text/plain"
        )
    else:
        return RedirectResponse(url="/")

# ── Honeypot routes ──────────────────────────────────

@app.get("/honeypot/more")
async def honeypot_more():
    """
    Infinite scroll endpoint for the honeypot page.
    Returns more fake poisoned image cards.
    """
    fake_labels = [
        "Abstract painting", "Forest landscape",
        "Portrait study", "Still life", "Architecture"
    ]
    cards = ""
    for i in range(10):
        cards += f"""
        <figure class="art-card">
            <img src="/fake/poisoned_{random.randint(100,999)}.png"
                 alt="{random.choice(fake_labels)}"
                 data-category="fine-art"
                 data-license="public-domain"/>
            <figcaption>{random.choice(fake_labels)}</figcaption>
        </figure>
        """
    return HTMLResponse(content=cards)

# ── Run ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
