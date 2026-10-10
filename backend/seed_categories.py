# -*- coding: utf-8 -*-
"""Seed 10 canonical categories with English + Hindi hints."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scrapers.db import get_conn

CATEGORIES = [
    ("headphones", "Headphones", "हेडफोन"),
    ("smartwatch", "Smartwatch", "स्मार्टवॉच"),
    ("saree", "Saree", "साड़ी"),
    ("kurti", "Kurti", "कुर्ती"),
    ("mixer-grinder", "Mixer Grinder", "मिक्सर ग्राइंडर"),
    ("toys", "Toys", "खिलौने"),
    ("shoes", "Shoes", "जूते"),
    ("bedsheets", "Bedsheets", "चादर"),
    ("trimmer", "Trimmer", "ट्रिमर"),
    ("air-fryer", "Air Fryer", "एयर फ्रायर"),
]


def main():
    conn = get_conn()
    with conn.cursor() as cur:
        for slug, name_en, name_hi in CATEGORIES:
            cur.execute(
                "INSERT INTO canonical_categories(slug, name_en, name_hi_hint) "
                "VALUES (%s, %s, %s) ON CONFLICT (slug) DO NOTHING",
                (slug, name_en, name_hi),
            )
    conn.commit()
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM canonical_categories")
        print("canonical_categories:", cur.fetchone()[0])
    conn.close()


if __name__ == "__main__":
    main()
