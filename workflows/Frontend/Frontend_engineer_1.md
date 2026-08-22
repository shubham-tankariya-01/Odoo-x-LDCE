# GlobeTrotter — Frontend Engineer 1 (FE1) Build Instructions
### Role: Architecture Owner + Trip-Creation Pipeline Owner

---

## 0. How to use this file

Paste this entire file into your coding agent (Claude Code, Cursor, etc.) as the task brief. It is split into **two phases**:

- **Phase 0 — Shared Architecture.** You run this alone, first, before Engineer 2 (FE2) touches anything. It produces the folder structure, design-token CSS, shared component library, API client, auth context, and **empty stub pages for every one of FE2's screens** so FE2 never has to create a new file — only fill one in.
- **Phase 1 — Your own screens.** After you push Phase 0 to `main` and tell FE2 to pull, you and FE2 work in parallel on separate files. This file covers only *your* six screens in full depth.

Merging both of your work back together is **not** described here — that is `merge.md`, which you (FE1) run last, after FE2 has pushed.

Two other files exist alongside this one:
- `frontend-engineer-2.md` — FE2's six screens (do not build these; stub them only).
- `merge.md` — the Phase 2 integration script you run after both branches are done.

**Non-negotiable references**, both must be loaded into the agent's context in full alongside this file:
- `fe_style_final.md` — the design system. Every pixel value, color, radius, spacing, and component rule below comes from it. Do not invent new tokens. Do not deviate "just for this screen."
- `API_TESTING_GUIDE.md` — the real backend contract. Every request body and response shape below is copied from it. Do not invent fields, do not rename fields, do not assume an endpoint exists that isn't listed there.

---

## 1. Ground rules (apply to both phases)

1. **File ownership is absolute.** In Phase 1, FE1 edits only the files listed in §6 "File ownership" below. Never edit a file inside FE2's page folders. Never edit `routes/engineer2.routes.jsx`. If a shared component genuinely needs a change, stop and flag it — don't silently patch it mid-Phase-1, since FE2 is editing in parallel off the same shared-component snapshot.
2. **Style compliance is enforced, not optional.** Every button, input, card, badge, spacing value, radius, shadow, and color must trace back to a token in `fe_style_final.md` §2–§8. If a screen in the SVG implies something the style guide doesn't cover, default to the closest existing pattern in the guide rather than inventing a new visual style.
3. **No screen exists in isolation.** Before building a screen, read its "Navigates to / Navigated from" list below and confirm the destination screen (even if it's FE2's and only a stub right now) has a matching route name so the link doesn't 404.
4. **Every list, card grid, and search screen uses the shared `SearchFilterBar` and shared `Card`/`Badge` components built in Phase 0** — never a bespoke reimplementation per screen.
5. **All data comes from the real API contract in `API_TESTING_GUIDE.md`.** No screen invents mock data shapes that don't match a real endpoint response. Where the guide shows a field as `null`-able (e.g. `city_id`, `cover_photo_url`), the UI must handle the null case explicitly (see Empty States, style §8).
6. **State machine for every screen:** every screen you build must implement four states — **loading** (skeleton, style §8), **empty** (icon + message + primary CTA, style §8), **error** (inline message, does not crash the shell), **populated**. Do not ship a screen that only handles the happy path.

---

## 2. PHASE 0 — Shared Architecture (FE1 only, run before anyone touches Phase 1)

### 2.1 Tech stack (fixed — do not substitute)

- React (function components + hooks only, no class components)
- Vite as the build tool
- React Router v6 for routing
- A single `fetch`-based API client (no axios needed; keep dependency footprint low) with a thin wrapper per endpoint
- Component base: shadcn/ui primitives, restyled with the CSS variables from `fe_style_final.md` — per style.md §10, do not introduce a second component library
- Tabler Icons (outline) for all iconography
- Plain CSS variables (no Tailwind config rewrite needed) — define every token from style.md §2–§7 as a `:root` CSS variable in one file so both engineers reference the same names

### 2.2 Full folder structure to create

Create this exact tree. Every file marked `(stub)` must be created by FE1 in Phase 0 as a real, importable, rendering (even if minimal) React component — not a TODO comment in a missing file. FE2 must never run `touch` or create a new page file; FE2 only opens files that already exist.

