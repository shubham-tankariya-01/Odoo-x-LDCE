# GlobeTrotter — Frontend Engineer 2 (FE2) Build Instructions
### Role: Discovery, Social, Account & Admin Owner

---

## 0. How to use this file

Paste this entire file into your coding agent alongside two reference files:
- `fe_style_final.md` — the design system. Every visual value below comes from it.
- `API_TESTING_GUIDE.md` — the real backend contract. Every request/response shape below is copied from it.

**Before you write a single line:** confirm Engineer 1 (FE1) has pushed **Phase 0** to `main` (commit message `phase 0: shared architecture, tokens, shared components, api client, stub pages`). Run:

```
git checkout main
git pull
git checkout -b feature/engineer-2
```

Do **not** start from an older commit, and do not re-create any folder or file that already exists from Phase 0 — every file you need is already there, empty, waiting for you.

You are **not** running an architecture phase. You consume FE1's shared components, API client, tokens, and routing exactly as built. Your entire job is Phase 1 below: six screens, each already routed to an existing stub file — you open the existing file and build the real component inside it.

---

## 1. Ground rules

1. **File ownership is absolute.** You edit only the files listed in §3 "File ownership" below. Never edit `src/routes/engineer2.routes.jsx` (already wired by FE1), never edit `src/App.jsx`, never edit anything under `src/components/shared/`, `src/components/layout/`, `src/api/`, `src/styles/`, or FE1's pages under `src/pages/auth/` and `src/pages/trips/`.
2. **Use the shared components as-is.** `Button`, `Input`, `Card`, `Badge`, `SearchFilterBar`, `EmptyState`, `Skeleton`, `Modal`, `AppShell`, `Navbar` already exist and are styled per `fe_style_final.md`. If a screen seems to need a new visual pattern, check the style guide first (§8 covers buttons, inputs, cards, the search+filter bar, badges, empty states, and loading states) — reuse before inventing.
3. **All data comes from the real API contract in `API_TESTING_GUIDE.md`.** No screen invents mock data shapes that don't match a real endpoint response.
4. **Every list, card grid, and search screen uses the shared `SearchFilterBar`** exactly as built by FE1 — do not rebuild a bespoke search bar per screen.
5. **State machine for every screen:** loading (skeleton), empty (icon + message + CTA), error (inline message), populated. All four, every screen.
6. **If an endpoint you need doesn't exist in `API_TESTING_GUIDE.md`,** do not invent one — build the screen to gracefully render an empty/placeholder state for that specific data and flag it in your PR description rather than fabricating a fake response shape (this applies mainly to Screen 12, the Admin Panel — see its note below).

---

## 2. PHASE 1 — FE2's Screens (build in `feature/engineer-2`)

