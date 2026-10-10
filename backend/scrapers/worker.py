# -*- coding: utf-8 -*-
"""Listing worker: staggered loop, EXACTLY 1 request per platform per 5 minutes.

Pacing: 5 platforms rotate, ~60s + 8-10s jitter between ANY two requests, so each
platform is hit at most once per ~5-6 min. Sessions reused. On 2 consecutive
blocks for a platform: auto-cooldown 60 min + log. Only real page data stored.

Usage:
    python3 scrapers/worker.py --once        # 1 request per platform, then exit
    python3 scrapers/worker.py --rounds 3    # 3 full rotations
    python3 scrapers/worker.py               # run forever
"""
import argparse
import json
import random
import re
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from curl_cffi import requests as crequests

from scrapers.db import get_conn, log_scrape

BLOCK_MARKERS = [
    "captcha", "robot check", "are you a robot", "access denied",
    "verify you are human", "drag the slider", "slider", "press & hold",
    "enter the characters you see", "automated access", "request blocked",
    "please verify", "security check",
    "请输入", "滑块", "验证", "人机验证",
]
BLOCK_CODES = (403, 429, 503)

# Start seeds: one landing page per platform (rotated, 1 hit per cycle each).
SEEDS = {
    "amazon.in": [
        "https://www.amazon.in/gp/bestsellers/",
    ],
    "flipkart.com": [
        "https://www.flipkart.com/search?q=headphones",
    ],
    "meesho.com": [
        "https://www.meesho.com/search?q=saree",
    ],
    "ajio.com": [
        "https://www.ajio.com/search/?text=headphones",
    ],
    "1688.com": [
        "https://s.1688.com/selloffer/offer_search.htm?keywords=headphones",
    ],
}
PLAYWRIGHT_PLATFORMS = {"flipkart.com", "1688.com"}
BETWEEN_REQUESTS_BASE = 60  # seconds; + 8-10s jitter => ~1 hit/min total
COOLDOWN_MIN = 60
MAX_LISTINGS_PER_PAGE = 20

PRICE_RE = re.compile(r"(?:₹|Rs\.?|INR|¥|￥|\$)\s*([\d,]+(?:\.\d{1,2})?)")
NUM_RE = re.compile(r"([\d,]+(?:\.\d+)?)")

PLACEHOLDER_RE = re.compile(
    r"(data:image|transparent|pixel\.gif|grey-pixel|loading|spinner|blank\.gif)",
    re.I)


def pick_img_src(img, seed_url):
    """Best-effort src pick from an <img>: lazy attrs + srcset first.

    Amazon search/bestseller HTML lazy-loads: real URL lives in data-src /
    data-old-hires / srcset while src is a 1px placeholder. Returns absolute
    URL or None. Prefers m.media-amazon.com hosts but accepts any http URL.
    """
    if img is None:
        return None
    cands = []
    for attr in ("data-old-hires", "data-src", "data-lazy-src",
                 "data-original", "src"):
        try:
            v = img.get(attr)
        except AttributeError:
            v = None
        if v and isinstance(v, str) and v.strip():
            cands.append(v.strip())
    for attr in ("data-srcset", "srcset"):
        try:
            ss = img.get(attr)
        except AttributeError:
            ss = None
        if ss and isinstance(ss, str):
            first = ss.split(",")[0].strip().split(" ")[0].strip()
            if first:
                cands.append(first)
    # Amazon dynamic-image JSON: {"https://m.media-...jpg": [450, 450], ...}
    try:
        dyn = img.get("data-a-dynamic-image")
    except AttributeError:
        dyn = None
    if dyn and isinstance(dyn, str) and "media-amazon" in dyn:
        try:
            keys = list(json.loads(dyn).keys())
            if keys:
                cands.append(keys[0])
        except (ValueError, TypeError):
            pass
    for c in cands:
        if not c or c.startswith("data:"):
            continue
        if PLACEHOLDER_RE.search(c):
            continue
        return urljoin(seed_url, c)[:1000]
    return None


