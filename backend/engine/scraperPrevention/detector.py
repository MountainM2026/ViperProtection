import time
from collections import defaultdict
from fastapi import Request

# ── Known AI crawler user agents
AI_SCRAPERS = [
    "GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai",
    "Claude-Web", "Google-Extended", "FacebookBot", "Diffbot",
    "Bytespider", "PetalBot", "Scrapy", "python-requests",
    "libwww-perl", "curl", "wget", "Go-http-client",
    "DataForSeoBot", "ImgProxy", "AhrefsBot", "SemrushBot",
]

# ── Headers real browsers always send
REQUIRED_BROWSER_HEADERS = [
    "accept",
    "accept-language",
    "accept-encoding",
]

# ── IP tracking for rate limiting
# Structure: { ip: [timestamp1, timestamp2, ...] }
ip_request_log: dict[str, list[float]] = defaultdict(list)

# ── IPs that have been confirmed as bots
confirmed_bots: dict[str, dict] = {}

RATE_LIMIT_WINDOW = 5.0   # seconds
RATE_LIMIT_MAX    = 8     # max requests per window before flagging
BOT_SCORE_THRESHOLD = 2   # how many signals needed to be flagged as bot

class BotDetector:

    def get_score(self, request: Request) -> tuple[int, list[str]]:
        """
        Score the request from 0 to N.
        Each suspicious signal adds 1 to the score.
        Returns (score, list_of_reasons).
        """
        score = 0
        reasons = []

        # ── 1. User-Agent check
        ua = request.headers.get("user-agent", "").lower()

        if not ua:
            score += 3  # no user agent at all = almost certainly a bot
            reasons.append("missing user-agent")
        else:
            for scraper in AI_SCRAPERS:
                if scraper.lower() in ua:
                    score += 3
                    reasons.append(f"known bot user-agent: {scraper}")
                    break

        # ── 2. Missing browser headers
        missing = [h for h in REQUIRED_BROWSER_HEADERS if h not in request.headers]
        if missing:
            score += len(missing)
            reasons.append(f"missing headers: {', '.join(missing)}")

        # ── 3. No Referer on deep page visits
        # Real users navigate from somewhere. Bots jump straight to pages.
        path = request.url.path
        referer = request.headers.get("referer", "")
        if path not in ("/", "/index.html") and not referer:
            score += 1
            reasons.append("no referer on deep page")

        # ── 4. Rate limiting
        ip = self._get_ip(request)
        now = time.time()

        # Keep only requests in the last window
        ip_request_log[ip] = [
            t for t in ip_request_log[ip]
            if now - t < RATE_LIMIT_WINDOW
        ]
        ip_request_log[ip].append(now)

        request_count = len(ip_request_log[ip])
        if request_count > RATE_LIMIT_MAX:
            score += 2
            reasons.append(f"rate limit exceeded: {request_count} requests in {RATE_LIMIT_WINDOW}s")

        # ── 5. JS cookie check
        # Our honeypot page sets a cookie via JS.
        # If the cookie is missing after the first visit, JS didn't run = bot.
        js_cookie = request.cookies.get("_bslk_js")
        visited_before = request.cookies.get("_bslk_visited")

        if visited_before and not js_cookie:
            score += 2
            reasons.append("visited before but no JS cookie = JS not executed")

        # ── 6. Already confirmed bot?
        if ip in confirmed_bots:
            score += 10
            reasons.append("previously confirmed bot")

        return score, reasons

    def is_bot(self, request: Request) -> tuple[bool, list[str]]:
        score, reasons = self.get_score(request)
        detected = score >= BOT_SCORE_THRESHOLD

        if detected:
            ip = self._get_ip(request)
            confirmed_bots[ip] = {
                "ip": ip,
                "user_agent": request.headers.get("user-agent", "unknown"),
                "reasons": reasons,
                "score": score,
                "first_seen": confirmed_bots.get(ip, {}).get("first_seen", time.time()),
                "last_seen": time.time(),
                "trapped": confirmed_bots.get(ip, {}).get("trapped", False),
            }

        return detected, reasons

    def mark_trapped(self, request: Request):
        ip = self._get_ip(request)
        if ip in confirmed_bots:
            confirmed_bots[ip]["trapped"] = True
            confirmed_bots[ip]["trap_start"] = time.time()

    def _get_ip(self, request: Request) -> str:
        # Respect X-Forwarded-For if behind a proxy (e.g. DigitalOcean load balancer)
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def get_bot_stats(self) -> dict:
        now = time.time()
        bots = list(confirmed_bots.values())
        trapped = [b for b in bots if b.get("trapped")]

        return {
            "total_bots_detected": len(bots),
            "total_bots_trapped": len(trapped),
            "active_traps": [
                {
                    "ip": b["ip"],
                    "user_agent": b["user_agent"],
                    "trap_duration_seconds": round(now - b.get("trap_start", now)),
                    "reasons": b["reasons"],
                }
                for b in trapped
            ],
            "recent_bots": sorted(bots, key=lambda x: x["last_seen"], reverse=True)[:10],
        }

# Singleton instance
detector = BotDetector()
