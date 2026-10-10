-- DemandPulse schema. Load with: psql demandpulse -f backend/schema.sql
-- One table per platform is FORBIDDEN: single listings table + raw JSONB.

CREATE TABLE IF NOT EXISTS canonical_categories (
    id           SERIAL PRIMARY KEY,
    slug         TEXT UNIQUE NOT NULL,
    name_en      TEXT NOT NULL,
    name_hi_hint TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_categories (
    id           SERIAL PRIMARY KEY,
    platform     TEXT NOT NULL,
    raw_name     TEXT NOT NULL,
    url          TEXT NOT NULL,
    canonical_id INTEGER REFERENCES canonical_categories(id) ON DELETE SET NULL,
    UNIQUE (platform, url)
);
CREATE INDEX IF NOT EXISTS idx_platform_categories_platform ON platform_categories(platform);
CREATE INDEX IF NOT EXISTS idx_platform_categories_canonical ON platform_categories(canonical_id);

CREATE TABLE IF NOT EXISTS platform_listings (
    id           SERIAL PRIMARY KEY,
    platform     TEXT NOT NULL,
    platform_pid TEXT,
    url          TEXT UNIQUE NOT NULL,
    title        TEXT,
    price        NUMERIC,
    mrp          NUMERIC,
    rating       NUMERIC,
    review_count INTEGER,
    seller       TEXT,
    image_url    TEXT,
    raw          JSONB,
    fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_platform ON platform_listings(platform);
CREATE INDEX IF NOT EXISTS idx_listings_fetched ON platform_listings(fetched_at DESC);

CREATE TABLE IF NOT EXISTS review_snapshots (
    id           SERIAL PRIMARY KEY,
    listing_id   INTEGER NOT NULL REFERENCES platform_listings(id) ON DELETE CASCADE,
    review_count INTEGER,
    rating       NUMERIC,
    snapped_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_snapshots_listing ON review_snapshots(listing_id, snapped_at DESC);

CREATE TABLE IF NOT EXISTS scrape_log (
    id        SERIAL PRIMARY KEY,
    platform  TEXT NOT NULL,
    url       TEXT NOT NULL,
    status    TEXT NOT NULL,
    http_code INTEGER,
    note      TEXT,
    ran_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scrape_log_platform ON scrape_log(platform, ran_at DESC);
