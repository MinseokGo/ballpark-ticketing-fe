# ballpark-ticketing-fe

Admin console and booking UI for [ballpark-ticketing-be](https://github.com/MinseokGo/ballpark-ticketing-be).
Calls its API directly from the browser so the API's effects (sections, seats, games, reservations) are
visible instead of just reading raw JSON responses.

## Stack

- React 19 + TypeScript, Vite
- React Router (pages), TanStack Query (API calls)
- Tailwind CSS v4

## Current scope

The admin pages (`/sections`, `/seats`, `/games`) only call write (`POST`) endpoints and don't list existing
data — their "registered in this browser" tables are a `localStorage` memo used to pick a section/game id in
another form, not a real data source, and can drift from what the server actually has
(`src/hooks/useLocalRegistry.ts`).

The booking pages (`/booking`, `/booking/:gameId`) are different: they call the backend's query API for
everything they show (game list, seat map, per-section availability) and the reservation/payment/cancel API
for every action. The only thing kept in `localStorage` there is a demo user id (`src/hooks/useUserId.ts`),
standing in for real auth (the backend identifies users by the `X-User-Id` header; v1 has no login).

## Local demo data

The backend's own bulk-seeding step (its step 5) isn't built yet, so `scripts/seed-demo-data.sh` creates a
small demo dataset through the admin API: 3 sections, seats, and 5 games (2 opened for booking). Team names
are real KBO clubs — the backend's `CLAUDE.md` carves out an exception for demo/seed data specifically so the
booking screen looks like a real schedule; the dates themselves are made up, and there's no real KBO API
integration.

```bash
BASE_URL=http://localhost:8081 ./scripts/seed-demo-data.sh   # point at wherever the backend is running
```

## Pages

| Route | Calls | Notes |
|---|---|---|
| `/booking` | `GET /api/games` | Lists games; only `OPEN` ones link to the seat map. |
| `/booking/:gameId` | `GET /api/games/{id}/seats`, `GET /api/games/{id}/sections`, `POST .../reservations`, `POST /api/reservations/{id}/payments`, `POST /api/reservations/{id}/cancel` | Pick up to 4 `AVAILABLE` seats, reserve, then mark the mock payment success/failure or cancel. The seat map re-fetches after every action, so status colors always reflect the server. |
| `/sections` | `POST /api/admin/sections` | Section name must be unique (409 `SEAT-006` otherwise) |
| `/seats` | `POST /api/admin/sections/{sectionId}/seats` | Fills a `rowCount` x `seatsPerRow` grid; renders a preview grid (capped at 20x30) |
| `/games` | `POST /api/admin/games` | Also creates one `GameSeat` per existing `Seat`; `ticketOpenAt` must be before `startAt` (400 `GAME-001` otherwise) |

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
