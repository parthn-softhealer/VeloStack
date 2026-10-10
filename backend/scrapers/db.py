# -*- coding: utf-8 -*-
"""Shared DB helper: plain psycopg2, no ORM."""
import os
import psycopg2
import psycopg2.extras

DBNAME = os.environ.get("DEMANDPULSE_DB", "demandpulse")
DBUSER = os.environ.get("DEMANDPULSE_USER") or os.environ.get("USER")
DBHOST = os.environ.get("DEMANDPULSE_HOST", "/tmp")
DBPORT = os.environ.get("DEMANDPULSE_PORT", "5432")


def get_conn():
    return psycopg2.connect(dbname=DBNAME, user=DBUSER, host=DBHOST, port=DBPORT)


def log_scrape(conn, platform, url, status, http_code=None, note=None):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO scrape_log(platform, url, status, http_code, note) "
            "VALUES (%s, %s, %s, %s, %s)",
            (platform, url, status, http_code, note),
        )
    conn.commit()