def find_product_img(anchor, seed_url):
    """Find product image for a result anchor.

    1) <img> directly inside the anchor (search results).
    2) Sibling/parent container img (Amazon bestsellers group the image and
       the title in separate anchors under one div, so the title anchor has
       no <img> child). Walk up max 2 levels and take the first real img.
    """
    img = anchor.find("img")
    u = pick_img_src(img, seed_url)
    if u:
        return u
    parent = getattr(anchor, "parent", None)
    for _ in range(2):
        if parent is None or getattr(parent, "find_all", None) is None:
            break
        for im in parent.find_all("img", limit=6):
            u = pick_img_src(im, seed_url)
            if u:
                return u
        parent = getattr(parent, "parent", None)
    return None


NUM_RE = re.compile(r"([\d,]+(?:\.\d+)?)")
RATING_RE = re.compile(r"(\d\.\d)\s*(?:out of 5|stars?|★|rating)", re.I)
REVIEWS_RE = re.compile(r"([\d,]+)\s*(?:ratings?|reviews?|ratings?\s*&\s*reviews?)", re.I)
# Anchors that are site chrome, never products.
SKIP_HREF_RE = re.compile(
    r"(login|signin|/auth|/gp/cart|/css/|site-directory|/help/|customer-service|"
    r"order-history|sva/dashboard|nav_cust|cart/view|offers-list|/mcheckout)",
    re.I)
# Anchors that look like real product pages (checked first).
PRODUCT_HREF_RE = re.compile(
    r"(/dp/[A-Z0-9]{10}|/p/itm|/product/|/goods/|/offer/\d+|/itm[A-Za-z0-9]{10,}|pid=)",
    re.I)
PID_RES = [
    re.compile(r"/dp/([A-Z0-9]{10})"),
    re.compile(r"[?&]pid=([A-Za-z0-9]+)"),
    re.compile(r"product[-_/](\d{6,})"),
    re.compile(r"offer/(\d+\.html)"),
]


def is_blocked(http_code, body):
    if http_code in BLOCK_CODES:
        return True, "http_%d" % http_code
    low = (body or "")[:200000].lower()
    for m in BLOCK_MARKERS:
        if m in low:
            return True, "marker:%s" % m
    return False, ""


def parse_price(text):
    if not text:
        return None
    m = PRICE_RE.search(text)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", ""))
    except ValueError:
        return None


def guess_pid(url):
    for rx in PID_RES:
        m = rx.search(url or "")
        if m:
            return m.group(1)[:64]
    return None