```
frontend/
  src/
    main.jsx
    App.jsx                          # FE1 owns — composes both route modules
    styles/
      tokens.css                     # FE1 owns — every variable from style.md §2-7
      global.css                     # FE1 owns — resets, base typography, layout container
    api/
      client.js                      # FE1 owns — fetch wrapper, base URL, token header, 401 handling
      auth.js                        # FE1 owns — register, login
      users.js                       # FE1 owns — getMe, updateMe, getMyTrips
      cities.js                      # FE1 owns — popular, search, suggestions
      activities.js                  # FE1 owns — list/search all activities
      trips.js                       # FE1 owns — CRUD trips, sections, activities, itinerary, budget
      search.js                      # FE1 owns — global search
    context/
      AuthContext.jsx                # FE1 owns — user, token, login(), logout(), register()
    hooks/
      useAuth.js                     # FE1 owns
      useApi.js                      # FE1 owns — generic loading/error/data hook wrapping api/* calls
    components/
      layout/
        AppShell.jsx                 # FE1 owns — top Navbar + content container, used by every screen
        Navbar.jsx                   # FE1 owns — logo "GlobeTrotter", global search, profile avatar menu
        ProtectedRoute.jsx           # FE1 owns
      shared/
        Button.jsx                   # FE1 owns — primary/secondary/success/warning/danger/ghost per style §8
        Input.jsx                    # FE1 owns — label above, helper/error below, per style §8
        Card.jsx                     # FE1 owns — border/radius/shadow rules per style §5, §8
        Badge.jsx                    # FE1 owns — both badge families from style §8 (trip-status + budget)
        SearchFilterBar.jsx          # FE1 owns — the exact 6-screen-reused bar from style §8
        EmptyState.jsx               # FE1 owns
        Skeleton.jsx                 # FE1 owns — card-skeleton + row-skeleton variants
        Modal.jsx                    # FE1 owns
    routes/
      engineer1.routes.jsx           # FE1 owns — <Route> entries for FE1's 6 screens
      engineer2.routes.jsx           # FE1 creates the file with stub routes; FE2 fills the imports' component bodies only
    pages/
      auth/
        Login.jsx                   # FE1 builds in Phase 1
        Register.jsx                # FE1 builds in Phase 1
      trips/
        Landing.jsx                 # FE1 builds in Phase 1   (Screen 3)
        CreateTrip.jsx               # FE1 builds in Phase 1   (Screen 4)
        BuildItinerary.jsx           # FE1 builds in Phase 1   (Screen 5)
        ItineraryView.jsx            # FE1 builds in Phase 1   (Screen 9)
      my-trips/
        MyTrips.jsx                  # (stub only — FE2 builds, Screen 6)
      profile/
        Profile.jsx                  # (stub only — FE2 builds, Screen 7)
      search/
        ActivitySearch.jsx           # (stub only — FE2 builds, Screen 8)
      community/
        Community.jsx                # (stub only — FE2 builds, Screen 10)
      calendar/
        Calendar.jsx                 # (stub only — FE2 builds, Screen 11)
      admin/
        AdminPanel.jsx                # (stub only — FE2 builds, Screen 12)
    types/
      index.js                      # FE1 owns — JSDoc typedefs for every API shape below (User, City, Activity, Trip, Section, TripActivity, Itinerary, Budget, SearchResult)
```

### 2.3 Stub page contract (what "empty file with a comment block" means)

Every FE2 page above must be created by FE1 as a **working, routable, rendering component** — not a blank file — so the app never crashes and FE2 has zero setup work. Template for each stub:

```jsx
// pages/my-trips/MyTrips.jsx
// OWNER: Engineer 2 — build per frontend-engineer-2.md, Screen 6 (User Trip Listing)
// Do not rename this file or move it. Do not change the export signature below.
// API calls this screen will need: GET /trips, GET /users/me/trips (see engineer-2 spec)
import { AppShell } from "../../components/layout/AppShell";

export default function MyTrips() {
  return (
    <AppShell>
      <div style={{ padding: "var(--space-8)" }}>My Trips — under construction (Engineer 2)</div>
    </AppShell>
  );
}
```

Repeat this pattern (adjusted comment + owner note + relevant endpoints) for `Profile.jsx`, `ActivitySearch.jsx`, `Community.jsx`, `Calendar.jsx`, `AdminPanel.jsx`.

### 2.4 API client — build every wrapper now, both engineers depend on it

