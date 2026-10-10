# DemandPulse data backend + scrapers

Python 3.9 + FastAPI + PostgreSQL (psycopg2 + plain SQL, no ORM).
Single `platform_listings` table with `platform` column + `raw JSONB` — one table per platform is forbidden.

## Setup (exact commands, run from repo root `VeloStack/`)

```bash
pip install -r backend/requirements.txt
python -m playwright install chromium   # needed for flipkart.com + 1688.com fetches
createdb demandpulse
psql demandpulse -f backend/schema.sql
python backend/seed_categories.py
```

Playwright browsers need `python -m playwright install chromium` (pip package alone is not enough).

## Discover categories (max 1 hit per platform per run, stops a platform on block)

```bash
cd backend
python -m scrapers.discover                  # all 5 platforms
python -m scrapers.discover --platform amazon.in
```

## Listing worker (staggered: 1 req/platform/5min, ~1 hit/min total, 8-10s jitter)

```bash
cd backend
python -m scrapers.worker --once     # 1 request per platform then exit
python -m scrapers.worker --rounds 2 # 2 full rotations then exit
python -m scrapers.worker            # run forever (Ctrl-C to stop)
```

2 consecutive blocks on a platform => auto-cooldown 60 min (logged in `scrape_log`).

## API

```bash
cd backend
uvicorn app:app --reload --port 8000
# GET /health  /api/categories  /api/listings?platform=amazon.in&canonical=headphones&limit=20
# GET /api/listings/123
```

Env overrides: `DEMANDPULSE_DB`, `DEMANDPULSE_USER`, `DEMANDPULSE_HOST`, `DEMANDPULSE_PORT`.