def extract_listings(platform, html, seed_url):
    """Best-effort parse of real page content. Missing fields stay None."""
    soup = BeautifulSoup(html, "lxml")
    rows = []

    # 1) JSON-LD Product blocks (most reliable where present).
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
        except (ValueError, TypeError):
            continue
        items = data if isinstance(data, list) else [data]
        for it in items:
            if not isinstance(it, dict):
                continue
            if it.get("@type") != "Product" and "Product" not in str(it.get("@type", "")):
                continue
            name = it.get("name")
            offers = it.get("offers") or {}
            if isinstance(offers, list):
                offers = offers[0] if offers else {}
            agg = it.get("aggregateRating") or {}
            url = it.get("url") or it.get("@id") or seed_url
            try:
                price = float(str(offers.get("price", "")).replace(",", "")) \
                    if offers.get("price") else None
            except ValueError:
                price = None
            try:
                rating = float(agg.get("ratingValue")) if agg.get("ratingValue") else None
            except (ValueError, TypeError):
                rating = None
            try:
                rc = int(str(agg.get("reviewCount", "")).replace(",", "")) \
                    if agg.get("reviewCount") else None
            except (ValueError, TypeError):
                rc = None
            img_raw = it.get("image")
            if isinstance(img_raw, list):
                img_raw = img_raw[0] if img_raw else None
            if isinstance(img_raw, dict):
                img_raw = img_raw.get("url")
            img_url = urljoin(seed_url, str(img_raw))[:1000] \
                if img_raw else None
            rows.append({
                "platform": platform, "platform_pid": guess_pid(str(url)),
                "url": urljoin(seed_url, str(url))[:1000],
                "title": (str(name)[:300] if name else None),
                "price": price, "mrp": None, "rating": rating,
                "review_count": rc, "seller": None, "image_url": img_url,
                "raw": {"from": "json-ld", "seed": seed_url},
            })
            if len(rows) >= MAX_LISTINGS_PER_PAGE:
                return rows

    # 2) Generic fallback: product-looking anchors + nearby text.
    # Pass 1 = product URLs only, pass 2 = anything else (nav filtered out).
    host = urlparse(seed_url).netloc
    seen = set()

    def anchor_title(a, img):
        text = " ".join(a.get_text(" ", strip=True).split())
        if text and len(text) >= 10:
            return text[:300]
        if img is not None and img.get("alt", "").strip():
            return img.get("alt", "").strip()[:300]
        return text[:300] if text else None

    def nearby_text(a):
        parent = a.parent
        if parent is not None:
            return " ".join(parent.get_text(" ", strip=True).split())[:600]
        return ""

    def try_anchor(a):
        href = a["href"]
        if href.startswith(("javascript:", "mailto:", "#")):
            return
        if SKIP_HREF_RE.search(href):
            return
        full = urljoin(seed_url, href)
        if host not in full or full in seen or len(full) > 1000:
            return
        img = a.find("img")
        title = anchor_title(a, img)
        if not title or len(title) < 10:
            return
        context = title + " " + nearby_text(a)
        m_r = RATING_RE.search(context)
        m_c = REVIEWS_RE.search(context)
        try:
            rating = float(m_r.group(1)) if m_r else None
        except ValueError:
            rating = None
        try:
            rc = int(m_c.group(1).replace(",", "")) if m_c else None
        except ValueError:
            rc = None
        img_url = find_product_img(a, seed_url)
        seen.add(full)
        rows.append({
            "platform": platform, "platform_pid": guess_pid(full),
            "url": full, "title": title,
            "price": parse_price(context), "mrp": None,
            "rating": rating, "review_count": rc, "seller": None,
            "image_url": img_url,
            "raw": {"from": "anchor", "seed": seed_url,
                    "anchor_text": title[:200]},
        })

    anchors = soup.find_all("a", href=True)
    for a in anchors:  # pass 1: real product pages first
        if len(rows) >= MAX_LISTINGS_PER_PAGE:
            return rows
        if PRODUCT_HREF_RE.search(a["href"]):
            try_anchor(a)
    for a in anchors:  # pass 2: other same-site links (nav excluded)
        if len(rows) >= MAX_LISTINGS_PER_PAGE:
            break
        if not PRODUCT_HREF_RE.search(a["href"]):
            if re.search(r"(dp/|/gp/|product|/p/|offer|search|itm|goods)", a["href"], re.I):
                try_anchor(a)
    return rows


def store_listings(conn, rows):
    listing_ids = []
    with conn.cursor() as cur:
        for r in rows:
            cur.execute(
                """INSERT INTO platform_listings
                   (platform, platform_pid, url, title, price, mrp, rating,
                    review_count, seller, image_url, raw)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb)
                   ON CONFLICT (url) DO UPDATE SET
                      title=EXCLUDED.title, price=EXCLUDED.price, mrp=EXCLUDED.mrp,
                      rating=EXCLUDED.rating, review_count=EXCLUDED.review_count,
                      seller=EXCLUDED.seller,
                      image_url=COALESCE(EXCLUDED.image_url, platform_listings.image_url),
                      raw=EXCLUDED.raw, fetched_at=NOW()
                   RETURNING id""",
                (r["platform"], r["platform_pid"], r["url"], r["title"], r["price"],
                 r["mrp"], r["rating"], r["review_count"], r["seller"],
                 r["image_url"], json.dumps(r["raw"])),
            )
            lid = cur.fetchone()[0]
            listing_ids.append(lid)
            if r["rating"] is not None or r["review_count"] is not None:
                cur.execute(
                    "INSERT INTO review_snapshots(listing_id, review_count, rating)"
                    " VALUES (%s, %s, %s)",
                    (lid, r["review_count"], r["rating"]),
                )
    conn.commit()
    return listing_ids


