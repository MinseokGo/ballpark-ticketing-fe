# ballpark-ticketing-fe

Admin console and booking UI for [ballpark-ticketing-be](https://github.com/MinseokGo/ballpark-ticketing-be).
Calls its API directly from the browser so the API's effects (sections, seats, games, reservations) are
visible instead of just reading raw JSON responses.

## Stack

- React 19 + TypeScript, Vite
- React Router (pages), TanStack Query (API calls)
- Tailwind CSS v4

## Current scope

The consumer-facing pages — home (`/`), booking (`/booking`, `/booking/:gameId`), and the profile page
(`/profile`) — are the main app. They call the backend's query API for everything they show (game list, seat
map, per-section availability) and the reservation/payment/cancel API for every action. The seat map is drawn
as a stadium "dome" (`src/components/StadiumMap.tsx`, SVG) you tap to pick a section, then pick seats below it.
`localStorage` is only used for a demo user id (`src/hooks/useUserId.ts`, standing in for real auth — the
backend identifies users by the `X-User-Id` header; v1 has no login) and a "my bookings" history
(`src/hooks/useBookingHistory.ts`, since there's no backend "list my reservations" endpoint yet).

The admin pages (`/admin`, `/admin/sections`, `/admin/seats`, `/admin/games`) are a secondary, de-emphasized
area (one muted "관리자" link in the header) for when the seed script below isn't enough. They only call write
(`POST`) endpoints and don't list existing data — their "registered in this browser" tables are a
`localStorage` memo used to pick a section/game id in another form, not a real data source, and can drift
from what the server actually has (`src/hooks/useLocalRegistry.ts`).

## Local demo data

The backend's own bulk-seeding step (its step 5) isn't built yet, so `scripts/seed-demo-data.sh` creates a
demo dataset through the admin API: 15 sections (중앙석 / 1루·3루 필드석 / 1루·3루 외야석, each split into
A/B/C price tiers — the naming `StadiumMap` reads to lay sections out like a real park), seats, and 5 games
(2 opened for booking). Team names are real KBO clubs — the backend's `CLAUDE.md` carves out an exception for
demo/seed data specifically so the booking screen looks like a real schedule; the dates themselves are made
up, and there's no real KBO API integration.

```bash
BASE_URL=http://localhost:8081 ./scripts/seed-demo-data.sh   # point at wherever the backend is running
```

## Pages

| Route | Calls | Notes |
|---|---|---|
| `/` | `GET /api/games` | Home: hero + a preview of upcoming games. |
| `/booking` | `GET /api/games` | Full game list; only `OPEN` ones link to the seat map. |
| `/booking/:gameId` | `GET /api/games/{id}`, `.../seats`, `.../sections`, `POST .../reservations`, `POST /api/reservations/{id}/payments`, `POST /api/reservations/{id}/cancel` | Tap a section on the stadium map, pick up to 4 `AVAILABLE` seats, reserve, then mark the mock payment success/failure or cancel. Re-fetches after every action so status always reflects the server. |
| `/profile` | — (local only) | Demo user id, and this browser's booking history (`useBookingHistory`). |
| `/admin/sections` | `POST /api/admin/sections` | Section name must be unique (409 `SEAT-006` otherwise) |
| `/admin/seats` | `POST /api/admin/sections/{sectionId}/seats` | Fills a `rowCount` x `seatsPerRow` grid; renders a preview grid (capped at 20x30) |
| `/admin/games` | `POST /api/admin/games` | Also creates one `GameSeat` per existing `Seat`; `ticketOpenAt` must be before `startAt` (400 `GAME-001` otherwise) |

## Running locally

Requirements: Node 20+, and the backend running (see its README for `docker compose up -d` + `./gradlew bootRun`).

```bash
cp .env.example .env.local   # set VITE_API_BASE_URL if the backend isn't on localhost:8080
npm install
npm run dev
./scripts/seed-demo-data.sh  # optional: populate demo games/seats so /booking has something to show
```

The backend needs CORS enabled for this app's origin (`WebConfig`, `app.cors.allowed-origins`, defaults to
`http://localhost:5173`).

## Scripts

```bash
npm run dev      # start the Vite dev server
npm run build    # type-check (tsc -b) and build for production
npm run lint      # oxlint
```
