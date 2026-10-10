# -*- coding: utf-8 -*-
"""Category discovery: fetch each platform's menu/category pages (SAFE PACING FIRST).

Usage:
    python3 scrapers/discover.py                  # all platforms, 1 URL each
    python3 scrapers/discover.py --platform amazon.in
    python3 scrapers/discover.py --platform all --max-per-platform 1

Rules: max 1 URL per platform per run by default, ~10s gap between platforms,
stop a platform on first block (403/429/503/captcha/slider).
"""
import argparse
import random
import re
import time
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from curl_cffi import requests as crequests

from scrapers.db import get_conn, log_scrape

BLOCK_MARKERS = [
    "captcha", "robot check", "are you a robot", "access denied",
    "verify you are human", "drag the slider", "slider", "press & hold",
    "enter the characters you see", "automated access", "request blocked",
    "please verify", "security check", "blocked request",
    "请输入", "滑块", "验证", "人机验证",
]

# One entry URL per platform (discover hits each platform MAX once per run).
TARGETS = {
    "amazon.in": {"method": "curl", "urls": ["https://www.amazon.in/gp/bestsellers/"]},
    "flipkart.com": {"method": "playwright", "urls": ["https://www.flipkart.com/"]},
    "meesho.com": {"method": "curl", "urls": ["https://www.meesho.com/"]},
    "ajio.com": {"method": "curl", "urls": ["https://www.ajio.com/"]},
    "1688.com": {"method": "playwright", "urls": ["https://www.1688.com/"]},
}

CATEGORY_HREF_RE = re.compile(
    r"(categor|depart|browse|nav|collection|search\?|s\?k=|offer_search|bestseller|"
    r"trends?|shop|store|/c/|/t/)", re.I
)


def is_blocked(http_code, body):
    if http_code in (403, 429, 503):
        return True, "http_%d" % http_code
    low = (body or "")[:200000].lower()
    for m in BLOCK_MARKERS:
        if m in low:
            return True, "marker:%s" % m
    return False, ""


def fetch_curl(session, url, timeout=35):
    r = session.get(url, timeout=timeout)
    return r.status_code, r.text


def fetch_playwright(url, timeout_ms=45000):
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
            locale="en-IN",
        )
        page = ctx.new_page()
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            page.wait_for_timeout(4000)
            code = resp.status if resp else 200
            return code, page.content()
        finally:
            ctx.close()
            browser.close()


def parse_categories(html, base_url, limit=50):
    soup = BeautifulSoup(html, "lxml")
    out, seen = [], set()
    for a in soup.find_all("a", href=True):
        text = " ".join(a.get_text(" ", strip=True).split())
        if not (2 <= len(text) <= 60):
            continue
        href = a["href"]
        if href.startswith(("javascript:", "mailto:", "#")):
            continue
        full = urljoin(base_url, href)
        if base_url.split("//")[-1].split("/")[0] not in full:
            continue  # keep same-site links only
        if full in seen:
            continue
        if not CATEGORY_HREF_RE.search(full):
            continue
        seen.add(full)
        out.append((text[:120], full[:1000]))
        if len(out) >= limit:
            break
    return out


def discover_platform(conn, session, platform, cfg, max_per_platform=1):
    method = cfg["method"]
    urls = cfg["urls"][:max_per_platform]
    total_new = 0
    for url in urls:
        try:
            if method == "curl":
                code, body = fetch_curl(session, url)
            else:
                code, body = fetch_playwright(url)
        except Exception as e:  # network/timeout: log + stop platform
            log_scrape(conn, platform, url, "error", None, str(e)[:400])
            print("[%s] ERROR %s: %s" % (platform, url, str(e)[:200]))
            return total_new, True
        blocked, reason = is_blocked(code, body)
        if blocked or not body or len(body) < 2000:
            if not blocked:
                reason = "empty_or_tiny_body_%d" % len(body or "")
            log_scrape(conn, platform, url, "blocked", code, reason[:400])
            print("[%s] BLOCKED %s (http=%s note=%s) - stopping platform"
                  % (platform, url, code, reason[:120]))
            return total_new, True
        cats = parse_categories(body, url)
        new = 0
        with conn.cursor() as cur:
            for raw_name, curl_ in cats:
                cur.execute(
                    "INSERT INTO platform_categories(platform, raw_name, url) "
                    "VALUES (%s, %s, %s) ON CONFLICT (platform, url) DO NOTHING",
                    (platform, raw_name, curl_),
                )
                new += cur.rowcount
        conn.commit()
        log_scrape(conn, platform, url, "ok", code,
                   "stored=%d parsed=%d" % (new, len(cats)))
        print("[%s] OK %s http=%s parsed=%d new=%d"
              % (platform, url, code, len(cats), new))
        total_new += new
    return total_new, False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--platform", default="all")
    ap.add_argument("--max-per-platform", type=int, default=1)
    args = ap.parse_args()

    plats = list(TARGETS) if args.platform == "all" else [args.platform]
    for p in plats:
        assert p in TARGETS, "unknown platform: %s" % p

    conn = get_conn()
    session = crequests.Session(impersonate="chrome")
    blocked = []
    for i, platform in enumerate(plats):
        if i > 0:  # gentle gap between platforms
            time.sleep(random.uniform(8, 10))
        _, stopped = discover_platform(
            conn, session, platform, TARGETS[platform], args.max_per_platform)
        if stopped:
            blocked.append(platform)
    conn.close()
    print("done. blocked/stopped:", blocked or "none")


if __name__ == "__main__":
    main()
