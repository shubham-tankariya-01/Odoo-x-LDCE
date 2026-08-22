# GlobeTrotter — Frontend Build Guide (single-path, single-agent)

This replaces the old two-engineer split entirely. There is now **one path**: one agent builds every screen, once, in order, from an empty frontend folder. Nothing here divides work by owner or file boundary — that concept is gone.

## 0. How to use this file

Paste this whole file into your coding agent, alongside:
- `API_TESTING_GUIDE.md` — the real backend contract. **This part is not optional.** Every fetch, every create/update call, every field name and payload shape below is copied from it. Follow it exactly.
- The SVG wireframe file — use it **only** as a functional element inventory ("this screen needs a search bar, a group-by control, and a grid of cards showing X, Y, Z") — not as a pixel-accurate layout to reproduce. Do not measure positions or copy exact box placement from it.
- `style.md` — use this **as mood and direction only**, not as a literal spec. It describes the intended feeling: warm, cozy, travel-focused, photography-forward, generous rounding, Airbnb-adjacent confidence. Do **not** treat any specific hex code, px value, or component rule in it as compulsory. Read it, absorb the *direction*, and then make your own design decisions — choose your own exact palette, spacing, type pairing, card treatment, and layout for each screen so the result is a real, polished, cozy travel product, not a literal token-by-token reproduction. If you have good design judgment that improves on something in `style.md`, use your judgment.

**The one hard line:** visual design is yours to decide. Data, behavior, and API integration are not — those follow this document exactly, screen by screen.

## 1. Ground rules

1. **You have creative authority over UI/UX.** No one will check your work against a fixed set of colors or a fixed layout. You will be judged on whether the result feels like a genuinely good, cozy, travel-brand product — warm, confident, photography-forward, not a bare admin panel. Make real design decisions: pick a palette, a type pairing, a card style, a motion feel, and apply it consistently across all screens yourself.
2. **Data and behavior are not yours to improvise.** Every screen below lists exactly what to fetch on load, what user actions create or update data, and which endpoint each one calls. Follow these exactly — do not invent endpoints, do not invent response fields that aren't in `API_TESTING_GUIDE.md`, do not skip a state (loading/empty/error/populated) for any screen.
3. **Consistency is still required — just self-imposed.** Whatever palette, type scale, spacing scale, card style, and button style you choose in Screen 1, reuse identically across all other screens. Build your own small shared component set (Button, Input, Card, Badge, SearchFilterBar, EmptyState, Skeleton, Modal, Navbar/AppShell) once, early, and reuse it everywhere, exactly the same discipline as a fixed design system would require — you're just choosing the values yourself instead of reading them off a token sheet.
4. **Every screen implements four states:** loading (a skeleton matching the final layout), empty (a message + a clear next action), error (a visible, non-blocking message), and populated. No screen ships with only the happy path.
5. **Build in the order below.** Screens later in the list assume the shared pieces (API client, auth, layout shell, shared components) already exist from earlier steps.

---

## 2. Tech stack

- React (function components + hooks), Vite, React Router v6
- A single `fetch`-based API client with one thin wrapper function per endpoint — build this before any screen
- Icon set, font pairing, exact color palette, spacing scale: your choice, guided by the "cozy travel" direction in `style.md` — pick once, document your choices at the top of your own token file, and hold to them

## 3. Foundation to build first (before any screen)

### 3.1 API client — one wrapper per real endpoint

Build `api/client.js` (base fetch wrapper: reads a stored `access_token`, injects `Authorization: Bearer <token>` on every request except register/login/global-search, redirects to the login screen on any `401`), then one function per row below, matching `API_TESTING_GUIDE.md` exactly — same fields, same method, same path:

| Function | Method & Path | Auth | Payload / Params |
|---|---|---|---|
| `register(payload)` | POST /auth/register | ❌ | `{first_name,last_name,email,password,phone_number,city,country}` |
| `login(username,password)` | POST /auth/login | ❌ | form fields `username`,`password` (not JSON) |
| `getMe()` | GET /users/me | 🔒 | — |
| `updateMe(payload)` | PATCH /users/me | 🔒 | `{first_name,last_name,phone_number,city,country,additional_info}` (no `email` field — it's read-only) |
| `getMyTrips(type)` | GET /users/me/trips | 🔒 | query `type` |
| `getPopularCities()` | GET /cities/popular | 🔒 | — |
| `searchCities({search,filter,sort_by})` | GET /cities | 🔒 | query params |
| `getCitySuggestions(cityId)` | GET /cities/{id}/suggestions | 🔒 | path param |
| `getActivities({search,category,sort_by})` | GET /activities | 🔒 | query params |
| `createTrip(payload)` | POST /trips | 🔒 | `{name,start_date,end_date,description}` |
| `listTrips({status,sort_by,search,limit})` | GET /trips | 🔒 | query params |
| `createSection(tripId,payload)` | POST /trips/{id}/sections | 🔒 | `{city_id?,title,description,start_date,end_date,budget}` |
| `listSections(tripId)` | GET /trips/{id}/sections | 🔒 | path param |
| `updateSection(sectionId,payload)` | PATCH /sections/{id} | 🔒 | any subset of section fields |
| `deleteSection(sectionId)` | DELETE /sections/{id} | 🔒 | path param |
| `reorderSections(tripId,orderedIds)` | PATCH /trips/{id}/sections/reorder | 🔒 | `{ordered_ids:[]}` |
| `addActivity(sectionId,payload)` | POST /sections/{id}/activities | 🔒 | `{activity_id,scheduled_date,scheduled_time?,notes?}` |
| `updateActivity(activityId,payload)` | PATCH /trip-activities/{id} | 🔒 | `{scheduled_time?,cost_override?,notes?}` |
| `deleteActivity(activityId)` | DELETE /trip-activities/{id} | 🔒 | path param |
| `getItinerary(tripId)` | GET /trips/{id}/itinerary | 🔒 | path param |
| `getBudget(tripId)` | GET /trips/{id}/budget | 🔒 | path param |
| `globalSearch(q)` | GET /search | ❌ | query `q` |

Mirror every response shape shown in `API_TESTING_GUIDE.md` as a typedef or interface (`User`, `City`, `Activity`, `Trip`, `Section`, `TripActivity`, `Itinerary`, `Budget`, `SearchResult`) so no screen later invents a field that doesn't exist (e.g. the trip's cover image field is `cover_photo_url`, not `cover_image` or `thumbnail`).

### 3.2 Auth + routing

- `AuthContext`: `{ user, token, login(), logout(), register() }`. On app load, if a stored token exists, call `getMe()` to hydrate `user`; treat any `401` as logged-out.
- A `ProtectedRoute` wrapper around every route except login, register, and (per the API guide) the unauthenticated global-search path.
- One `AppShell`/`Navbar` used by every screen — logo/wordmark, a global search input wired to `globalSearch`, and a profile menu (Profile / Logout, plus Admin Panel only when `user.is_admin` is true).

### 3.3 Shared components (build once, use on every screen)

