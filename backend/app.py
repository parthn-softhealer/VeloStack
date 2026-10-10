# -*- coding: utf-8 -*-
"""DemandPulse FastAPI app. Run: uvicorn app:app --reload  (from backend/)."""
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scrapers.db import get_conn

app = FastAPI(title="DemandPulse")

# Browser frontend calls this API cross-origin (localhost + LAN for demos).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def q_all(sql, params=()):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        conn.close()


def q_one(sql, params=()):
    rows = q_all(sql, params)
    return rows[0] if rows else None


@app.get("/health")
def health():
    q_one("SELECT 1 AS ok")
    return {"ok": True}


PLATFORM_ALIASES = {
    "amazon": "amazon.in",
    "amazon.in": "amazon.in",
    "flipkart": "flipkart.com",
    "flipkart.com": "flipkart.com",
    "meesho": "meesho",
    "ajio": "ajio",
    "1688": "1688",
}


def normalize_platform(platform):
    """Accept short tab names ('amazon') and full keys ('amazon.in')."""
    if not platform:
        return None
    return PLATFORM_ALIASES.get(platform.strip().lower(), platform)


@app.get("/api/categories")
def categories():
    """Canonical categories + per-platform raw names.

    Shape: {canonical: [...], platforms: {platform: [raw_name, ...]},
            mapping: {slug: {platform: [raw_name, ...]}}}.
    Only curated rows (canonical_id set by seed_alias.py) appear in
    platforms/mapping; unmapped nav/junk raws stay NULL and are excluded.
    """
    cats = q_all("SELECT id, slug, name_en FROM canonical_categories ORDER BY id")
    raws = q_all("SELECT pc.platform, pc.raw_name, cc.slug AS canonical_slug "
                 "FROM platform_categories pc "
                 "JOIN canonical_categories cc ON cc.id = pc.canonical_id "
                 "ORDER BY pc.platform, pc.id")
    platforms = {}
    mapping = {}
    for row in raws:
        platforms.setdefault(row["platform"], []).append(row["raw_name"])
        mapping.setdefault(row["canonical_slug"], {}).setdefault(
            row["platform"], []).append(row["raw_name"])
    return {"canonical": cats, "platforms": platforms, "mapping": mapping}


@app.get("/api/listings")
def listings(platform: Optional[str] = Query(default=None),
             canonical: Optional[str] = Query(default=None, description="canonical slug"),
             limit: int = Query(default=1000, le=5000)):
    """List listings. canonical slug -> heuristic title-keyword match until
    platform_categories.canonical_id mapping is curated."""
    where, params = [], []
    platform = normalize_platform(platform)
    if platform:
        where.append("l.platform = %s")
        params.append(platform)
    if canonical:
        toks = [t for t in canonical.replace("-", " ").split() if t]
        if toks:
            # Stored category column first, then extension raw, then title.
            where.append("(l.category ILIKE %s OR (l.raw ->> 'ext_category') ILIKE %s OR "
                         "(" + " OR ".join(["l.title ILIKE %s"] * len(toks)) + "))")
            params += ["%%%s%%" % canonical, "%%%s%%" % canonical] + ["%%%s%%" % t for t in toks]
    sql = ("SELECT l.*, l.raw ->> 'ext_category' AS ext_category FROM platform_listings l"
           + (" WHERE " + " AND ".join(where) if where else "")
           + " ORDER BY l.fetched_at DESC LIMIT %s")
    params.append(limit)
    return {"items": q_all(sql, tuple(params))}


@app.get("/api/listings/{listing_id}")
def listing_detail(listing_id: int):
    row = q_one("SELECT *, raw ->> 'ext_category' AS ext_category FROM platform_listings WHERE id = %s", (listing_id,))
    if not row:
        raise HTTPException(404, "listing not found")
    snaps = q_all("SELECT review_count, rating, snapped_at FROM review_snapshots "
                  "WHERE listing_id = %s ORDER BY snapped_at DESC LIMIT 20", (listing_id,))
    row["snapshots"] = snaps
    return row


