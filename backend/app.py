# -*- coding: utf-8 -*-
"""DemandPulse FastAPI app. Run: uvicorn app:app --reload  (from backend/)."""
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from scrapers.db import get_conn

app = FastAPI(title="DemandPulse")

# Browser frontend calls this API cross-origin (localhost + LAN for demos).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
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