You own **discovery and account management**: browsing trips, viewing/editing your profile, searching activities and cities, the community feed, a calendar view, and the admin panel. These six screens are independent of each other and of FE1's trip-creation pipeline — they only ever *link into* FE1's screens (e.g. a trip card here routes to FE1's itinerary view), never share editable state with them.

### Screen 6 — User Trip Listing ("My Trips")

**Route:** `/my-trips` · **File:** `pages/my-trips/MyTrips.jsx` (already exists as a stub — open and replace its body) · **Protected:** Yes

**Layout:**
1. `SearchFilterBar` at top (search + Group by/Filter/Sort by — reused unmodified)
2. Three grouped rows/sections of trip `Card`s, matching the wireframe's three labeled groups:
   - **Ongoing** — trips currently in progress
   - **Upcoming** — trips not yet started
   - **Completed** — trips finished
   Each trip card shows the trip's `name`, date range, a one-line `description` excerpt ("Short Overview of the Trip"), and a trip-status `Badge` (style §8 status family: Ongoing → accent bg/primary text, Upcoming → surface-alt bg/secondary text, Completed → border bg/muted text).

**Data:**
- Fetch `trips.listTrips({sort_by, search})` for the full set, or use `users.getMyTrips(type)` where `type` maps to the grouping the API supports (per `API_TESTING_GUIDE.md` Step 18, `type=preplanned` filters to `status="upcoming"` — use this for the Upcoming group, and `trips.listTrips({status:"upcoming"|...})` or client-side grouping by the `status` field returned on every trip object for the other two groups). Group trips client-side by their `status` field (`upcoming`/`ongoing`/`completed`) if a single `listTrips()` call already returns everything — prefer one fetch over three redundant calls where the data supports it.
- Wire the `SearchFilterBar`'s search box to the `search` query param, "Sort by" to `sort_by` (`recent` per the guide), and "Group by"/"Filter" to client-side grouping/filtering of the same result set.

**Behavior:**
- Empty group (e.g. no completed trips) → don't render an empty `EmptyState` per group; just omit that group's row, or render a muted one-line "No completed trips yet." Reserve the full `EmptyState` (icon + CTA) for the case where the user has **zero** trips at all, with the CTA routing to FE1's `/trips/new`.
- Clicking a trip card → `/trips/:tripId/itinerary` (FE1's Screen 9 — this is a cross-owner navigation, confirm the route exists via `routes/engineer1.routes.jsx`, do not edit that file).

**Navigates to:** `/trips/:tripId/itinerary` (FE1). **Navigated from:** `Navbar`/global nav, Profile screen's "Previous Trips" link.

---

### Screen 7 — User Profile Page

**Route:** `/profile` · **File:** `pages/profile/Profile.jsx` (stub exists) · **Protected:** Yes

**Layout:**
- Two-column layout on desktop (stacked on mobile per style §4 breakpoints):
  - **Left:** circular **Image of the User** (avatar, per style §6 — initials fallback on `--color-bg-surface-alt` if no `photo_url`)
  - **Right:** **User Details** — `first_name`, `last_name`, `email` (read-only), `phone_number`, `city`, `country`, `additional_info` — each with an "edit" affordance per the wireframe's "to edit those information…" note
- Below the details block: two link/tab sections —
  - **Preplanned Trips** — a compact list/row of upcoming trip cards (reuse the same trip `Card` pattern as Screen 6, but this is a summary, not the full listing — link out to `/my-trips` for the full view)
  - **Previous Trips** — same pattern for completed trips

**Data & behavior:**
- On mount: `users.getMe()` to populate the read side.
- Edit mode: toggle each field (or the whole form) into editable `Input`s; on save, call `users.updateMe({first_name,last_name,phone_number,city,country,additional_info})` — note `email` is not in the update payload per `API_TESTING_GUIDE.md` Step 4, so render it as permanently read-only, never as an editable `Input`.
- Preplanned/Previous trip rows: `users.getMyTrips("preplanned")` and a completed-status equivalent (or reuse `trips.listTrips({status:...})`), same grouping logic as Screen 6 but capped to a handful of items (e.g. 3–4) with a "See all" link to `/my-trips`.
- Save button shows the `Button` loading state while `updateMe` is in flight; on success, show the updated values immediately (optimistic or refetch); on failure, inline error text under the offending field, per style §8's input error pattern.

**Navigates to:** `/my-trips` ("See all" links). **Navigated from:** `Navbar` avatar menu.

---

### Screen 8 — Activity Search Page / City Search Page

**Route:** `/search` (also the destination of the Navbar's global search submit) · **File:** `pages/search/ActivitySearch.jsx` (stub exists) · **Protected:** Yes (global-search-only queries may be reached logged-out per `GET /search`'s ❌ auth requirement — but the richer activity/city browse experience below assumes a logged-in user, consistent with `GET /activities` and `GET /cities` both being 🔒)

**Layout:**
1. `SearchFilterBar` at top
2. A page header reflecting the current query context (wireframe shows an example like "Paragliding" as the active search term)
3. **"Results"** — a vertical list of result rows, each with "Option and its details" (per wireframe: a compact card per result) and a **"View"** action per row
4. Results can be either **activities** or **cities** depending on what the query/filter targets — build this as a single results list that renders an activity-shaped row (name, category, cost, duration_mins, description, image_url) or a city-shaped row (name, country, cost_index, popularity_score, image_url) based on which endpoint served the data

**Data:**
- If the page was entered via the Navbar's global search box: call `search.globalSearch(q)` first (unauthenticated-safe, per Step 19) and render its `{cities, trips}` shape — note this endpoint returns **trips**, not activities, alongside cities, so a global search results page must be able to show a trip result row too (reuse Screen 6's trip card pattern for any `trips` entries in this response).
- If the page was entered via a dedicated "browse activities" or "browse cities" entry point (e.g. from `SearchFilterBar`'s own search field on this page, distinct from the Navbar's global one): call `activities.getActivities({search, category, sort_by})` or `cities.searchCities({search, filter, sort_by})` respectively, wiring "Group by"/"Filter"/"Sort by" to `category`/`filter`/`sort_by` params.
- Each result row's **View** button: for an activity result, open a `Modal` with the full `description`/`cost`/`duration_mins`; for a city result, navigate toward FE1's `/trips/new` with that `city_id` pre-selected (same hand-off pattern FE1's Landing page uses); for a trip result (from global search), navigate to FE1's `/trips/:tripId/itinerary`.

**Behavior:**
- Empty results → `EmptyState`: icon + "No results for '<query>'" + a primary button that clears the query.
- This screen must handle a slow or empty `q` gracefully — don't crash on `/search` with no query param; show a neutral prompt state ("Search for a city, activity, or trip") instead of an empty-results message in that specific case.

**Navigates to:** `/trips/new` (FE1, with city context), `/trips/:tripId/itinerary` (FE1, for trip results). **Navigated from:** `Navbar` (global search), this screen's own filters.

---

### Screen 10 — Community Tab Screen

**Route:** `/community` · **File:** `pages/community/Community.jsx` (stub exists) · **Protected:** Yes

**Layout:**
1. `SearchFilterBar` at top
2. Header: "Community" with the wireframe's descriptive copy: a section where users share their experience about a certain trip or activity, narrowed via the search/group/filter/sort controls above
3. A feed/grid of shared-experience `Card`s

**Data — important gap to flag:** `API_TESTING_GUIDE.md` contains **no community/social-post endpoints** (no `GET /community`, no posts, likes, or comments resource anywhere in the 21-endpoint contract). Per the ground rules, **do not invent a fake endpoint or fake response shape for this.** Build the screen's full layout, `SearchFilterBar` wiring, and `Card` structure now so it is visually complete and consistent with the rest of the app, but drive it from a clearly-marked local placeholder/empty data set and render the `EmptyState` ("No community posts yet") as the default state. Leave a prominent code comment noting that this screen is blocked on a backend endpoint that doesn't yet exist, so it's a two-line change once one is added (swap the placeholder array for a real `api/community.js` call).

**Navigates to:** (none defined yet — no per-post detail endpoint exists either). **Navigated from:** `Navbar`/global nav.

---

### Screen 11 — Calendar View Screen

**Route:** `/calendar` · **File:** `pages/calendar/Calendar.jsx` (stub exists) · **Protected:** Yes

**Layout:**
1. `SearchFilterBar` at top
2. A month/week calendar grid showing the user's trips and their scheduled activities plotted by date

**Data:**
- Combine `trips.listTrips()` (for date ranges/status, to shade or mark days that fall within a trip) with, for the currently-focused trip(s), `trips.getItinerary(tripId)` to plot individual activities on their `scheduled_date`. There is no dedicated `/calendar` endpoint — this screen is a client-side recombination of data you already have wrappers for from Phase 0; do not request a new endpoint.
- Clicking a day with activities → show a small popover/list of that day's activities (name, time, cost); clicking a day within a trip's range but with no scheduled activities yet → could deep-link to FE1's `/trips/:tripId/build` (Screen 5) to add one.

**Behavior:**
- If the user has no trips at all, render `EmptyState` ("Nothing on your calendar yet" + "Plan a trip" → FE1's `/trips/new`) instead of an empty grid.

**Navigates to:** `/trips/:tripId/build`, `/trips/:tripId/itinerary` (both FE1). **Navigated from:** `Navbar`/global nav.

---

### Screen 12 — Admin Panel Screen

**Route:** `/admin` · **File:** `pages/admin/AdminPanel.jsx` (stub exists) · **Protected:** Yes, and additionally gated on `user.is_admin === true` (this field exists on the `User` object per `API_TESTING_GUIDE.md` Step 1/3's response shape) — non-admin users hitting `/admin` should be redirected to `/` rather than shown a broken panel.

**Layout — four sections per the wireframe:**
1. **Manage Users** — "responsible for managing the users and their actions," gives the admin visibility into all trips made by users
2. **Popular Cities** — lists popular cities based on current user trends
3. **Popular Activities** — lists popular activities based on current trend data
4. **User Trends and Analytics** — cross-cutting analysis/useful aggregate information

**Data — important gap to flag:** `API_TESTING_GUIDE.md` contains **no admin-only endpoints** (no user-management list, no analytics/trends endpoint). It does contain data you can partially repurpose without fabricating anything:
- **Popular Cities** section: this one *does* map cleanly to a real endpoint — use `cities.getPopularCities()` (`GET /cities/popular`, already returns `popularity_score` sorted data) exactly as-is, no admin-specific endpoint needed.
- **Popular Activities**: `activities.getActivities({sort_by:"popularity"})` similarly gives you a real, non-fabricated data source for this section.
- **Manage Users** and **User Trends and Analytics**: no backing endpoint exists at all. Build the section shells (header, description copy from the wireframe, and a `Card`/table skeleton matching style.md conventions) but render them in a permanent, clearly-commented placeholder/empty state rather than inventing a fake user list or fake analytics numbers. Flag both in your PR description as blocked on backend work.

**Navigates to:** (none required). **Navigated from:** `Navbar` avatar menu, but only rendered as a menu option when `user.is_admin` is true.

---

## 3. File ownership — FE2 may edit only:

```
src/pages/my-trips/*
src/pages/profile/*
src/pages/search/*
src/pages/community/*
src/pages/calendar/*
src/pages/admin/*
```

You may add new sub-component files **inside these same folders** if a screen benefits from splitting into smaller pieces (e.g. `pages/my-trips/TripGroupRow.jsx`), since that stays inside your ownership boundary and creates no conflict with FE1. You may **not** add files to `src/components/shared/` even if you think a new shared primitive is warranted — flag it instead; FE1 owns that folder.

## 4. Definition of Done — Phase 1 (FE2)

- [ ] All six screens above render correctly against the real running backend, exercising `API_TESTING_GUIDE.md` Steps 5, 6, 7, 8, 17, 18, 19 at minimum
- [ ] Every screen implements loading/empty/error/populated states
- [ ] No hardcoded colors/spacing/radii — everything traces to FE1's `tokens.css`
- [ ] No field names invented beyond what `API_TESTING_GUIDE.md` returns; Community and the two blocked Admin sections are clearly marked placeholder, not fake-populated
- [ ] Cross-owner links (My Trips → itinerary view, Search → trip creation, Calendar → build itinerary) point at real FE1 routes and have been smoke-tested against `feature/engineer-1`'s branch or `main` post-Phase-0
- [ ] Committed to `feature/engineer-2`, pushed — you push and open the merge first; FE1 runs `merge.md` after pulling your branch in