class IngestItem(BaseModel):
    store: str = ""          # "amazon" | "flipkart" | "meesho"
    title: str = ""
    price: str = ""          # "₹1,799" | "Check Site"
    originalPrice: str = ""  # MRP label ("₹2,999" | "N/A")
    rating: str = ""         # "#1 Best Seller" | "4.3" ...
    starRating: str = ""     # "4.3★" | "N/A"
    reviewCount: str = ""    # "1234" | "N/A"
    discount: str = ""       # "60% off" | "N/A"
    stockText: str = ""      # "Only 2 left" | ""
    image: str = ""
    link: str = ""
    category: str = ""


class IngestBatch(BaseModel):
    items: list[IngestItem] = []


EXT_STORE_TO_PLATFORM = {"amazon": "amazon.in", "flipkart": "flipkart.com", "meesho": "meesho"}


def _canon_category(cat: str) -> str:
    """Extension category key -> canonical slug stored in `category` column."""
    return (cat or "").strip().lower().replace("  ", " ") or None


def _pid_from_link(link: str) -> str:
    import hashlib
    import re
    m = re.search(r"/dp/([A-Z0-9]{10})", link or "")
    if m:
        return m.group(1)
    m = re.search(r"[?&]pid=([A-Z0-9]+)", link or "")
    if m:
        return m.group(1)
    return hashlib.md5((link or "").encode()).hexdigest()[:16]


def _price_to_num(price: str):
    import re
    m = re.search(r"([\d][\d,\.]*)", (price or "").replace("₹", ""))
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", ""))
    except ValueError:
        return None


def _rating_to_num(rating: str):
    import re
    m = re.search(r"([0-5](?:\.\d)?)", rating or "")
    if not m:
        return None
    try:
        v = float(m.group(1))
        return v if 0 < v <= 5 else None
    except ValueError:
        return None


def _count_to_num(count: str):
    import re
    m = re.search(r"([\d,]+)", (count or "").replace(" ", ""))
    if not m:
        return None
    try:
        return int(m.group(1).replace(",", ""))
    except ValueError:
        return None


@app.post("/api/ingest")
def ingest(batch: IngestBatch):
    """Extension -> DB. Upserts listings by (platform, pid); stores rank
    labels + extension category inside raw JSONB. No fake data: only what
    the extension actually scraped."""
    import json
    saved = 0
    skipped = 0
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            for it in batch.items:
                platform = EXT_STORE_TO_PLATFORM.get((it.store or "").lower(), it.store)
                pid = _pid_from_link(it.link)
                if not it.title or not it.link:
                    continue
                price_num = _price_to_num(it.price)
                mrp_num = _price_to_num(it.originalPrice)
                rating_num = _rating_to_num(it.starRating) or _rating_to_num(it.rating)
                count_num = _count_to_num(it.reviewCount)
                raw = json.dumps({"ext_price_label": it.price, "ext_rating_label": it.rating,
                                  "ext_category": it.category, "source": "extension"})
                cur.execute(
                    """INSERT INTO platform_listings
                       (platform, platform_pid, url, title, price, mrp, rating,
                        review_count, image_url, discount_text, stock_text, category, raw, fetched_at)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,NOW())
                       ON CONFLICT (platform, platform_pid) DO UPDATE SET
                         fetched_at = NOW()
                       RETURNING id, (xmax = 0) AS inserted""",
                    (platform, pid, it.link, it.title[:500], price_num, mrp_num,
                     rating_num, count_num, (it.image or None),
                     (it.discount or None) or None, (it.stockText or None) or None,
                     _canon_category(it.category), raw))
                row = cur.fetchone()
                if row and row[1]:
                    saved += 1
                    if count_num is not None:
                        cur.execute(
                            "INSERT INTO review_snapshots (listing_id, review_count, rating)"
                            " VALUES (%s,%s,%s)", (row[0], count_num, rating_num))
                else:
                    skipped += 1
        conn.commit()
    finally:
        conn.close()
    # review snapshots only when numeric counts exist (extension sends ranks, not counts)
    return {"saved": saved, "skipped": skipped}
