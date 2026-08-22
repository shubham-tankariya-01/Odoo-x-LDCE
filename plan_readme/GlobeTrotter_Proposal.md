# GlobeTrotter — Proposal & Execution Plan

## 1. Problem Analysis

Stripped of the pitch language, the PS is asking for a **CRUD-heavy, relational, multi-user trip planner** with four real technical challenges hiding under 13 "screens":

| Core challenge | Why it's actually hard |
|---|---|
| **Itinerary modeling** | A trip → multiple stops (cities) → each stop has dates + multiple activities. This is a 3-level nested structure that needs a clean relational schema, not a document blob, because you need to query/aggregate across it (budget totals, calendar views). |
| **Budget aggregation** | Costs roll up from activity → stop → trip, split across categories (transport/stay/activities/meals). This is a derived-data problem: compute on read vs. store on write. |
| **Two view modes on one dataset** | Calendar/timeline view and list/grouped-by-city view are the *same* itinerary data, rendered differently. Build one data shape, two renderers — don't build two separate flows. |
| **Public sharing** | A read-only, unauthenticated view of a specific trip, plus a "copy trip" that forks another user's data into your own account. That's a permissions + data-cloning problem, not just a new route. |

Everything else (login, dashboard, search) is standard CRUD/auth and shouldn't eat hackathon time.

**Verdict:** this is winnable in a hackathon window if you fix scope early and don't try to build all 13 screens with equal polish. Screens 1–6 + 9 are the demo-critical path. Screens 7–8 (search) can be a static/seeded dataset. Screens 11–13 are stretch goals.

## 2. Recommended Scope (MVP vs. Stretch)

**MVP — must work end-to-end for the demo:**
1. Auth (signup/login)
2. Create Trip (name, dates, description)
3. Itinerary Builder (add stops → cities, dates, activities)
4. Itinerary View (list + calendar toggle)
5. Trip Budget breakdown (auto-computed, not manually entered)
6. My Trips list

**Stretch — add only if MVP is done with time to spare:**
- City/Activity search with filters (seed ~30 cities, ~100 activities in DB up front — do NOT build a live external API integration under hackathon time pressure)
- Public shareable itinerary + "Copy Trip"
- Drag-to-reorder activities/stops
- Admin analytics dashboard *(explicitly marked Optional in the PS — cut first if time is short)*

## 3. Data Model (Relational)

```
User (id, name, email, password_hash, created_at)

Trip (id, user_id FK, name, start_date, end_date, description, cover_photo_url, is_public, created_at)

Stop (id, trip_id FK, city_id FK, start_date, end_date, order_index)

City (id, name, country, cost_index, popularity_score)

Activity (id, city_id FK, name, category, cost, duration_mins, description, image_url)

TripActivity (id, stop_id FK, activity_id FK, scheduled_date, scheduled_time, cost_override)

Expense (id, trip_id FK, category[transport|stay|activity|meal], amount, stop_id FK nullable)
```

Notes:
- `order_index` on `Stop` gives you drag-reorder for free (just re-sequence integers) without needing a linked-list structure.
- Budget screen queries `TripActivity` + `Expense` grouped by category/date — no separate "budget" table needed; it's a read-time aggregation. Precompute a cached `total_cost` on `Trip` only if performance becomes an issue.
- `is_public` boolean + a `slug`/`uuid` on `Trip` is enough for the shareable link — no need for a separate sharing/permissions table at MVP scope.

## 4. Suggested Stack

Given your existing FastAPI/Pydantic experience from [[nerve-backend]]:

- **Backend:** FastAPI + SQLAlchemy + Pydantic schemas, PostgreSQL. Async where it doesn't cost you dev speed (auth, simple CRUD can stay sync-friendly if the team is faster that way — don't over-engineer async under time pressure).
- **Auth:** JWT access tokens, `passlib`/`bcrypt` for hashing. Skip refresh-token rotation complexity for a hackathon — short-lived token + re-login is fine.
- **Frontend:** React + a component library (shadcn/ui or MUI) to avoid hand-rolling calendar/pie-chart components. Use `recharts` for budget charts and a simple calendar grid component rather than a heavy calendar library.
- **DB hosting:** Supabase or Railway Postgres — instant hosted DB, saves setup time.

## 5. Suggested API Surface (MVP)

```
POST   /auth/signup
POST   /auth/login

GET    /trips                     # list current user's trips
POST   /trips                     # create trip
GET    /trips/{id}                # full itinerary (stops + activities nested)
PATCH  /trips/{id}
DELETE /trips/{id}

POST   /trips/{id}/stops
PATCH  /stops/{id}                # dates, reorder
DELETE /stops/{id}

POST   /stops/{id}/activities
DELETE /trip-activities/{id}

GET    /trips/{id}/budget         # aggregated breakdown by category/day

GET    /cities?search=&country=
GET    /cities/{id}/activities?category=&max_cost=

GET    /public/trips/{slug}       # no auth required
POST   /trips/{id}/copy           # clone a public trip into current user's account
```

`GET /trips/{id}` should return the fully nested itinerary (trip → stops → activities) in one call — this is the shape both the list view and calendar view consume, so build that endpoint carefully and let the frontend render it two ways.

## 6. Execution Timeline (assumes a ~24–36 hr hackathon)

| Phase | Time | Deliverable |
|---|---|---|
| Setup | Hr 0–2 | Repo, DB schema migrated, auth working end-to-end, seed script for cities/activities |
| Core loop | Hr 2–10 | Create Trip → Add Stops → Add Activities → View Itinerary (list mode) working |
| Budget + Calendar | Hr 10–16 | Aggregation endpoint, budget charts, calendar view toggle |
| Polish + search | Hr 16–22 | City/activity search over seed data, My Trips list, empty/loading states |
| Stretch + demo prep | Hr 22–end | Public share link, copy-trip, dashboard, rehearse the demo script |

**Team split (if 3–4 people):** one owns DB schema + auth + core CRUD endpoints, one owns itinerary builder + calendar UI, one owns budget aggregation + charts, one floats on search/sharing/polish and demo data seeding.

## 7. Key Risks

- **Scope creep on 13 screens** — the PS lists more screens than any team builds well in a hackathon. Cutting the Admin dashboard and treating city/activity data as seeded (not live-searched from a real API) is the single highest-leverage decision.
- **Two-view itinerary rendering** — decide the nested JSON shape from `GET /trips/{id}` on hour 1, not hour 10, since both list and calendar views depend on it.
- **Budget correctness under demo pressure** — precompute nothing you don't have to; a live aggregation query is easier to keep correct than a cached total you forget to invalidate.

## 8. What to Show in the Demo

Judges will remember: create a multi-city trip live, add a couple of activities, flip between list and calendar view, and show the budget chart update automatically. That loop alone — done cleanly — demonstrates the relational design and the UI polish the PS is actually testing for. Everything else is bonus.
