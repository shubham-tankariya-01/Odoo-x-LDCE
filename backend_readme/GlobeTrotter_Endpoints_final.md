# GlobeTrotter — API Endpoints by Screen

Based on the wireframe (`GlobeTrotter - 8 hours.svg`), which defines **12 screens** — slightly different from the original PS doc (no separate public/share screen here, but adds a Community tab and a standalone Calendar View).

⚠️ **Scope note:** the filename says "8 hours." That's a much tighter build window than a standard hackathon. At 8 hours, seriously consider cutting Screens 10 (Community) and 12 (Admin Panel) — they're social/analytics layers on top of the core trip-building loop (Screens 3–9), which is what actually needs to work for a demo.

---

## Screen 1 — Login Screen
Fields: Username, Password

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Authenticate, return JWT |

---

## Screen 2 — Registration Screen
Fields: Photo, First Name, Last Name, Email, Phone Number, City, Country, Additional Info

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create user account |
| POST | `/users/me/photo` | Upload profile photo (separate multipart call, or fold into register as multipart) |

---

## Screen 3 — Main Landing Page
Sections: Banner, Group by/Filter/Sort/Search bar, "Plan a trip," Top Regional Selections, Previous Trips

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/cities/popular` | Top Regional Selections |
| GET | `/trips?owner=me&sort=recent&limit=5` | Previous Trips preview list |
| GET | `/search?q=` | Global search bar (cities/trips) |

---

## Screen 4 — Create a New Trip Screen
Fields: Select a Place, Start Date, End Date, Suggestions for Places/Activities, "Add another Section"

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/trips` | Create trip shell (name, start/end dates, place) |
| GET | `/cities/{id}/suggestions` | Suggested places/activities for the selected city |
| POST | `/trips/{tripId}/sections` | "Add another Section" — creates a stop/leg |

---

## Screen 5 — Build Itinerary Screen
Repeating "Section N" blocks: description, Date Range, Budget of section

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/trips/{tripId}/sections` | List all sections for the itinerary builder |
| PATCH | `/sections/{sectionId}` | Update section info, date range, budget |
| DELETE | `/sections/{sectionId}` | Remove a section |
| PATCH | `/trips/{tripId}/sections/reorder` | Reorder sections (drag-reorder, send ordered id list) |

---

## Screen 6 — User Trip Listing
Group by / Filter / Sort by / Search, cards grouped Ongoing / Upcoming / Completed

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/trips?status=ongoing\|upcoming\|completed&group_by=&sort_by=&search=` | Trip listing, filtered/grouped/sorted |

---

## Screen 7 — User Profile Page
Image, User Details (editable), Preplanned Trips, Previous Trips

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users/me` | Fetch profile details |
| PATCH | `/users/me` | Edit profile fields |
| GET | `/users/me/trips?type=preplanned` | Preplanned trips list |
| GET | `/users/me/trips?type=previous` | Previous trips list |

---

## Screen 8 — Activity Search / City Search Page
Group by / Filter / Sort / Search, result list with "Option and its details" + View button

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/activities?search=&category=&group_by=&sort_by=` | Search/filter activities (e.g. "Paragliding") |
| GET | `/cities?search=&filter=&sort_by=` | Search/filter cities |
| GET | `/activities/{id}` | "View" — activity detail |
| GET | `/cities/{id}` | "View" — city detail |
| POST | `/sections/{sectionId}/activities` | Add selected activity into a trip section |

---

## Screen 9 — Itinerary View Screen (with budget section)
Day 1 / Day 2 blocks, Physical Activity, Expense

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/trips/{tripId}/itinerary` | Full day-wise itinerary (nested: day → activities) |
| GET | `/trips/{tripId}/budget` | Expense/budget breakdown by category |
| PATCH | `/trip-activities/{id}` | Edit a scheduled activity (time, cost, notes) |
| DELETE | `/trip-activities/{id}` | Remove an activity from the day |

---

## Screen 10 — Community Tab Screen
Group by / Filter / Sort / Search, shared trip/activity experiences

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/community/posts?search=&group_by=&sort_by=` | Browse shared experiences |
| POST | `/community/posts` | Share a post about a trip/activity |
| GET | `/community/posts/{id}` | View a single post |
| POST | `/community/posts/{id}/like` | Like a post |
| POST | `/community/posts/{id}/comments` | Comment on a post |

---

## Screen 11 — Calendar View Screen
Same itinerary data as Screen 9, rendered as a calendar

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/trips/{tripId}/itinerary` | **Reuse Screen 9's endpoint** — render calendar-style client-side, don't build a second endpoint |

---

## Screen 12 — Admin Panel Screen
Manage Users, Popular Cities, Popular Activities, User Trends and Analytics

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/{id}` | Manage a user (e.g. suspend/activate) |
| DELETE | `/admin/users/{id}` | Remove a user |
| GET | `/admin/analytics/popular-cities` | Popular cities by trip volume |
| GET | `/admin/analytics/popular-activities` | Popular activities by booking volume |
| GET | `/admin/analytics/trends` | General usage/trend analytics |

---

## Consolidated Endpoint List (dedup, grouped by resource)

```
Auth
  POST   /auth/login
  POST   /auth/register

Users
  GET    /users/me
  PATCH  /users/me
  POST   /users/me/photo
  GET    /users/me/trips?type=preplanned|previous

Trips
  POST   /trips
  GET    /trips?status=&group_by=&sort_by=&search=&owner=&limit=
  GET    /trips/{tripId}/itinerary
  GET    /trips/{tripId}/budget

Sections (stops/legs)
  GET    /trips/{tripId}/sections
  POST   /trips/{tripId}/sections
  PATCH  /sections/{sectionId}
  DELETE /sections/{sectionId}
  PATCH  /trips/{tripId}/sections/reorder

Trip Activities
  POST   /sections/{sectionId}/activities
  PATCH  /trip-activities/{id}
  DELETE /trip-activities/{id}

Cities & Activities (catalog)
  GET    /cities?search=&filter=&sort_by=
  GET    /cities/{id}
  GET    /cities/{id}/suggestions
  GET    /cities/popular
  GET    /activities?search=&category=&group_by=&sort_by=
  GET    /activities/{id}

Community
  GET    /community/posts?search=&group_by=&sort_by=
  POST   /community/posts
  GET    /community/posts/{id}
  POST   /community/posts/{id}/like
  POST   /community/posts/{id}/comments

Admin
  GET    /admin/users
  PATCH  /admin/users/{id}
  DELETE /admin/users/{id}
  GET    /admin/analytics/popular-cities
  GET    /admin/analytics/popular-activities
  GET    /admin/analytics/trends

Search
  GET    /search?q=
```
