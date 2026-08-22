# GlobeTrotter Backend Integration Plan

This document defines the parallel development strategy, shared contracts, and final integration plan for the GlobeTrotter backend, dividing work between Engineer 1 (Auth & Catalog) and Engineer 2 (Trip Engine).

## A. Branch Strategy

We will use a modular branch strategy to minimize conflicts:
1. `main` - Stable baseline (contains empty project setup and DB connection).
2. `backend/engineer-1-foundation` - Owned by Engineer 1.
3. `backend/engineer-2-engine` - Owned by Engineer 2.

Both engineers branch from `main` after the **Contract Freeze** is merged.

## B. Ownership Rules

* **Engineer 1** owns: `api/routes/auth.py`, `api/routes/users.py`, `api/routes/catalog.py`, `api/routes/search.py`, `core/security.py`, and related schemas.
* **Engineer 2** owns: `api/routes/trips.py`, `api/routes/sections.py`, `api/routes/trip_activities.py`, `services/budget_service.py`, `services/trip_service.py`, and related schemas.
* **Database Engineer** owns: All SQL under `db/migrations/` and `db/seeds/`. Backend engineers MUST NOT modify migrations.

## C. Shared File Strategy

Merge conflicts happen in shared files. Here is how we avoid them:

| File | Conflict Risk | Strategy |
|---|---|---|
| `main.py` (FastAPI Router) | **High** | Pre-configure `main.py` in the Contract Freeze to include all `APIRouter` prefixes before branching. Neither engineer edits this file during parallel dev. |
| `database.py` (Session logic) | **Low** | Created during project setup. Neither engineer modifies this. |
| `models/*.py` (SQLAlchemy) | **High** | The DB Engineer's tables should be mapped to SQLAlchemy models *before* branching. If using SQLModel/SQLAlchemy, generate these during the Contract Freeze. |
| `schemas/*.py` (Pydantic) | **Medium** | Separate into `user.py`, `catalog.py`, `trip.py`. Eng 1 imports `trip.py` for search. Eng 2 imports `catalog.py` for the itinerary. Define base schemas early. |

## D. Contract Freeze

Before parallel coding begins, the team MUST agree on and merge these into `main`:

1. **Authentication Dependency:**
   ```python
   # core/security.py (Stubbed by Eng 1, used by Eng 2)
   async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
       pass 
   ```
2. **Global Router Registration:**
   Register `/auth`, `/users`, `/cities`, `/trips`, `/sections`, etc. in `main.py`.
3. **Nested Itinerary Schema Shape:**
   Agree on the JSON shape returned by `GET /trips/{id}/itinerary` so the Frontend can start building the Calendar/List views immediately.
4. **Database Models:**
   Map the Database Agent's schema to SQLAlchemy classes.

## E. Parallel Development Workflow

1. **Phase 1: Setup & Freeze (Hour 1)**
   * DB Agent runs migrations and seeds.
   * Backend engineers write the Contract Freeze (models, empty routers, auth dependency stub) and merge to `main`.
2. **Phase 2: Independent Parallel Dev (Hours 2 - 6)**
   * Engineer 1 builds Auth and Catalog on their branch.
   * Engineer 2 mocks `get_current_user` using FastAPI's `app.dependency_overrides` and builds the Trip Engine on their branch.
3. **Phase 3: Integration (Hour 7)**
   * Engineer 1 opens a PR and merges to `main`.
   * Engineer 2 rebases their branch on `main`, removes the `get_current_user` mock, and ensures real tokens work with Trip routes.
   * Engineer 2 merges to `main`.
4. **Phase 4: Stretch Goals & E2E Testing (Hour 8)**
   * Build Community/Admin if time permits. Run end-to-end frontend tests.

## F. Testing Before Integration

**Engineer 1:**
- Generate real JWTs via `/auth/login`.
- Verify JWTs unlock `/users/me`.
- Ensure `/cities` endpoints return the DB Agent's seeded data.

**Engineer 2:**
- Use `app.dependency_overrides[get_current_user] = override_get_user` in tests to inject the seeded demo user's ID.
- Write a test script that hits: POST Trip -> POST Section -> POST Activity.
- Verify `GET /trips/{id}/budget` correctly calculates the math against the seeded "Upcoming" trip.

## G. Final Integration

1. Engineer 1 merges first (Foundation layer).
2. Engineer 2 rebases. **Action required:** Remove the `dependency_overrides` and test that an actual token from `/auth/login` successfully authorizes a `POST /trips` request.
3. Engineer 1 connects `/search?q=` to Engineer 2's trip search service.
4. Run full suite.
5. Provide the Frontend team with the final live endpoints and a valid demo token.