Base client (`api/client.js`) responsibilities:
- Reads `access_token` from `localStorage` (key: `gt_token`)
- Injects `Authorization: Bearer <token>` header on every request except `POST /auth/register`, `POST /auth/login`, `GET /search`
- On any `401` response, clears the token and redirects to `/login`
- Central `apiRequest(method, path, { params, body })` helper; every file below is a thin wrapper around it

Build one wrapper function per endpoint, matching `API_TESTING_GUIDE.md` exactly:

| File | Function | Method & Path | Auth | Body / Params |
|---|---|---|---|---|
| auth.js | `register(payload)` | POST /auth/register | ❌ | `{first_name,last_name,email,password,phone_number,city,country}` |
| auth.js | `login(username,password)` | POST /auth/login | ❌ | form fields `username`,`password` |
| users.js | `getMe()` | GET /users/me | 🔒 | — |
| users.js | `updateMe(payload)` | PATCH /users/me | 🔒 | `{first_name,last_name,phone_number,city,country,additional_info}` |
| users.js | `getMyTrips(type)` | GET /users/me/trips | 🔒 | query `type` |
| cities.js | `getPopularCities()` | GET /cities/popular | 🔒 | — |
| cities.js | `searchCities({search,filter,sort_by})` | GET /cities | 🔒 | query params |
| cities.js | `getCitySuggestions(cityId)` | GET /cities/{id}/suggestions | 🔒 | path param |
| activities.js | `getActivities({search,category,sort_by})` | GET /activities | 🔒 | query params |
| trips.js | `createTrip(payload)` | POST /trips | 🔒 | `{name,start_date,end_date,description}` |
| trips.js | `listTrips({status,sort_by,search,limit})` | GET /trips | 🔒 | query params |
| trips.js | `createSection(tripId,payload)` | POST /trips/{id}/sections | 🔒 | `{city_id?,title,description,start_date,end_date,budget}` |
| trips.js | `listSections(tripId)` | GET /trips/{id}/sections | 🔒 | path param |
| trips.js | `updateSection(sectionId,payload)` | PATCH /sections/{id} | 🔒 | `{title?,budget?,...}` |
| trips.js | `deleteSection(sectionId)` | DELETE /sections/{id} | 🔒 | path param |
| trips.js | `reorderSections(tripId,orderedIds)` | PATCH /trips/{id}/sections/reorder | 🔒 | `{ordered_ids:[]}` |
| trips.js | `addActivity(sectionId,payload)` | POST /sections/{id}/activities | 🔒 | `{activity_id,scheduled_date,scheduled_time?,notes?}` |
| trips.js | `updateActivity(activityId,payload)` | PATCH /trip-activities/{id} | 🔒 | `{scheduled_time?,cost_override?,notes?}` |
| trips.js | `deleteActivity(activityId)` | DELETE /trip-activities/{id} | 🔒 | path param |
| trips.js | `getItinerary(tripId)` | GET /trips/{id}/itinerary | 🔒 | path param |
| trips.js | `getBudget(tripId)` | GET /trips/{id}/budget | 🔒 | path param |
| search.js | `globalSearch(q)` | GET /search | ❌ | query `q` |

Every function returns the **exact JSON shape** shown in `API_TESTING_GUIDE.md` for that step — mirror those shapes in `types/index.js` as JSDoc typedefs (`User`, `City`, `Activity`, `Trip`, `Section`, `TripActivity`, `Itinerary`, `Budget`, `SearchResult`) so both engineers get autocomplete and neither invents a field that doesn't exist (e.g. never invent `trip.cover_image`; the real field is `cover_photo_url`).

### 2.5 Design tokens file (`styles/tokens.css`)

Transcribe **every** variable from `fe_style_final.md` §2 (color), §3 (type scale as CSS custom properties, e.g. `--text-lg: 18px; --text-lg-weight: 600;`), §4 (spacing), §5 (radius + shadow), §7 (motion durations/easing) into `:root`. This file is the single source of truth — no page may hardcode a hex color, a px radius, or a shadow value. Every component, in either engineer's pages, references `var(--color-primary)` etc., never a literal.

### 2.6 Shared components (build once, both engineers consume)

Build these per `fe_style_final.md` §8 exactly as specified there — states, variants, and all:

- **Button** — variants `primary | secondary | success | warning | danger | ghost`; states default/hover/active/disabled/loading exactly as described in style §8.
- **Input** — label above, helper/error below, focus = solid 2px border per style §8 (no glow).
- **Card** — `1px solid var(--color-border)`, `--radius-md`, no shadow at rest; accepts an `interactive` prop that adds `--shadow-sm` on hover only when true (per the "non-interactive cards never get hover shadow" rule).
- **Badge** — two families: `status` (`ongoing|upcoming|completed`, primary/neutral palette) and `budget` (`under|approaching|over`, semantic palette, `over` always renders with a warning-triangle icon per style §9 accessibility floor).
- **SearchFilterBar** — search input (icon + text) flex-grows left; `Group by`/`Filter`/`Sort by` as three equal-height 40px dropdown buttons right-aligned; on mobile, collapses into one "Filters" button opening a bottom sheet. This exact component is reused, unmodified, on Screens 3, 6, 8, 9, 10, 11 — build it once here, never rebuild it per-screen.
- **EmptyState** — centered 48px muted icon + one-line message + primary button, per style §8.
- **Skeleton** — `CardSkeleton` (matches trip-card dimensions) and `RowSkeleton` (matches a listing row), flat color, no shimmer, per style §8.
- **Modal** — `--radius-lg`, `--shadow-lg`, `--duration-slow` (220ms) open transition, per style §5/§7.
- **Navbar** — "GlobeTrotter" wordmark (no logo image needed unless supplied), global search input wired to `search.globalSearch`, right-aligned profile avatar (circle, initials fallback per style §6) that opens a dropdown with "Profile" → `/profile` and "Logout".
- **AppShell** — wraps Navbar + a max-width 1280px content container (per style §4 grid) around every page's content.

### 2.7 Auth context & routing guard

- `AuthContext` holds `{ user, token, login(), logout(), register() }`. On mount, if a token exists in `localStorage`, call `getMe()` to hydrate `user`; on 401, clear and treat as logged out.
- `ProtectedRoute` wraps every route except `/login`, `/register`, and the public global-search results; redirects to `/login` when `user` is null.

### 2.8 Route files — the conflict-avoidance mechanism

`App.jsx` (FE1-owned) imports both route modules and renders them inside one `<Routes>` tree wrapped in `AppShell`/`ProtectedRoute` as appropriate:

```jsx
import { engineer1Routes } from "./routes/engineer1.routes";
import { engineer2Routes } from "./routes/engineer2.routes";
// <Routes>{engineer1Routes}{engineer2Routes}</Routes>
```

`routes/engineer1.routes.jsx` — FE1 fills this with real `<Route>` entries for `/login`, `/register`, `/`, `/trips/new`, `/trips/:tripId/build`, `/trips/:tripId/itinerary`.

`routes/engineer2.routes.jsx` — FE1 creates this file in Phase 0 with the route paths already wired to the stub components (`/my-trips`, `/profile`, `/search`, `/community`, `/calendar`, `/admin`). **FE2 never edits this file** — FE2 only edits the page component files it points to. This is the mechanism that guarantees zero routing-file conflicts between the two engineers.

### 2.9 Phase 0 exit checklist (do not start Phase 1 until every box is true)

- [ ] `npm run dev` boots to a blank-but-styled `/login` page with no console errors
- [ ] Every route above resolves to a rendering component (real or stub) — no 404s, no blank white screens
- [ ] `tokens.css` contains every variable listed in `fe_style_final.md` §2–§7
- [ ] Every shared component in §2.6 exists, is imported successfully, and visually matches style.md when eyeballed in isolation (e.g. a storybook-less test page is fine, or just drop one of each into `Login.jsx` temporarily)
- [ ] `api/*.js` contains a wrapper for every row in the §2.4 table
- [ ] `types/index.js` typedefs match every JSON shape in `API_TESTING_GUIDE.md` field-for-field

**Push to `main` now.** Commit message: `phase 0: shared architecture, tokens, shared components, api client, stub pages`. Tell FE2 to `git pull` `main` and branch `feature/engineer-2` from it before opening `frontend-engineer-2.md`. You branch `feature/engineer-1` from the same commit for your own Phase 1 work.

---

## 3. PHASE 1 — FE1's Screens (build in `feature/engineer-1`)

You own the **trip-creation pipeline**: a user logs in, lands on the homepage, starts a trip, builds it out section by section, and views the finished itinerary with its budget. These six screens are a single cohesive user journey — build and test them in this order.

### Screen 1 — Login

**Route:** `/login` · **File:** `pages/auth/Login.jsx` · **Protected:** No