def fetch_curl(session, url, timeout=35):
    r = session.get(url, timeout=timeout)
    return r.status_code, r.text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true",
                    help="one request per platform then exit")
    ap.add_argument("--rounds", type=int, default=0,
                    help="full rotations then exit (0 = forever)")
    args = ap.parse_args()

    conn = get_conn()
    sessions = {p: crequests.Session(impersonate="chrome")
                for p in SEEDS if p not in PLAYWRIGHT_PLATFORMS}
    pw = None  # lazy playwright browser reused across flipkart/1688 fetches
    order = list(SEEDS.keys())
    seed_idx = {p: 0 for p in SEEDS}
    consec_blocks = {p: 0 for p in SEEDS}
    cooldown_until = {p: None for p in SEEDS}

    def fetch_pw(url):
        nonlocal pw
        if pw is None:
            from playwright.sync_api import sync_playwright
            pw = sync_playwright().start()
            pw._browser = pw.chromium.launch(headless=True)
            pw._ctx = pw._browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
                locale="en-IN")
        page = pw._ctx.new_page()
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(4000)
            return (resp.status if resp else 200), page.content()
        finally:
            page.close()

    rot = 0
    try:
        while True:
            rot += 1
            # rotate platform order each round
            order = order[1:] + order[:1]
            for i, platform in enumerate(order):
                now = datetime.now(timezone.utc)
                if cooldown_until[platform] and now < cooldown_until[platform]:
                    print("[%s] in cooldown until %s - skip"
                          % (platform, cooldown_until[platform]))
                    continue
                seeds = SEEDS[platform]
                url = seeds[seed_idx[platform] % len(seeds)]
                seed_idx[platform] += 1
                try:
                    if platform in PLAYWRIGHT_PLATFORMS:
                        code, body = fetch_pw(url)
                    else:
                        code, body = fetch_curl(sessions[platform], url)
                except Exception as e:
                    log_scrape(conn, platform, url, "error", None, str(e)[:400])
                    print("[%s] ERROR %s: %s" % (platform, url, str(e)[:200]))
                    consec_blocks[platform] += 1
                    code, body = None, ""
                    blocked, reason = True, "fetch_error"
                else:
                    blocked, reason = is_blocked(code, body)
                    if blocked or not body or len(body) < 2000:
                        if not blocked:
                            reason = "empty_or_tiny_body_%d" % len(body or "")
                            blocked = True
                if blocked:
                    consec_blocks[platform] += 1
                    log_scrape(conn, platform, url, "blocked", code, reason[:400])
                    print("[%s] BLOCKED %s (http=%s %s) streak=%d"
                          % (platform, url, code, reason[:100], consec_blocks[platform]))
                    if consec_blocks[platform] >= 2:
                        cooldown_until[platform] = now + timedelta(minutes=COOLDOWN_MIN)
                        log_scrape(conn, platform, url, "cooldown", code,
                                   "auto-cooldown 60min after 2 consecutive blocks")
                        print("[%s] auto-cooldown 60 min" % platform)
                else:
                    consec_blocks[platform] = 0
                    rows = extract_listings(platform, body, url)
                    n = len(store_listings(conn, rows)) if rows else 0
                    log_scrape(conn, platform, url, "ok", code,
                               "listings=%d bytes=%d" % (n, len(body)))
                    print("[%s] OK %s http=%s bytes=%d listings=%d"
                          % (platform, url, code, len(body), n))
                last_in_round = (i == len(order) - 1)
                done_once = args.once and last_in_round and rot == 1
                done_rounds = args.rounds and rot >= args.rounds and last_in_round
                if done_once or done_rounds:
                    print("worker finished (once/rounds reached).")
                    return
                # stagger: ~60s + 8-10s jitter between requests
                time.sleep(BETWEEN_REQUESTS_BASE + random.uniform(8, 10))
    finally:
        try:
            if pw is not None:
                pw._ctx.close()
                pw._browser.close()
                pw.stop()
        except Exception:
            pass
        conn.close()


if __name__ == "__main__":
    main()
