# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies Pvt. Ltd.
"""Map platform raw category names to the 10 canonical slugs.

Heuristic: case-insensitive substring match of obvious keywords against
platform_categories.raw_name. Run: python seed_alias.py (from backend/).
Safe to re-run: only touches canonical_id, never listings.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scrapers.db import get_conn

# Canonical slug -> obvious raw-name keywords (all matched case-insensitively
# as substrings, e.g. 'saree' matches raw 'Sarees', 'headphones' via 'headphone').
KEYWORDS = {
    "headphones": ["headphone", "earphone", "headset", "earbud", "audio"],
    "smartwatch": ["smartwatch", "smart watch", "watch"],
    "saree": ["saree", "sari"],
    "kurti": ["kurti", "kurta"],
    "mixer-grinder": ["mixer", "grinder", "juicer", "mixie"],
    "toys": ["toy", "game", "baby", "kid", "lego"],
    "shoes": ["shoe", "sneaker", "sandal", "slipper", "footwear",
              "chappal", "boot", "loafer"],
    "bedsheets": ["bedsheet", "bed sheet", "bedding", "blanket",
                  "pillow", "duvet", "quilt", "mattress"],
    "trimmer": ["trimmer", "shaver", "razor", "grooming", "beard"],
    "air-fryer": ["air fryer", "air-fryer", "airfryer", "fryer"],
}


def match_slug(raw_name):
    """Return first canonical slug whose keyword is a substring, else None."""
    lowered = (raw_name or "").lower()
    for slug, keywords in KEYWORDS.items():
        for keyword in keywords:
            if keyword in lowered:
                return slug
    return None


def main():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, slug FROM canonical_categories")
            id_by_slug = {slug: cid for cid, slug in cur.fetchall()}
        missing = [s for s in KEYWORDS if s not in id_by_slug]
        if missing:
            print("missing canonical slugs (run seed_categories.py first):",
                  missing)
            return 1
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, raw_name, canonical_id FROM platform_categories")
            rows = cur.fetchall()
        updated, already, unmatched = 0, 0, 0
        per_slug = {}
        conn2 = get_conn()
        try:
            with conn2.cursor() as cur:
                for row_id, raw_name, canonical_id in rows:
                    slug = match_slug(raw_name)
                    if slug is None:
                        unmatched += 1
                        continue
                    per_slug[slug] = per_slug.get(slug, 0) + 1
                    target_id = id_by_slug[slug]
                    if canonical_id == target_id:
                        already += 1
                        continue
                    cur.execute(
                        "UPDATE platform_categories SET canonical_id = %s "
                        "WHERE id = %s",
                        (target_id, row_id),
                    )
                    updated += 1
            conn2.commit()
        finally:
            conn2.close()
        print("platform_categories scanned: %d" % len(rows))
        print("canonical_id set now: %d (already mapped: %d)" % (updated,
                                                                 already))
        print("unmatched (nav/junk raws left NULL): %d" % unmatched)
        for slug in KEYWORDS:
            print("  %s: %d raw names" % (slug, per_slug.get(slug, 0)))
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
