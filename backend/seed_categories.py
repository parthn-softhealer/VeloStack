# -*- coding: utf-8 -*-
"""Seed canonical categories (English only)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scrapers.db import get_conn

CATEGORIES = [
    ("electronics", "Electronics"),
    ("computers", "Computers & Laptops"),
    ("fashion", "Fashion & Clothing"),
    ("shoes", "Shoes & Footwear"),
    ("watches", "Watches"),
    ("jewellery", "Jewellery"),
    ("bags", "Bags & Luggage"),
    ("kitchen", "Home & Kitchen"),
    ("home-improvement", "Home Improvement"),
    ("furniture", "Furniture"),
    ("beauty", "Beauty"),
    ("health", "Health & Personal Care"),
    ("sports", "Sports & Fitness"),
    ("books", "Books"),
    ("stationery", "Stationery & Office"),
    ("baby", "Baby Products"),
    ("toys", "Toys & Games"),
    ("grocery", "Grocery"),
    ("automotive", "Automotive"),
    ("garden", "Garden & Outdoor"),
    ("pets", "Pet Supplies"),
    ("gaming", "Gaming"),
    ("music", "Musical Instruments"),
]


def main():
    conn = get_conn()
    with conn.cursor() as cur:
        for slug, name_en in CATEGORIES:
            cur.execute(
                "INSERT INTO canonical_categories(slug, name_en) "
                "VALUES (%s, %s) ON CONFLICT (slug) DO NOTHING",
                (slug, name_en),
            )
    conn.commit()
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM canonical_categories")
        print("canonical_categories:", cur.fetchone()[0])
    conn.close()


if __name__ == "__main__":
    main()
