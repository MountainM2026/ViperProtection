from fastapi import Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from detector import detector
from honeypot import honeypot_response

WHITELIST_PATHS = {
    "/api/poison",
    "/api/health",
    "/docs",
    "/openapi.json",
    "/honeypot/more",
    "/crawler-trap",
}

class ScraperMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # ── Never intercept whitelisted API routes
        if path in WHITELIST_PATHS or path.startswith("/api/"):
            return await call_next(request)

        # ── Run bot detection
        is_bot, reasons = detector.is_bot(request)

        if is_bot:
            print(f"🐍 BOT DETECTED: {request.client.host} | Reasons: {reasons}")
            return honeypot_response()

        # ── Set visited cookie on real users
        response = await call_next(request)
        response.headers["Set-Cookie"] = "_bslk_visited=1; path=/; SameSite=Lax"
        return response
