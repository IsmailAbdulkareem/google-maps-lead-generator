# Local Business Lead Generator

Find and qualify local business leads from **Google Places API (New)**. Results are stored **only on your device** (browser localStorage) — no database required.

## Features

- Search by category, city, area, and country
- Rule-based lead scoring and priority bands
- HTTP website checks (no website, outdated heuristics)
- **Device storage** — past searches listed on the home page
- **Export downloads**: CSV, PDF, Word (.docx), JSON
- Filters: all leads, no website, high priority, missing website report

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your Google Places API key to `.env.local`:

```env
GOOGLE_PLACES_API_KEY=your_key_here
MAX_RESULTS_PER_SEARCH=40
WEBSITE_CHECK_TIMEOUT_MS=5000
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

**New API endpoint (default):**
```
POST https://places.googleapis.com/v1/places:searchText
Headers: X-Goog-Api-Key, X-Goog-FieldMask
```

**Legacy API endpoint (fallback):**
```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
GET https://maps.googleapis.com/maps/api/place/details/json
```

## Data privacy

- Search results are saved in **localStorage** on your computer
- Clearing browser data for this site removes saved searches
- Nothing is stored on a server database

## Export formats

| Format | Description |
|--------|-------------|
| CSV | Spreadsheet-friendly |
| PDF | Printable table report |
| Word | `.docx` document with table |
| JSON | API-style export with all fields |

Exports respect the active filter (e.g. “No website only”).

## Lead scoring

| Condition | Score |
|-----------|-------|
| No website | +50 |
| Rating > 4.0 | +20 |
| Reviews > 100 | +15 |
| Phone available | +10 |
| Operational | +5 |

Priority: **80+** high · **50–79** medium · **below 50** low

## Deploy (Vercel)

Set `GOOGLE_PLACES_API_KEY` in Vercel environment variables. No database env vars needed.