**Layout (top to bottom, centered card on the page):**
- Centered `Card` (max-width ~400px) titled implicitly by a "GlobeTrotter" wordmark above it
- `Input` — Username (email) — label "Email", type email
- `Input` — Password — label "Password", type password
- `Button` primary, full-width, label "Log In" — the Login Button from the wireframe
- A `Ghost` button/link below: "Don't have an account? Register" → navigates to `/register`

**Behavior:**
- On submit: call `auth.login(username, password)`. This is a **form POST**, not JSON — build the request body as `URLSearchParams` with `username`/`password` fields, per `API_TESTING_GUIDE.md` Step 2 (leave `grant_type`, `scope`, `client_id`, `client_secret` empty/omitted).
- On success: store `access_token` under `gt_token` in `localStorage`, set `user` in `AuthContext` from the response's `user` object, navigate to `/` (Landing).
- On failure: render an inline error below the password field (style §8 error pattern: `1px solid --color-danger` border + red helper text) — do not use a blocking alert.
- Button enters its `loading` state (spinner glyph, same resting size, per style §8) while the request is in flight; disabled until both fields are non-empty.

**Navigates to:** `/register` (link), `/` (on success). **Navigated from:** app root when unauthenticated, `Navbar` logout action.

---

### Screen 2 — Registration

**Route:** `/register` · **File:** `pages/auth/Register.jsx` · **Protected:** No

