# ballpark-ticketing-fe

Admin console and booking UI for [ballpark-ticketing-be](https://github.com/MinseokGo/ballpark-ticketing-be).
Calls its API directly from the browser so the API's effects (sections, seats, games, reservations) are
visible instead of just reading raw JSON responses.

## Stack

- React 19 + TypeScript, Vite
- React Router (pages), TanStack Query (API calls)
- Tailwind CSS v4

## Current scope

The consumer screens are the whole app: home (`/`), booking (`/booking`, `/booking/:gameId`), team schedule
(`/schedule`), and My Page (`/profile`). Every screen uses the full browser width and lays its sections out in a
grid. They call the backend's query API for everything they show (game list, seat map, per-section availability)
and the reservation/payment/cancel API for every action. The seat map is a canvas "dome" (`StadiumMap`) where you
tap seats directly.

There is no login. Every reservation uses one fixed user id (`CURRENT_USER_ID` in `src/constants.ts`), sent as the
backend's `X-User-Id` header. There is no user switcher.

`localStorage` holds two things: the booking history of this browser (`src/hooks/useBookingHistory.ts`, since the
backend has no "list my reservations" endpoint yet) and the theme choice (`src/hooks/useTheme.ts`: system, light,
or dark).

The admin screens were removed; the backend's seed profile creates the demo data instead.

## Local demo data

The backend's `seed` profile creates the demo data (see its README): 30 sections (중앙석 / 1·3루 필드석 / 1·3루
외야석, each with A/B/C tiers split into 앞·뒤 blocks, so `StadiumMap` can lay them out like a real park), 22,536
seats, and 5 games (2 opened for booking). Team names are real KBO clubs — the backend's `CLAUDE.md` carves out an
exception for demo/seed data so the booking screen looks like a real schedule; the dates are made up, and there is
no real KBO API integration.

## Pages

| Route | Calls | Notes |
|---|---|---|
| `/` | `GET /api/games` | Home: next-game hero, pending-payment and live summary, my bookings, today's games, upcoming games. |
| `/booking` | `GET /api/games` | Game list with status filters; only `OPEN` games link to the seat map. |
| `/booking/:gameId` | `GET /api/games/{id}`, `.../seats`, `.../sections`, `POST .../reservations`, `POST /api/reservations/{id}/payments`, `POST /api/reservations/{id}/cancel` | Stadium map with zone focus, selected-seat bar fixed to the bottom. Re-fetches after every action so status reflects the server. |
| `/schedule` | `GET /api/games` | Team picker and that team's schedule. Teams are derived from the game list. |
| `/profile` | `GET /api/games` (for dates), `POST /api/reservations/{id}/cancel` | This browser's booking history with stats, status filters, and cancel for unfinished bookings. |

## Running locally

Requirements: Node 20+, and the backend running (see its README for `docker compose up -d` + `./gradlew bootRun`).

```bash
cp .env.example .env.local   # set VITE_API_BASE_URL if the backend isn't on localhost:8080
npm install
npm run dev
# the backend's `seed` profile populates demo games/seats so /booking has something to show
```

The backend needs CORS enabled for this app's origin (`WebConfig`, `app.cors.allowed-origins`, defaults to
`http://localhost:5173`).

## Scripts

```bash
npm run dev      # start the Vite dev server
npm run build    # type-check (tsc -b) and build for production
npm run lint      # oxlint
```
