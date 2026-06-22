# AI Grocery Advisor

An AI-powered grocery decision engine for India — not a price list. Given a
product, it compares every supported quick-commerce platform on **effective
cost** (selling price + delivery + platform + handling fees, not just the
sticker discount) and produces a ranked recommendation: Best Overall,
Cheapest, Fastest, Highest Rated, Best Value — each with a reason.

This repo currently implements one complete vertical slice end-to-end
(Product Search → Pricing Engine → Recommendation Engine → UI) on top of a
production-shaped architecture, so the rest of the roadmap (basket
optimization, bill OCR, offers, reviews, alerts, etc.) can be built the same
way. See `ARCHITECTURE.md` for the full design and what's built vs. planned.

## Stack

- **Backend**: FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Redis (planned for caching/jobs)
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Infra**: Docker Compose

## Running locally

### With Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
docker compose up --build
python -m app.db.seed   # inside the backend container, to load demo data
```

### Without Docker

Backend:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # point DATABASE_URL at your local Postgres
python -m app.db.seed
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Visit `http://localhost:3000` and search "atta" or "butter" — the demo
seed data includes a few products priced across 3-5 platforms each.

## Tests

```bash
cd backend
source .venv/bin/activate
pytest
```
