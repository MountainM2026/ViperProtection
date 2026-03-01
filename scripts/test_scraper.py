from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import time
import requests

BASE_URL = "http://localhost:3000"
API_URL = "http://localhost:8000"

def scrape_with_playwright():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(user_agent="GPTBot/1.0")
        page = context.new_page()

        print("=" * 60)
        print("🤖 GPTBot/1.0 — Initializing web scraper")
        print("=" * 60)

        # ── Step 1: Visit React frontend
        print("\n📡 Connecting to target site...")
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        print(f"   Connected to {BASE_URL}")

        # ── Step 2: Scroll through page
        print("\n📜 Scanning page content...")
        for i in range(5):
            page.evaluate("window.scrollBy(0, window.innerHeight)")
            time.sleep(0.5)
            print(f"   Scanning... {(i+1) * 20}%")
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(1)
        print("   ✅ Page scan complete")

        # ── Step 3: Collect images
        print("\n🖼️  Collecting images...")
        images = page.query_selector_all("img")
        print(f"   Found {len(images)} images")
        for img in images[:5]:
            print(f"   - {img.get_attribute('alt')}: {img.get_attribute('src')}")

        # ── Step 4: Collect all links
        print("\n🔗 Collecting all links...")
        links = page.query_selector_all("a")
        print(f"   Found {len(links)} links\n")

        trapped = False

        for link in links:
            if trapped:
                break

            href = link.get_attribute("href") or ""
            text = link.inner_text().strip()

            # Skip empty or anchor links
            if not href or href.startswith("#"):
                continue

            print(f"   → Queuing link: '{text}' ({href})")

        # ── Step 5: Follow links in order
        print("\n🌐 Following links...")
        for link in links:
            if trapped:
                break

            href = link.get_attribute("href") or ""
            text = link.inner_text().strip()

            if not href or href.startswith("#"):
                continue

            print(f"\n   → Following: '{text}' ({href})")

            try:
                full_url = href if href.startswith("http") else f"{BASE_URL}{href}"
                response = requests.get(
                    full_url,
                    headers={"User-Agent": "GPTBot/1.0"},
                    timeout=5
                )
                print(f"     Status: {response.status_code}")

                # ── Parse the page we landed on
                soup = BeautifulSoup(response.text, "html.parser")
                page_images = soup.find_all("img")

                if page_images:
                    print(f"\n{'=' * 60}")
                    print(f"🎨 Found {len(page_images)} images — downloading metadata...")
                    print(f"{'=' * 60}")
                    for img in page_images[:8]:
                        alt      = img.get("alt", "unknown")
                        category = img.get("data-category", "unknown")
                        author   = img.get("data-author", "unknown")
                        year     = img.get("data-year", "unknown")
                        print(f"   Image: '{alt}'")
                        print(f"   Category: {category}")
                        print(f"   Author:   {author}")
                        print(f"   Year:     {year}")
                        print()
                    print(f"   Queued {len(page_images)} images for training dataset")

                # ── Follow links found on this page too
                sub_links = soup.find_all("a", href=True)
                if sub_links:
                    print(f"\n   Found {len(sub_links)} more links — following...")

                for a in sub_links:
                    a_href = a.get("href", "")
                    a_text = a.text.strip()
                    print(f"   → Following sub-link: '{a_text}' ({a_href})")

                    full_sub_url = f"{API_URL}{a_href}" if a_href.startswith("/") else a_href

                    try:
                        sub_response = requests.get(
                            full_sub_url,
                            headers={"User-Agent": "GPTBot/1.0"},
                            stream=True,
                            timeout=60
                        )

                        # Check if we got a streaming response (the trap)
                        content_type = sub_response.headers.get("content-type", "")
                        transfer = sub_response.headers.get("transfer-encoding", "")

                        if "chunked" in transfer or sub_response.status_code == 200:
                            print(f"\n{'=' * 60}")
                            print(f"⬇️  Downloading data from: {full_sub_url}")
                            print(f"{'=' * 60}")
                            print(f"   Receiving data stream...\n")

                            bytes_count = 0
                            for chunk in sub_response.iter_content(chunk_size=1):
                                print(chunk.decode("utf-8", errors="replace"), end="", flush=True)
                                bytes_count += 1

                    except KeyboardInterrupt:
                        print(f"\n\n{'=' * 60}")
                        print(f"🛑 Connection interrupted after {bytes_count} bytes")
                        print(f"   Stream was infinite — bot trapped FOREVER ♾️")
                        print(f"{'=' * 60}")
                        trapped = True
                        break
                    except requests.exceptions.Timeout:
                        print(f"\n   Connection timed out")

                if trapped:
                    break

            except KeyboardInterrupt:
                trapped = True
                break
            except requests.exceptions.Timeout:
                print(f"     Connection timed out")
            except Exception as e:
                print(f"     Error: {e}")

        # ── Show links never reached
        if trapped:
            print(f"\n\n🚫 Scraper stopped — these links were never reached:")
            for link in links:
                href = link.get_attribute("href") or ""
                text = link.inner_text().strip()
                if href and not href.startswith("#") and text:
                    print(f"   - '{text}': {href} ❌")

        # ── Bot stats
        print(f"\n{'=' * 60}")
        print(f"📊 Session Summary")
        print(f"{'=' * 60}")
        try:
            stats = requests.get(f"{API_URL}/api/bot-stats").json()
            print(f"   Bots detected by target: {stats['total_bots_detected']}")
            print(f"   Bots trapped by target:  {stats['total_bots_trapped']}")
            if stats['recent_bots']:
                latest = stats['recent_bots'][0]
                print(f"\n   This session flagged as:")
                print(f"   - IP:      {latest['ip']}")
                print(f"   - Agent:   {latest['user_agent']}")
                print(f"   - Score:   {latest['score']}")
                print(f"   - Reason:  {', '.join(latest['reasons'])}")
        except Exception as e:
            print(f"   Could not fetch stats: {e}")

        browser.close()

        print(f"\n{'=' * 60}")
        print(f"✅ Scraping session complete")
        print(f"{'=' * 60}")

if __name__ == "__main__":
    scrape_with_playwright()