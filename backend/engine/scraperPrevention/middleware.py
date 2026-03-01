from fastapi import Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from detector import detector
from honeypot import honeypot_response, trap_response

# Routes that should NEVER be intercepted
WHITELIST_PATHS = {
    "/api/poison",
    "/api/health",
    "/docs",
    "/openapi.json",
    "/honeypot/more",   # our own infinite scroll endpoint
}

class ScraperMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # ── Never intercept whitelisted API routes