**Layout:**
- Centered `Card`, wider than Login's (this form has more fields)
- Optional **Photo** upload control at top (circular preview per style §6 avatar spec; if no photo-upload endpoint exists yet in the API guide, render the control as disabled/deferred — do not fabricate an upload endpoint that isn't in `API_TESTING_GUIDE.md`)
- Two-column field grid on desktop (single column on mobile, per style §4 breakpoints):
  - First Name / Last Name
  - Email Address / Phone Number
  - City / Country
- Full-width **Additional Information** — multi-line `Input` (textarea variant)
- `Button` primary, full-width: "Register"
- Ghost link: "Already have an account? Log in" → `/login`

**Behavior:**
- On submit: call `auth.register({first_name,last_name,email,password,phone_number,city,country})` — note the API guide's register endpoint requires a `password` field even though the wireframe doesn't show one; add a **Password** `Input` (type password) to the form even though the SVG wireframe omits it, since the real backend contract requires it. This is exactly the kind of gap between mock wireframe and real API that you must resolve in favor of the API guide.
- On success (`201`): store token, hydrate `AuthContext.user` from response, navigate to `/`.
- Field-level validation before submit: required fields non-empty, email format, phone format — inline error text per style §8, not a toast.

**Navigates to:** `/login` (link), `/` (on success). **Navigated from:** `/login`.

---

### Screen 3 — Main Landing Page

**Route:** `/` · **File:** `pages/trips/Landing.jsx` · **Protected:** Yes

**Layout (top to bottom):**
1. `Navbar` (from `AppShell` — logo, global search, avatar)
2. Full-width **Banner Image** region (16:9 crop per style §6 photography treatment; static placeholder image acceptable if no banner endpoint exists)
3. `SearchFilterBar` (shared component — search + Group by/Filter/Sort by)
4. **"Plan a trip"** — a prominent primary `Button` or large clickable `Card` → navigates to `/trips/new`
5. **"Top Regional Selections"** — a horizontal row/grid of `Card`s populated from `cities.getPopularCities()`; each card shows city `name`, `country`, and `image_url` (16:9, per style §6); clicking a city card should carry the `city_id` forward into `/trips/new` (e.g. via navigation state or query param) so trip creation can pre-select that city's suggestions
6. **"Previous Trips"** — a row of `Card`s (trip-status `Badge` per style §8) populated from `trips.listTrips({sort_by:"recent", limit:6})`; clicking a trip card → `/trips/:tripId/itinerary` (Screen 9). If the list is empty, use `EmptyState`: "No trips yet" + "Plan your first trip" primary button → `/trips/new`.

**Data loading:** fetch popular cities and recent trips in parallel on mount; each region gets its own loading/empty/error state independently (a slow trips call must not block the cities row from rendering).

**Navigates to:** `/trips/new`, `/trips/:tripId/itinerary`, plus global search (Navbar, → FE2's search results) and profile (Navbar avatar, → FE2's `/profile`). **Navigated from:** post-login redirect, Navbar logo click from anywhere in the app.

---

### Screen 4 — Create a New Trip

**Route:** `/trips/new` · **File:** `pages/trips/CreateTrip.jsx` · **Protected:** Yes

**Layout:**
- Title "Plan a new trip"
- **Select a Place** — a city picker `Input`/dropdown wired to `cities.searchCities({search})`; if arriving from Screen 3 with a pre-selected `city_id`, pre-fill this field
- **Start Date** / **End Date** — two date `Input`s (this becomes the trip's `start_date`/`end_date`)
- A **name** field and a **description** textarea (both required by `POST /trips` per the API guide, even though the wireframe only labels dates — again, resolve wireframe/API gaps in favor of the real contract)
- **"Suggestion for Places to Visit / Activities to perform"** — once a city is selected, call `cities.getCitySuggestions(cityId)` and render the results as a horizontal scroll of small `Card`s (name, category, cost, duration_mins) — purely informational at this stage, not yet added to any section
- Primary `Button`: "Create Trip"

**Behavior:**
- Client-side validation: `end_date` must not be before `start_date` (mirror the backend's own check from `API_TESTING_GUIDE.md` Step 9b so the user gets instant feedback instead of waiting for the `400`)
- On submit: `trips.createTrip({name,start_date,end_date,description})`. On the backend's `400` ("Trip end date cannot be before start date"), surface it as the Input's error text on the End Date field, not a generic toast.
- On success (`201`): capture the returned `id` as `tripId`, navigate to `/trips/:tripId/build` (Screen 5).

**Navigates to:** `/trips/:tripId/build`. **Navigated from:** Screen 3's "Plan a trip".

---

### Screen 5 — Build Itinerary Screen

**Route:** `/trips/:tripId/build` · **File:** `pages/trips/BuildItinerary.jsx` · **Protected:** Yes

This is the most complex screen you own — it manages the trip's **sections** (city legs) as a repeatable, addable, reorderable list.

**Layout:**
- Trip name/date-range header at top (from the trip object created in Screen 4, or fetched via `trips.listSections`/trip lookup if the user navigated back in)
- A vertically stacked, **drag-reorderable** list of **Section cards** ("Section 1", "Section 2", "Section 3", …). Each section card contains, per the wireframe:
  - Title (editable inline, e.g. "Paris Days")
  - "All the necessary information about this section." — description field (editable)
  - Helper copy: "This can be anything like travel section, hotel, or any other activity" (static hint text, not user data)
  - **Date Range** — start/end date pickers, `xxx to yyy` display format once set
  - **Budget of this section** — numeric input bound to the section's `budget`
  - A nested area to add activities to this section (see below)
  - A delete icon/button per section
- **"Add another Section"** button at the bottom of the list — appends a new blank section card

**Behavior — sections:**
- On mount: `trips.listSections(tripId)` to hydrate existing sections (supports the user leaving and coming back).
- Adding a section: open the new card in an editable state immediately; on blur/save, call `trips.createSection(tripId, payload)` (include `city_id` if the section is tied to a specific city, per API guide Step 10's optional field). Assign the new section's `order_index` client-side as `sections.length` until the server confirms.
- Editing an existing section's title/budget: call `trips.updateSection(sectionId, payload)` (Step 13), debounce saves (e.g. on blur, not on every keystroke).
- Deleting a section: confirm via `Modal` ("Delete this section? This also removes its activities.") → `trips.deleteSection(sectionId)` (Step 21, expects `204`).
- Reordering: drag-and-drop reorders the local list, then calls `trips.reorderSections(tripId, orderedIds)` (Step 14) with the full new ID order; optimistically update `order_index` locally, roll back on failure.

**Behavior — activities within a section:**
- Each section card has an "Add activity" action that opens a small picker (search over `activities.getActivities({search,category,sort_by})` or the city-scoped `cities.getCitySuggestions`) and, on selection, calls `trips.addActivity(sectionId, {activity_id, scheduled_date, scheduled_time?, notes?})` (Step 12).
- Client-side validate `scheduled_date` falls within the section's own date range before submitting, mirroring the backend's own check (Step 12b: "Activity date cannot be after section end date") so the error surfaces instantly rather than round-tripping.
- Added activities render as a compact row inside the section card (name, scheduled date/time, cost) with inline edit (→ `trips.updateActivity`, Step 12c) and delete (→ `trips.deleteActivity`, Step 20) actions.

**Navigates to:** `/trips/:tripId/itinerary` (a "Review Itinerary" or "Done" primary button, once at least one section exists). **Navigated from:** `/trips/new` on trip creation, or Screen 3/Screen 9 "edit this trip" affordances.

---

### Screen 9 — Itinerary View Screen with Budget Section

**Route:** `/trips/:tripId/itinerary` · **File:** `pages/trips/ItineraryView.jsx` · **Protected:** Yes

**Layout:**
1. `SearchFilterBar` at top (shared component, consistent with Screens 3/6/8/10/11 even though filtering here applies to the day list rather than a card grid)
2. **"Itinerary for a selected place"** header, with trip name/date range
3. **Day-by-day view** ("Day 1", "Day 2", …) — derive day tabs/sections from the trip's date range and each section's activities' `scheduled_date`; under each day, list activities with their `activity_name`, `activity_category`, `scheduled_time`, `cost`, and `notes`, grouped by which section (city leg) they belong to
4. **"Physical Activity" / "Expense"** columns/labels per activity row — show category as a small tag and cost in `--font-mono` per style §3 (all tabular numeric data uses the mono font)
5. **Budget section** — call `trips.getBudget(tripId)` and render:
   - `total` as a prominent number
   - `by_category` as a small breakdown list/chart
   - `by_day` as a per-day total (can annotate each Day heading with that day's total)
   - `average_daily` displayed near the total
   - Use the **budget Badge** family (style §8) to flag the trip as under/approaching/over some reference (e.g. compare `total` against the sum of all section `budget` values) — always pair the danger-color badge with the warning-triangle icon and the words "Over budget," never color alone (style §9 accessibility floor)

**Behavior:**
- Fetch `trips.getItinerary(tripId)` for the day/section/activity structure and `trips.getBudget(tripId)` for the budget block, in parallel.
- This screen is read-oriented; an "Edit" action should route back to `/trips/:tripId/build` (Screen 5) rather than allow inline editing here.
- Empty itinerary (no sections yet) → `EmptyState`: "No itinerary yet" + "Start building" primary button → Screen 5.

**Navigates to:** `/trips/:tripId/build` (edit). **Navigated from:** Screen 3's "Previous Trips" cards, and (once FE2's screen exists) FE2's My Trips listing cards.

---

## 4. Cross-cutting concerns FE1 must get right for the whole app

- **Trip-status badges** (Ongoing/Upcoming/Completed) appear on both your Landing page's trip cards and FE2's My Trips listing — since you own the shared `Badge` component, get its three states pixel-correct once in Phase 0; FE2 will only ever consume it.
- **Global search** (Navbar, wired to `search.globalSearch`) returns `{cities:[], trips:[]}` — you build the input and the API call in Phase 0, but the **results page** itself belongs to FE2 (Screen 8-adjacent). Route the Navbar's search submit to `/search?q=...`, a route already stubbed in `routes/engineer2.routes.jsx`.
- **Auth/session expiry**: if any of your screens receives a `401` mid-session, `api/client.js`'s global handler (Phase 0) already redirects to `/login` — do not add a second, competing redirect inside your page components.

## 5. File ownership — FE1 may edit only:

```
src/main.jsx, src/App.jsx
src/styles/*
src/api/*
src/context/*, src/hooks/*
src/components/layout/*, src/components/shared/*
src/routes/engineer1.routes.jsx
src/routes/engineer2.routes.jsx   (Phase 0 creation only — do not touch again after push)
src/pages/auth/*, src/pages/trips/*
src/types/index.js
```

Never edit anything under `src/pages/my-trips/`, `src/pages/profile/`, `src/pages/search/`, `src/pages/community/`, `src/pages/calendar/`, `src/pages/admin/` beyond the initial Phase 0 stub creation.

## 6. Definition of Done — Phase 1 (FE1)

- [ ] All six screens above render correctly against the real running backend (per `API_TESTING_GUIDE.md`'s own test sequence — you should be able to walk through Steps 1, 9, 9b, 10, 10b, 10c, 11, 12, 12b, 12c, 13, 14, 15, 16 purely by clicking through your UI)
- [ ] Every screen implements loading/empty/error/populated states
- [ ] No hardcoded colors/spacing/radii — everything traces to `tokens.css`
- [ ] No field names invented beyond what `API_TESTING_GUIDE.md` returns
- [ ] Committed to `feature/engineer-1`, pushed, ready for FE2's branch to be merged in per `merge.md`