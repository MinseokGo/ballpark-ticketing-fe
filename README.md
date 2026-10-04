# ballpark-ticketing-fe

Admin console for [ballpark-ticketing-be](https://github.com/MinseokGo/ballpark-ticketing-be). Calls its
admin API directly from the browser so the API's effects (sections, seats, games) are visible instead of
just reading raw JSON responses.

## Stack

- React 19 + TypeScript, Vite
- React Router (pages), TanStack Query (API calls)
- Tailwind CSS v4

## Current scope

The backend currently only exposes write (`POST`) admin endpoints — there is no query (`GET`) API yet (planned
for its step 3, "조회 API"). So this app can only show the result of each creation call right away; it does not
list or browse existing data from the server. The "registered in this browser" tables on each page are just a
`localStorage` memo used to pick a section/game id in another form — not a real data source, and can drift from
what the server actually has. Once the backend adds query endpoints, these pages should switch to fetching real
lists instead.

## Pages

| Route | Calls | Notes |
|---|---|---|
| `/sections` | `POST /api/admin/sections` | Section name must be unique (409 `SEAT-006` otherwise) |
| `/seats` | `POST /api/admin/sections/{sectionId}/seats` | Fills a `rowCount` x `seatsPerRow` grid; renders a preview grid (capped at 20x30) |
| `/games` | `POST /api/admin/games` | Also creates one `GameSeat` per existing `Seat`; `ticketOpenAt` must be before `startAt` (400 `GAME-001` otherwise) |

## Running locally

Requirements: Node 20+, and the backend running (see its README for `docker compose up -d` + `./gradlew bootRun`).

```bash
cp .env.example .env.local   # set VITE_API_BASE_URL if the backend isn't on localhost:8080
npm install
npm run dev
```

The backend needs CORS enabled for this app's origin (`WebConfig`, `app.cors.allowed-origins`, defaults to
`http://localhost:5173`).

## Scripts

```bash
npm run dev      # start the Vite dev server
npm run build    # type-check (tsc -b) and build for production
npm run lint      # oxlint
```
