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
    cats = q_all("SELECT id, slug, name_en, name_hi_hint FROM canonical_categories ORDER BY id")
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
             limit: int = Query(default=20, le=100)):
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
            where.append("(" + " OR ".join(["l.title ILIKE %s"] * len(toks)) + ")")
            params += ["%%%s%%" % t for t in toks]
    sql = ("SELECT l.* FROM platform_listings l"
           + (" WHERE " + " AND ".join(where) if where else "")
           + " ORDER BY l.fetched_at DESC LIMIT %s")
    params.append(limit)
    return {"items": q_all(sql, tuple(params))}


@app.get("/api/listings/{listing_id}")
def listing_detail(listing_id: int):
    row = q_one("SELECT * FROM platform_listings WHERE id = %s", (listing_id,))
    if not row:
        raise HTTPException(404, "listing not found")
    snaps = q_all("SELECT review_count, rating, snapped_at FROM review_snapshots "
                  "WHERE listing_id = %s ORDER BY snapped_at DESC LIMIT 20", (listing_id,))
    row["snapshots"] = snaps
    return row


class IngestItem(BaseModel):
    store: str = ""          # "amazon" | "flipkart"
    title: str = ""
    price: str = ""          # "₹1,799" | "Check Site"
    rating: str = ""         # "#1 Best Seller" | "4.3" ...
    image: str = ""
    link: str = ""
    category: str = ""


class IngestBatch(BaseModel):
    items: list[IngestItem] = []


EXT_STORE_TO_PLATFORM = {"amazon": "amazon.in", "flipkart": "flipkart.com"}


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
                raw = json.dumps({"ext_price_label": it.price, "ext_rating_label": it.rating,
                                  "ext_category": it.category, "source": "extension"})
                cur.execute(
                    """INSERT INTO platform_listings
                       (platform, platform_pid, url, title, price, rating, image_url, raw, fetched_at)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s::jsonb,NOW())
                       ON CONFLICT (url) DO NOTHING""",
                    (platform, pid, it.link, it.title[:500], price_num, None,
                     (it.image or None), raw))
                if cur.rowcount:
                    saved += 1
                else:
                    skipped += 1
        conn.commit()
    finally:
        conn.close()
    # review snapshots only when numeric counts exist (extension sends ranks, not counts)
    return {"saved": saved, "skipped": skipped}
