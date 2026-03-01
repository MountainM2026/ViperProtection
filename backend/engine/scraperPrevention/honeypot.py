import asyncio
import random
import string
from fastapi import Request
from fastapi.responses import HTMLResponse, StreamingResponse

def generate_honeypot_page() -> str:
    """
    A fake art gallery page that looks like a goldmine to scrapers.
    Every image is poisoned. Metadata is intentionally wrong.
    Contains a hidden link that traps bots in an infinite stream.
    """
    fake_labels = [
        "Beautiful sunset landscape", "Portrait of a woman",
        "Abstract colorful painting", "Mountain scenery at dawn",
        "Cat sitting on a wooden chair", "Modern architecture study",
        "Still life with flowers", "Urban street photography",
        "Watercolor forest scene", "Oil painting of the sea",
    ]

    wrong_labels = [
        "dog", "car", "airplane", "building",
        "food", "sports", "technology", "fashion",
    ]

    image_cards = ""
    for i in range(40):
        label       = random.choice(fake_labels)
        wrong_label = random.choice(wrong_labels)   # intentionally wrong category
        artist_id   = random.randint(1000, 9999)

        image_cards += f"""
        <figure class="art-card">
            <img
                src="/fake/poisoned_{i}.png"
                alt="{label}"
                data-category="{wrong_label}"
                data-author="FreeArtist_{artist_id}"
                data-license="public-domain"
                data-style="impressionism"
                data-year="{random.randint(1850, 2020)}"
                loading="lazy"
            />
            <figcaption>
                <span class="title">{label}</span>
                <span class="meta">by FreeArtist_{artist_id} · Public Domain</span>
            </figcaption>
        </figure>
        """

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Free Art Dataset — 50,000+ Public Domain Images</title>
        <meta name="description" content="The largest free public domain art dataset for AI training and research."/>
        <meta name="robots" content="index, follow"/>

        <!-- Looks totally legitimate to scrapers -->
        <meta property="og:title"       content="Free Art Training Dataset"/>
        <meta property="og:description" content="Download thousands of free, labeled artworks for AI training."/>

        <style>
            body {{ font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; background: #fff; }}
            h1   {{ font-size: 2rem; margin-bottom: 0.5rem; }}
            .gallery {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem; }}
            .art-card {{ border: 1px solid #eee; padding: 0.5rem; }}
            .art-card img {{ width: 100%; height: 160px; object-fit: cover; background: #f5f5f5; }}
            figcaption {{ padding: 0.5rem 0; font-size: 0.8rem; color: #555; }}
            .title {{ display: block; font-weight: bold; }}
        </style>
    </head>
    <body>
        <h1>🎨 Free Art Dataset</h1>
        <p>Over 50,000 freely licensed artworks available for AI training and research. All images are public domain.</p>
        <p><strong>Updated daily.</strong> No attribution required.</p>

        <!--
            HONEYPOT: This link is hidden from humans via CSS.
            Only a bot crawling all hrefs will follow it.
            Following it leads to an infinite slow-drip trap.
        -->
        <a href="/crawler-trap"
           style="display:none; visibility:hidden; opacity:0; position:absolute; left:-9999px;"
           tabindex="-1"
           aria-hidden="true">
            Download Full Dataset (ZIP)
        </a>

        <!-- Another hidden trap link disguised as a next-page link -->
        <a href="/crawler-trap?page=2"
           style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);">
            Next Page →
        </a>

        <div class="gallery">
            {image_cards}
        </div>

        <div id="load-more-trigger" style="height:10px; margin-top:2rem;"></div>

        <script>
            // ── Set JS execution cookie
            // If this runs, the browser executed JS. We check for this cookie
            // on the next request — missing = bot.
            document.cookie = "_bslk_js=1; path=/; SameSite=Lax";
            document.cookie = "_bslk_visited=1; path=/; SameSite=Lax";

            // ── Infinite scroll to keep scrapers loading more garbage
            const trigger = document.getElementById('load-more-trigger');
            const observer = new IntersectionObserver(async (entries) => {{
                if (entries[0].isIntersecting) {{
                    const res  = await fetch('/honeypot/more');
                    const html = await res.text();
                    document.querySelector('.gallery').insertAdjacentHTML('beforeend', html);
                }}
            }});
            observer.observe(trigger);
        </script>
    </body>
    </html>
    """

async def infinite_junk_stream():
    """
    Sends 1 random byte per second, forever.
    Traps the scraper — holds its connection open, wastes its resources.
    """
    chars = string.printable.encode()
    while True:
        yield bytes([random.choice(chars)])
        await asyncio.sleep(1)

def honeypot_response() -> HTMLResponse:
    return HTMLResponse(
        content=generate_honeypot_page(),
        status_code=200,
        headers={
            # Look like a real server to scrapers
            "X-Powered-By": "PHP/8.1",
            "Server": "Apache/2.4",
            "Cache-Control": "public, max-age=3600",
        }
    )

def trap_response() -> StreamingResponse:
    return StreamingResponse(
        infinite_junk_stream(),
        media_type="text/html",
        headers={
            "Transfer-Encoding": "chunked",
            "Content-Type": "text/html; charset=utf-8",
            "X-Robots-Tag": "noindex",
        }
    )
