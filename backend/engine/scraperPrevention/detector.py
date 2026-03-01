import time
from collections import defaultdict
from fastapi import Request

AI_SCRAPERS = [
    "GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai",
    "Claude-Web", "Google-Extended", "FacebookBot", "Diffbot",
    "Bytespider", "PetalBot", "Scrapy", "python-requests",
    "libwww-perl", "curl", "wget", "Go-http-client",
    "DataForSeoBot", "ImgProxy", "AhrefsBot", "SemrushBot",
]

REQUIRED_BROWSER_HEADERS = [
    "accept",
    "accept-language",
    "accept-encoding",
]

# ── IP tracking for rate limiting
ip_request_log: dict[str, list[float]] = defaultdict(list)

confirmed_bots: dict[str, dict] = {}

RATE_LIMIT_WINDOW = 5.0   
RATE_LIMIT_MAX    = 8     
BOT_SCORE_THRESHOLD = 2   

class BotDetector:

    def get_score(self, request: Request) -> tuple[int, list[str]]:
        """
        Score the request from 0 to N.
        Each suspicious signal adds 1 to the score.
        Returns (score, list_of_reasons).
        """
        score = 0
        reasons = []

        ua = request.headers.get("user-agent", "").lower()

        if not ua:
            score += 3  
            reasons.append("missing user-agent")
        else:
            for scraper in AI_SCRAPERS:
                if scraper.lower() in ua:
                    score += 3
                    reasons.append(f"known bot user-agent: {scraper}")
                    break

        missing = [h for h in REQUIRED_BROWSER_HEADERS if h not in request.headers]
        if missing:
            score += len(missing)
            reasons.append(f"missing headers: {', '.join(missing)}")

        path = request.url.path
        referer = request.headers.get("referer", "")
        if path not in ("/", "/index.html") and not referer:
            score += 1
            reasons.append("no referer on deep page")

        ip = self._get_ip(request)
        now = time.time()

        ip_request_log[ip] = [
            t for t in ip_request_log[ip]
            if now - t < RATE_LIMIT_WINDOW
        ]
        ip_request_log[ip].append(now)

        request_count = len(ip_request_log[ip])
        if request_count > RATE_LIMIT_MAX:
            score += 2
            reasons.append(f"rate limit exceeded: {request_count} requests in {RATE_LIMIT_WINDOW}s")

        js_cookie = request.cookies.get("_bslk_js")
        visited_before = request.cookies.get("_bslk_visited")

        if visited_before and not js_cookie:
            score += 2
            reasons.append("visited before but no JS cookie = JS not executed")

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

detector = BotDetector()