Button (with your own primary/secondary/destructive/ghost variants and a real loading state), Input (label above, error below), Card, Badge (you'll need at least a trip-status family — Ongoing/Upcoming/Completed — and a budget-health family — under/approaching/over), a reusable SearchFilterBar (search + group-by/filter/sort-by — this exact combination is needed on Screens 3, 6, 8, 9, 10, 11, so build it once), EmptyState, Skeleton, Modal. Design these however fits your chosen cozy-travel direction — just build them once and reuse them everywhere below.

---

## 4. Screens — build in this order

The SVG shows 12 distinct screens. If your source material implies more (a "13" or "16" count was mentioned at various points), treat any additional screen the same way as the ones below: pull its functional element list from the SVG, map every element to a real API call from §3.1, and give it its own loading/empty/error/populated states — the pattern is identical regardless of exact screen count.

### Screen 1 — Login
**Elements from SVG:** username/email field, password field, login button, a path to registration.
**Data:** no fetch on load. On submit, call `login(username, password)` as a **form** request (not JSON), per the API guide. On success, store the token, hydrate `user`, navigate to the landing screen. On failure, show an inline error near the password field — do not use a blocking alert.

### Screen 2 — Registration
**Elements from SVG:** photo upload, username/password, first/last name, email, phone, city, country, additional information, register action, a path back to login.
**Data:** the SVG shows no password field but the real endpoint requires one — add it. No photo-upload endpoint exists in the API guide, so treat the photo control as a local preview only (not yet persisted) until a real upload endpoint exists. On submit, call `register({first_name,last_name,email,password,phone_number,city,country})`. On success (`201`), store the token, hydrate `user`, navigate to the landing screen. Validate required fields and email format client-side before submitting.

### Screen 3 — Main Landing Page
**Elements from SVG:** banner, search+group/filter/sort bar, a "plan a trip" action, a "Top Regional Selections" section, a "Previous Trips" section.
**Data:** fetch `getPopularCities()` and `listTrips({sort_by:"recent", limit:6})` in parallel on mount — each renders independently so a slow one doesn't block the other. "Plan a trip" navigates to Screen 4. Clicking a city card should carry that city's id forward into Screen 4 (pre-select it there). Clicking a trip card navigates to Screen 9 (that trip's itinerary). Empty trips → an empty state pointing at Screen 4.

### Screen 4 — Create a New Trip
**Elements from SVG:** a place picker, start/end date, and a suggestions area for places/activities.
**Data:** the place picker calls `searchCities({search})`; if a city id arrived from Screen 3, pre-fill it. Trip name and description fields are required by the real `POST /trips` endpoint even though the wireframe doesn't show them explicitly — include them. Once a city is picked, call `getCitySuggestions(cityId)` and show the results as browsable, informational cards (not yet added to any trip section). Validate end date isn't before start date client-side, mirroring the backend's own check. On submit, call `createTrip(...)`; on success navigate to Screen 5 with the new trip's id.

### Screen 5 — Build Itinerary Screen
**Elements from SVG:** a repeatable list of "Section" blocks (title, description, date range, budget), each addable, deletable, and reorderable, plus a way to add activities inside a section.
**Data:** on mount, `listSections(tripId)`. Adding a section → `createSection(tripId, payload)`. Editing a section's fields (debounced, on blur) → `updateSection(sectionId, payload)`. Deleting → confirm, then `deleteSection(sectionId)`. Drag-reordering → `reorderSections(tripId, orderedIds)`, optimistic locally, rolled back on failure. Adding an activity to a section (via a picker over `getActivities(...)` or the city-scoped suggestions) → `addActivity(sectionId, {activity_id, scheduled_date, scheduled_time?, notes?})`, validating the date falls inside the section's own range before submitting. Editing/removing an existing activity → `updateActivity(...)` / `deleteActivity(...)`. A primary action moves on to Screen 9 once at least one section exists.

### Screen 6 — User Trip Listing ("My Trips")
**Elements from SVG:** search+group/filter/sort bar, three grouped rows — Ongoing, Upcoming, Completed.
**Data:** fetch the user's trips (`listTrips(...)` and/or `getMyTrips(type)` per the guide's filtering support) and group client-side by each trip's own `status` field. Wire the search bar's fields to the corresponding query params. Clicking a trip card navigates to Screen 9. Zero trips at all → empty state pointing at Screen 4; a merely-empty individual group (e.g. no completed trips) should just omit that row or show one muted line, not a full empty-state block.

### Screen 7 — User Profile Page
**Elements from SVG:** user photo, editable user details, a "Preplanned Trips" section, a "Previous Trips" section.
**Data:** `getMe()` on mount. Edits save via `updateMe({first_name,last_name,phone_number,city,country,additional_info})` — `email` is never editable, it's not in the update payload the API accepts. The two trip sections reuse the same trip-card pattern as Screen 6, capped to a handful of items each, with a link out to the full Screen 6 listing.

### Screen 8 — Activity Search / City Search Page
**Elements from SVG:** search+group/filter/sort bar, a results list, a "View" action per result.
**Data:** if reached via the Navbar's global search, call `globalSearch(q)` and render its `{cities, trips}` shape (a trip result routes to Screen 9; a city result routes to Screen 4 with that city pre-selected). If reached via a dedicated browse entry point, call `getActivities({search,category,sort_by})` or `searchCities({search,filter,sort_by})` depending on what's being browsed, wiring the group/filter/sort controls to their respective params. No query yet → a neutral prompt state, not an empty-results message. No matches → an empty state that clears the query.

### Screen 9 — Itinerary View Screen with Budget Section
**Elements from SVG:** search+group/filter/sort bar, a day-by-day itinerary breakdown, a budget section.
**Data:** fetch `getItinerary(tripId)` and `getBudget(tripId)` in parallel. Render the itinerary grouped by day (derive days from each activity's `scheduled_date`), each activity showing its name, category, time, cost, and notes. Render the budget block from the real response shape: `total`, `by_category`, `by_day`, `average_daily` — use the budget-health badge family to flag over/approaching/under (paired with a warning icon when over budget, never color alone). An "Edit" action routes back to Screen 5. No sections yet → empty state pointing at Screen 5.

### Screen 10 — Community Tab Screen
**Elements from SVG:** search+group/filter/sort bar, a feed of shared trip/activity experiences.
**Data gap:** `API_TESTING_GUIDE.md` has no community/post endpoints at all. Build the full screen and its states against a clearly-marked local placeholder data set, default to the empty state ("No community posts yet"), and leave a comment noting this is blocked on a backend endpoint that doesn't exist yet — don't fabricate a fake API shape and don't quietly hardcode fake posts as if they were real data.

### Screen 11 — Calendar View Screen
**Elements from SVG:** search+group/filter/sort bar, a calendar grid.
**Data:** combine `listTrips()` (to mark which days fall inside a trip's range) with `getItinerary(tripId)` for the currently-relevant trip(s) (to plot individual activities on their `scheduled_date`). There's no dedicated calendar endpoint — this is a client-side recombination of data you already have. Clicking a day with activities shows their details; clicking an empty day inside a trip's range can deep-link to Screen 5. No trips at all → empty state pointing at Screen 4.

### Screen 12 — Admin Panel Screen
**Elements from SVG:** Manage Users, Popular Cities, Popular Activities, User Trends & Analytics.
**Data:** gate the whole screen on `user.is_admin === true` (present on the user object per the API guide), redirecting non-admins elsewhere. **Popular Cities** and **Popular Activities** map to real endpoints — `getPopularCities()` and `getActivities({sort_by:"popularity"})` — use them as-is. **Manage Users** and **User Trends & Analytics** have no backing endpoint anywhere in the API guide — build the section shells and render them in a permanent, clearly-commented placeholder state rather than fabricating a user list or fake analytics numbers.

---

## 5. Definition of done

- [ ] Every screen above works end-to-end against the real running backend — you should be able to walk through the full `API_TESTING_GUIDE.md` test sequence purely by clicking through the built UI
- [ ] Every screen implements loading / empty / error / populated states
- [ ] No field or endpoint appears anywhere in the app that isn't in `API_TESTING_GUIDE.md` — Community and the two ungated Admin sections are visibly marked placeholder, not silently faked
- [ ] The same shared components (Button, Input, Card, Badge, SearchFilterBar, EmptyState, Skeleton, Modal, Navbar) are reused, unmodified in style, across all 12 screens — whatever palette/type/spacing choices were made in Screen 1 hold everywhere else
- [ ] The overall feel reads as a warm, cozy, travel-forward product — not a bare admin/dashboard tool — even though no fixed token sheet dictated the exact values used to get there