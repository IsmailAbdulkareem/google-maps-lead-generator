# Local Business Lead Generator

Find and qualify local business leads from **Google Places API (New)**. Results are stored **only on your device** (browser localStorage) — no database required.

## Features

- Search by category, city, area, and country
- Rule-based lead scoring and priority bands
- HTTP website checks (no website, outdated heuristics)
- **Device storage** — past searches listed on the home page
- **Export downloads**: CSV, PDF, Word (.docx), JSON
- Filters: all leads, no website, high priority, missing website report
- **Clerk Authentication** — sign up / sign in with email or social providers
- **Clerk Billing** — free trial + Pro plan ($20/month)
- **Daily usage limits** — free: 5 searches & 25 leads/day, Pro: 50 searches & 500 leads/day

## Plans

| Plan | Price | Searches/Day | Leads/Day | Exports |
|------|-------|-------------|-----------|---------|
| Free | $0 | 5 | 25 | CSV |
| Pro | $20/mo | 50 | 500 | CSV, PDF, Word, JSON |

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your keys to `.env.local`:

```env
# Google Places API
GOOGLE_PLACES_API_KEY=your_key_here
MAX_RESULTS_PER_SEARCH=40
WEBSITE_CHECK_TIMEOUT_MS=5000

# Clerk (auth + billing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Google Cloud

Enable **Places API** in [Google Maps APIs](https://console.cloud.google.com/google/maps-apis/api-list):

| API in Console | Endpoint used | Env mode |
|----------------|---------------|----------|
| **Places API** (Enterprise — 100M places) | `places.googleapis.com/v1/places:searchText` | `new` |
| Classic **Places API** (Web Service) | `maps.googleapis.com/maps/api/place/...` | `legacy` |

Default `GOOGLE_PLACES_API_MODE=auto` tries **New** first; if you only enabled the classic API, it automatically falls back to **Legacy**.

1. Enable **Places API** and link billing
2. Create an API key (server-side only)
3. Optional: set `GOOGLE_PLACES_API_MODE=legacy` if you only use the classic Web Service

## Clerk Billing Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) > **Billing** > Enable Billing
2. Create a plan named `pro_plan` at $20/month with features:
   - 50 searches/day
   - 500 leads/day
   - CSV, PDF, Word, JSON exports
   - Advanced lead scoring
   - Priority support
3. In development, use the **Clerk development gateway** for test payments

## Data Privacy

- Search results are saved in **localStorage** on your computer
- Clearing browser data for this site removes saved searches
- Nothing is stored on a server database

## Export Formats

| Format | Description |
|--------|-------------|
| CSV | Spreadsheet-friendly |
| PDF | Printable table report |
| Word | `.docx` document with table |
| JSON | API-style export with all fields |

Exports respect the active filter (e.g. "No website only").

## Lead Scoring

| Condition | Score |
|-----------|-------|
| No website | +50 |
| Rating > 4.0 | +20 |
| Reviews > 100 | +15 |
| Phone available | +10 |
| Operational | +5 |

Priority: **80+** high · **50–79** medium · **below 50** low

## Deploy (Vercel)

Set environment variables in Vercel:

```
GOOGLE_PLACES_API_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## Contact

- **Email**: [ismail233290@gmail.com](mailto:ismail233290@gmail.com)
- **Phone**: [+92 327 967 1138](tel:+923279671138)
- **GitHub**: [IsmailAbdulkareem](https://github.com/IsmailAbdulkareem)