---

## H. Endpoint Completeness Check

| Endpoint | Method | Engineer | Covered? | Notes |
|---|---|---|---|---|
| `/auth/login` | POST | Eng 1 | Yes | |
| `/auth/register` | POST | Eng 1 | Yes | |
| `/users/me` | GET | Eng 1 | Yes | |
| `/users/me` | PATCH | Eng 1 | Yes | |
| `/users/me/photo` | POST | Eng 1 | Yes | |
| `/cities?search...` | GET | Eng 1 | Yes | |
| `/cities/{id}` | GET | Eng 1 | Yes | |
| `/cities/{id}/suggestions` | GET | Eng 1 | Yes | |
| `/cities/popular` | GET | Eng 1 | Yes | |
| `/activities?search...` | GET | Eng 1 | Yes | |
| `/activities/{id}` | GET | Eng 1 | Yes | |
| `/search?q=` | GET | Eng 1 | Yes | Depends on Eng 2's Trip logic |
| `/trips` | POST | Eng 2 | Yes | |
| `/trips?status...` | GET | Eng 2 | Yes | |
| `/trips/{tripId}/itinerary` | GET | Eng 2 | Yes | The most complex endpoint |
| `/trips/{tripId}/budget` | GET | Eng 2 | Yes | |
| `/users/me/trips?type...` | GET | Eng 2 | Yes | Trip domain query |
| `/trips/{tripId}/sections` | GET | Eng 2 | Yes | |
| `/trips/{tripId}/sections` | POST | Eng 2 | Yes | |
| `/sections/{sectionId}` | PATCH | Eng 2 | Yes | |
| `/sections/{sectionId}` | DELETE | Eng 2 | Yes | |
| `/trips/{tripId}/sections/reorder`| PATCH | Eng 2 | Yes | |
| `/sections/{sectionId}/activities`| POST | Eng 2 | Yes | |
| `/trip-activities/{id}` | PATCH | Eng 2 | Yes | |
| `/trip-activities/{id}` | DELETE | Eng 2 | Yes | |
| `/community/posts...` | ALL | Eng 1 | *Stretch* | Documented as stretch goal |
| `/admin/...` | ALL | Eng 1 | *Stretch* | Documented as stretch goal |
| `/public/trips/{slug}` | GET | - | *Excluded*| Explicitly cut in `GlobeTrotter_Endpoints_final.md` |
| `/trips/{id}/copy` | POST | - | *Excluded*| Explicitly cut in `GlobeTrotter_Endpoints_final.md` |

Every endpoint is accounted for and owned by exactly one engineer.

## I. Workload Analysis

1. **Is the division clean?** Yes. Domain-driven separation prevents them from touching the same business logic files.
2. **Is the workload balanced?** 
   * **Endpoint Count:** Eng 1 has 12 MVP endpoints; Eng 2 has 13 MVP endpoints. 
   * **Complexity:** Eng 2's endpoints are highly complex (date math, nested joins, aggregation). Eng 1's endpoints are mostly standard CRUD and read-only searches. This is a very balanced split—Eng 1 will finish MVP fast and move to stretch goals (Community/Admin), while Eng 2 perfects the core engine.
3. **Integration Heavy Work?** Eng 1's `/search` requires importing logic from Eng 2. Eng 2 requires the Auth dependency from Eng 1. These are clearly defined and easily mocked.
4. **Shared-file Hotspots?** `main.py` and SQLAlchemy Models. Solved via the Contract Freeze phase.
5. **Circular Dependencies?** None. `get_current_user` is injected via dependency injection at the router level, preventing import loops between `trips.py` and `security.py`.

## J. Final Recommendation

**Would you use this split?**
Yes. Splitting by "Foundation vs. Trip Engine" is vastly superior to an arbitrary 50/50 split of endpoints. It prevents both engineers from colliding inside the heavy Trip validation logic.

**What is the biggest risk?**
Engineer 2 getting bogged down in the deep nesting of `GET /trips/{id}/itinerary` while the frontend is blocked waiting for it. 

**What should the team do BEFORE coding starts?**
Hardcode the exact JSON response for `GET /trips/{id}/itinerary` and put it in a file. Hand it to the frontend team immediately so they can build the List and Calendar views while Engineer 2 actually writes the SQL joins to generate it dynamically.

**Testing and Integration Strategy:**
Engineer 2 MUST utilize FastAPI's `dependency_overrides` to mock Auth. If Engineer 2 waits for Engineer 1 to finish Auth before starting, the hackathon will be lost. Integrate ONLY when both branches pass their independent tests.
