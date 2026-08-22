# GlobeTrotter — Final Build Plan (8-hour scope)

Merged from the PS doc and the actual wireframe. Wireframe naming wins where they conflict (`Section`, not `Stop`) — it's the more authoritative source since it reflects the real UI you're building against.

**The single most important decision: at 8 hours, Community and Admin are not stretch goals. They are not in scope. Do not open those files.** Everything below is scoped to the 8 screens that actually prove the relational model works.

---

## Data model (final)

```
User          (id, first_name, last_name, email, phone, city, country, password_hash, photo_url)
Trip          (id, user_id FK, name, start_date, end_date, cover_photo_url, status[ongoing|upcoming|completed])
Section       (id, trip_id FK, city_id FK, description, start_date, end_date, budget, order_index)
City          (id, name, country, cost_index, popularity_score)
Activity      (id, city_id FK, name, category, cost, duration_mins, description)
TripActivity  (id, section_id FK, activity_id FK, scheduled_time, cost_override, notes)
```

Notes carried over from the earlier design, still true here:
- `TripActivity` is a join table — one `Activity` (e.g. "Eiffel Tower") can be scheduled into many different sections/trips independently.
- `order_index` on `Section` gives you drag-reorder for free — resequence integers, no linked list.
- `Section.budget` is a new, good idea from the wireframe: store an estimate per leg so a section can flag overspend on its own, not just the whole trip at the end.
- Trip-level budget is still a read-time aggregation: `SUM(trip_activities.cost_override)` grouped by section/category — nothing precomputed.
- `status` (ongoing/upcoming/completed) replaces `is_public` — the wireframe doesn't have public sharing, so this field doesn't exist in the 8-hour scope. If you want it back later, it's a 20-minute add: `is_public` boolean + one unauthenticated route, same as before.

---

## Screen-by-screen

### 1. Login Screen
`POST /auth/login` → `{username, password}` → JWT. **Tables:** `User`

### 2. Registration Screen
`POST /auth/register` → `{first_name, last_name, email, phone, city, country}` → user row.
Photo upload: fold into the register call as multipart rather than a separate `/users/me/photo` round-trip — one less endpoint to build and test at 8 hours.
**Tables:** `User`

### 3. Main Landing Page
`GET /cities/popular` (top regional), `GET /trips?owner=me&sort=recent&limit=5` (previous trips preview).
Skip the global `/search?q=` endpoint for now — fold search into screens 6 and 8 where it's actually needed, don't build a third search implementation.
**Tables:** `City`, `Trip`

### 4. Create a New Trip Screen
`POST /trips` → `{name, start_date, end_date}` → trip shell.
`POST /trips/{tripId}/sections` → first section, immediately after creation.
Skip `/cities/{id}/suggestions` as a separate endpoint at 8 hours — just reuse the city search from screen 8 inline on this screen.
**Tables:** `Trip`, `Section`

### 5. Build Itinerary Screen
Repeating section blocks: description, date range, budget.
`GET /trips/{tripId}/sections`, `PATCH /sections/{sectionId}`, `DELETE /sections/{sectionId}`, `PATCH /trips/{tripId}/sections/reorder`.
**Tables:** `Section`

### 6. User Trip Listing
`GET /trips?status=ongoing|upcoming|completed&search=` — keep `group_by`/`sort_by` params only if trivial to add on top of the status filter; don't build a generic grouping engine for a demo screen.
**Tables:** `Trip`

### 7. User Profile Page
`GET /users/me`, `PATCH /users/me`, `GET /users/me/trips?type=preplanned|previous`.
Build this **last**, only if 1–6 and 9 are solid — it demonstrates nothing new about the schema.
**Tables:** `User`, `Trip`

### 8. Activity / City Search Page
`GET /activities?search=&category=`, `GET /cities?search=`, `POST /sections/{sectionId}/activities`.
**Seed the data — do not build live search against a real travel API at 8 hours.** 15–20 cities, 5 activities each is enough for a convincing demo.
**Tables:** `City`, `Activity`, `TripActivity`

### 9. Itinerary View Screen (with budget)
`GET /trips/{tripId}/itinerary` → nested day → activities. `GET /trips/{tripId}/budget` → breakdown by category/section.
**This is your demo centerpiece.** Lock this response shape in hour 1 — screen 11 (calendar) depends on it being stable.
**Tables:** `Section`, `TripActivity`, `Activity`, `City` (one joined query)

### 11. Calendar View Screen
Reuses `GET /trips/{tripId}/itinerary` from screen 9, rendered client-side as a calendar grid instead of a day list. **Do not build a second endpoint** — this is a pure rendering decision, exactly as planned before.
**Tables:** same as screen 9

---

## Cut entirely at 8 hours

- **Screen 10 — Community Tab.** Social feed with posts/likes/comments is a second product bolted onto this one. Zero relational-model signal for judges, and it's the single largest time sink on the list.
- **Screen 12 — Admin Panel.** Same reasoning as before — demonstrates nothing new.
- Public sharing / copy-trip from the earlier plan — not in the wireframe at all, don't add it back unless everything above finishes early.

---

## 8-hour execution timeline

| Hour | Deliverable |
|---|---|
| 0–1 | Repo + DB migrated + seed script started (cities/activities) |
| 1–2 | Auth working end-to-end (screens 1–2) |
| 2–4 | Create Trip → Build Itinerary loop working (screens 4–5) |
| 4–5.5 | Itinerary View + budget aggregation (screen 9) — **this is the demo, protect this time slot** |
| 5.5–6.5 | Trip listing + calendar view, reusing existing endpoints (screens 6, 11) |
| 6.5–7.5 | Activity/city search over seed data (screen 8), profile page if time remains (screen 7) |
| 7.5–8 | Demo rehearsal, not new features. If something's half-built at 7.5, cut it — don't ship broken |

**Team split (3–4 people), unchanged in spirit from before:** one owns schema + auth + trip/section CRUD, one owns itinerary builder + calendar rendering, one owns budget aggregation + charts, one floats on seed data + search + profile + demo script.

---

## What to show in the demo

Same core loop as before, just faster to reach: create a trip, add two sections with activities, show the budget breakdown update live, flip to calendar view. That's the whole relational chain (`User → Trip → Section → TripActivity → Activity`) proven in under two minutes — which is what actually needs to survive an 8-hour build.