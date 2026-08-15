# AI Travel Planner

MERN skeleton: React client, Express API, MongoDB, health check.

## Run locally

1. Copy `server/.env.example` to `server/.env` if needed. Default `MONGO_URI=memory` runs an in-process MongoDB (no local install). For a real MongoDB, set `MONGO_URI=mongodb://127.0.0.1:27017/ai_travel_planner`.
2. Install and start the API:

```bash
cd server
npm install
npm run dev
```

3. Install and start the client:

```bash
cd client
npm install
npm run dev
```

- API: http://localhost:5050/api/health
- App: http://localhost:5173

The home page calls `/api/health` (proxied to Express) and shows `db: connected` when Mongo is up.

## Generate itinerary

On a saved trip, click **Generate itinerary**. The API geocodes the city, fetches Open-Meteo, then asks an LLM for JSON (itinerary, budget, packing). If no `GEMINI_API_KEY` / `OPENAI_API_KEY` is set, it still builds a weather-aware plan.

## Auth (demo)

- Register at http://localhost:5173/register — creates a **traveler**.
- Admin (seeded on API start): `admin@travel.local` / `Admin123!`
- Change `JWT_SECRET` and admin credentials in `server/.env`.
