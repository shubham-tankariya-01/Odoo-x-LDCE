# Backend Engineer 1 — Implementation Plan

> **Role:** Foundation, Discovery & Platform  
> **Stack:** Python 3.11+, FastAPI, SQLAlchemy (async), Pydantic v2, PostgreSQL (Neon)  
> **Source of truth:** [`BACKEND_WORKFLOW_ENGINEER_1.md`](file:///e:/Coding/Hackthon_Projects/Odoo-x-LDCE/workflows/BACKEND_WORKFLOW_ENGINEER_1.md)  
> **Integration context (read-only for now):** [`BACKEND_INTEGRATION_PLAN.md`](file:///e:/Coding/Hackthon_Projects/Odoo-x-LDCE/workflows/BACKEND_INTEGRATION_PLAN.md)

---

## 0. Pre-flight — What Already Exists

| Area | Status |
|---|---|
| Backend directory | Empty (only `backend/database/DATABASE-AGENT-TODO.md`) |
| Database | Owned by the DB engineer — schema is documented in [`GlobeTrotter_Schema.md`](file:///e:/Coding/Hackthon_Projects/Odoo-x-LDCE/schema_readme/GlobeTrotter_Schema.md) |
| Migrations / Seeds | DB engineer's responsibility — do NOT touch |
| Engineer 2's modules | Trips, Sections, Trip-Activities, Budget — do NOT touch |

**Implication:** We are building the FastAPI project skeleton from scratch. The project scaffolding (directory structure, `main.py`, `database.py`, config, models) is part of this plan's Phase 1.

---

## 1. Target Directory Structure

```
backend/
├── main.py                          # FastAPI app, router registration
├── config.py                        # Settings (DATABASE_URL, JWT_SECRET, etc.)
├── database.py                      # SQLAlchemy engine + async session
│
├── models/                          # SQLAlchemy ORM models (1 file per table)
│   ├── __init__.py
│   ├── user.py                      # ← Engineer 1 OWNS
│   ├── city.py                      # ← Engineer 1 OWNS
│   ├── activity.py                  # ← Engineer 1 OWNS
│   ├── trip.py                      # ← Engineer 2 OWNS (define stub only)
│   ├── section.py                   # ← Engineer 2 OWNS (define stub only)
│   ├── section_activity.py          # ← Engineer 2 OWNS (define stub only)
│   ├── expense.py                   # ← Engineer 2 OWNS (define stub only)
│   ├── community_post.py            # ← Engineer 1 OWNS (stretch)
│   ├── post_comment.py              # ← Engineer 1 OWNS (stretch)
│   └── post_like.py                 # ← Engineer 1 OWNS (stretch)
│
├── schemas/                         # Pydantic request/response schemas
│   ├── __init__.py
│   ├── auth.py                      # ← Engineer 1
│   ├── user.py                      # ← Engineer 1
│   ├── catalog.py                   # ← Engineer 1 (CityRead, ActivityRead)
│   ├── search.py                    # ← Engineer 1
│   ├── community.py                 # ← Engineer 1 (stretch)
│   ├── admin.py                     # ← Engineer 1 (stretch)
│   └── trip.py                      # ← Engineer 2 (DO NOT CREATE)
│
├── api/
│   ├── __init__.py
│   └── routes/
│       ├── __init__.py
│       ├── auth.py                  # ← Engineer 1
│       ├── users.py                 # ← Engineer 1
│       ├── catalog.py               # ← Engineer 1 (cities + activities)
│       ├── search.py                # ← Engineer 1
│       ├── community.py             # ← Engineer 1 (stretch)
│       ├── admin.py                 # ← Engineer 1 (stretch)
│       ├── trips.py                 # ← Engineer 2 (DO NOT CREATE)
│       ├── sections.py              # ← Engineer 2 (DO NOT CREATE)
│       └── trip_activities.py       # ← Engineer 2 (DO NOT CREATE)
│
├── services/                        # Business logic layer
│   ├── __init__.py
│   ├── auth_service.py              # ← Engineer 1
│   ├── user_service.py              # ← Engineer 1
│   ├── catalog_service.py           # ← Engineer 1
│   ├── search_service.py            # ← Engineer 1
│   ├── community_service.py         # ← Engineer 1 (stretch)
│   ├── admin_service.py             # ← Engineer 1 (stretch)
│   ├── trip_service.py              # ← Engineer 2 (DO NOT CREATE)
│   └── budget_service.py            # ← Engineer 2 (DO NOT CREATE)
│
├── core/
│   ├── __init__.py
│   ├── security.py                  # ← Engineer 1 (JWT, hashing, get_current_user)
│   └── dependencies.py              # ← Engineer 1 (get_db, get_current_admin_user)
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # Shared fixtures (TestClient, test DB session, demo user)
│   ├── test_auth.py                 # ← Engineer 1
│   ├── test_users.py                # ← Engineer 1
│   ├── test_catalog.py              # ← Engineer 1
│   ├── test_search.py               # ← Engineer 1
│   ├── test_community.py            # ← Engineer 1 (stretch)
│   └── test_admin.py                # ← Engineer 1 (stretch)
│
├── requirements.txt
└── .env.example
```

> **Contract Freeze files** (touched by both engineers during setup, then frozen):  
> `main.py`, `database.py`, `config.py`, `models/__init__.py`

---

## 2. Phased Implementation

### Phase 1 — Project Scaffolding & Core Security ⚡ (CRITICAL PATH)

This is the **highest-priority** work because Engineer 2 is blocked on `get_current_user`.

#### 1.1 Project Setup

| Task | File(s) | Details |
|---|---|---|
| Create `requirements.txt` | `requirements.txt` | `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `asyncpg`, `psycopg[binary]`, `pydantic[email]`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `python-multipart`, `pytest`, `httpx` |
| Create `.env.example` | `.env.example` | `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM=HS256`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60` |
| Create `config.py` | `backend/config.py` | Use `pydantic-settings.BaseSettings` to load `.env` |
| Create `database.py` | `backend/database.py` | `create_async_engine`, `async_sessionmaker`, `get_db` dependency |
| Create `main.py` | `backend/main.py` | FastAPI app, CORS middleware, register ALL routers (including Engineer 2's — use empty stubs or conditional imports) |

#### 1.2 SQLAlchemy Models (Engineer 1 Owned Tables)

| Model | File | DB Table | Key Columns |
|---|---|---|---|
| `User` | `models/user.py` | `users` | id (UUID PK), first_name, last_name, email (unique), password_hash, phone_number, city, country, photo_url, additional_info, is_admin, created_at |
| `City` | `models/city.py` | `cities` | id (UUID PK), name, country, cost_index, popularity_score, image_url |
| `Activity` | `models/activity.py` | `activities` | id (UUID PK), city_id (FK→cities), name, category, cost, duration_mins, description, image_url, popularity_score |

> Models for `trips`, `sections`, `section_activities`, `expenses` should be **stubbed** during Contract Freeze so that SQLAlchemy relationships can reference them. Engineer 2 will flesh them out.

#### 1.3 Core Security Module 🔐 (CRITICAL — Engineer 2 depends on this)

**File:** `backend/core/security.py`

| Function | Signature | Purpose |
|---|---|---|
| `hash_password` | `(plain: str) -> str` | bcrypt hash via passlib |
| `verify_password` | `(plain: str, hashed: str) -> bool` | bcrypt verify |
| `create_access_token` | `(data: dict, expires_delta: timedelta | None = None) -> str` | JWT encode with `python-jose` |
| `get_current_user` | `async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User` | Decode JWT, load user from DB, raise 401 if invalid |
| `get_current_admin_user` | `async def get_current_admin_user(user: User = Depends(get_current_user)) -> User` | Verify `user.is_admin == True`, raise 403 otherwise |

**OAuth2 Scheme:**
```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
```

**JWT Payload:**
```json
{ "sub": "<user_uuid>", "exp": <unix_timestamp> }
```

---

### Phase 2 — Auth Endpoints

**Router:** `backend/api/routes/auth.py` — prefix `/auth`

#### Endpoint: `POST /auth/register`

| Field | Details |
|---|---|
| **Pydantic Request** (`schemas/auth.py → UserRegister`) | `first_name: str`, `last_name: str`, `email: EmailStr`, `password: str` (min 6 chars), `phone_number: str | None`, `city: str | None`, `country: str | None`, `additional_info: str | None` |
| **Pydantic Response** (`schemas/auth.py → AuthResponse`) | `access_token: str`, `token_type: str = "bearer"`, `user: UserRead` |
| **Service logic** (`services/auth_service.py`) | 1. Check email uniqueness (query `users` table). 2. Hash password. 3. Insert new user row. 4. Generate JWT. 5. Return token + user object. |
| **Error cases** | `409 Conflict` — email already exists. `422` — validation failure. |

#### Endpoint: `POST /auth/login`

| Field | Details |
|---|---|
| **Request** | `OAuth2PasswordRequestForm` (FastAPI built-in): `username` (= email), `password` |
| **Response** | `AuthResponse` (same as register) |
| **Service logic** | 1. Look up user by email. 2. Verify password hash. 3. Generate JWT. 4. Return token. |
| **Error cases** | `401 Unauthorized` — bad credentials. |

---

### Phase 3 — User Profile Endpoints

**Router:** `backend/api/routes/users.py` — prefix `/users`

#### Endpoint: `GET /users/me`

| Field | Details |
|---|---|
| **Auth** | `Depends(get_current_user)` |
| **Response** (`schemas/user.py → UserRead`) | `id`, `first_name`, `last_name`, `email`, `phone_number`, `city`, `country`, `photo_url`, `additional_info`, `is_admin`, `created_at` |
| **Logic** | Return the user object already loaded by the dependency. |

#### Endpoint: `PATCH /users/me`

| Field | Details |
|---|---|
| **Auth** | `Depends(get_current_user)` |
| **Request** (`schemas/user.py → UserUpdate`) | All fields optional: `first_name`, `last_name`, `phone_number`, `city`, `country`, `additional_info` |
| **Logic** | Partial update — only set fields that are provided (use `model.model_dump(exclude_unset=True)`). |
| **Validation** | Do NOT allow changing `email`, `password`, or `is_admin` through this endpoint. |

#### Endpoint: `POST /users/me/photo`

| Field | Details |
|---|---|
| **Auth** | `Depends(get_current_user)` |
| **Request** | `UploadFile` (multipart) |
| **Logic** | Save file to a local `uploads/` directory (or cloud storage). Update `photo_url` on the user record. |
| **Response** | `{ "photo_url": "<url>" }` |

---

### Phase 4 — Catalog Endpoints (Cities & Activities)

**Router:** `backend/api/routes/catalog.py` — prefix (none — uses `/cities` and `/activities` directly)

All catalog endpoints require **authenticated access** (Bearer JWT).

#### Endpoint: `GET /cities/popular`

| Field | Details |
|---|---|
| **Logic** | `SELECT * FROM cities ORDER BY popularity_score DESC LIMIT 10` |
| **Response** | `list[CityRead]` |

> ⚠️ **Route ordering:** Register `/cities/popular` BEFORE `/cities/{id}` in the router to avoid FastAPI treating `"popular"` as a UUID path parameter.

#### Endpoint: `GET /cities?search=&filter=&sort_by=`

| Field | Details |
|---|---|
| **Query Params** | `search: str | None` (ILIKE on name), `filter: str | None` (country filter), `sort_by: str | None` (one of: `name`, `popularity`, `cost_index`) |
| **Logic** | Dynamic SQLAlchemy query with optional `.where()` and `.order_by()` clauses. |
| **Response** | `list[CityRead]` |

#### Endpoint: `GET /cities/{id}`

| Field | Details |
|---|---|
| **Path Param** | `id: UUID` |
| **Logic** | Fetch city by PK. Return 404 if not found. |
| **Response** | `CityRead` |

#### Endpoint: `GET /cities/{id}/suggestions`

| Field | Details |
|---|---|
| **Logic** | Fetch all activities for the given city: `SELECT * FROM activities WHERE city_id = :id ORDER BY popularity_score DESC` |
| **Response** | `list[ActivityRead]` |

#### Endpoint: `GET /activities?search=&category=&group_by=&sort_by=`

| Field | Details |
|---|---|
| **Query Params** | `search: str | None` (ILIKE on name), `category: str | None`, `sort_by: str | None` (one of: `name`, `cost`, `duration_mins`, `popularity`), `group_by: str | None` (for frontend grouping — backend returns flat list, frontend groups) |
| **Logic** | Dynamic query with filters. |
| **Response** | `list[ActivityRead]` |

#### Endpoint: `GET /activities/{id}`

| Field | Details |
|---|---|
| **Path Param** | `id: UUID` |
| **Logic** | Fetch activity by PK, include parent city info. Return 404 if not found. |
| **Response** | `ActivityDetailRead` (includes nested `CityRead`) |

---

### Phase 5 — Global Search

**Router:** `backend/api/routes/search.py` — prefix `/search`

#### Endpoint: `GET /search?q=`

| Field | Details |
|---|---|
| **Query Param** | `q: str` (required, min length 1) |
| **Logic** | 1. Search `cities` by name ILIKE `%q%`. 2. *(Future integration)* Call Engineer 2's `search_public_trips(q)` to get matching trips. For now, return an empty trip list. |
| **Response** (`schemas/search.py → SearchResults`) | `{ "cities": list[CityRead], "trips": [] }` |
| **Integration Note** | After Engineer 2 merges, we will import their trip search service and wire it in. Until then, trips array is empty — this is explicitly expected per the workflow. |

---

### Phase 6 — Stretch: Community Endpoints

> Only build these after Phases 1–5 are complete and tested.

**Router:** `backend/api/routes/community.py` — prefix `/community`

| Endpoint | Method | Auth | Logic |
|---|---|---|---|
| `/community/posts` | GET | JWT | List posts with optional `search`, `group_by`, `sort_by` query params. Join `users` for author info. |
| `/community/posts` | POST | JWT | Create post. Link optional `trip_id` and `activity_id`. |
| `/community/posts/{id}` | GET | JWT | Single post with comments and like count. |
| `/community/posts/{id}/like` | POST | JWT | Toggle like (INSERT or DELETE based on existing `post_likes` row). Use `UNIQUE(post_id, user_id)` constraint. |
| `/community/posts/{id}/comments` | POST | JWT | Add comment to post. |

**DB Tables used:** `community_posts`, `post_comments`, `post_likes`

---

### Phase 7 — Stretch: Admin Endpoints

> Only build these after Phases 1–6 are complete.

**Router:** `backend/api/routes/admin.py` — prefix `/admin`

All admin endpoints require `Depends(get_current_admin_user)`.

| Endpoint | Method | Logic |
|---|---|---|
| `/admin/users` | GET | List all users (paginated). |
| `/admin/users/{id}` | PATCH | Suspend/activate user (update `is_admin` or a future `is_active` field). |
| `/admin/users/{id}` | DELETE | Hard-delete user (cascades to trips per FK). |
| `/admin/analytics/popular-cities` | GET | `SELECT c.name, COUNT(s.id) FROM cities c JOIN sections s ON s.city_id = c.id GROUP BY c.id ORDER BY count DESC LIMIT 10` |
| `/admin/analytics/popular-activities` | GET | `SELECT a.name, COUNT(sa.id) FROM activities a JOIN section_activities sa ON sa.activity_id = a.id GROUP BY a.id ORDER BY count DESC LIMIT 10` |
| `/admin/analytics/trends` | GET | General stats: total users, total trips, trips created per week, etc. |

---

## 3. Pydantic Schema Definitions

### `schemas/auth.py`

```python
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str  # min_length=6
    phone_number: str | None = None
    city: str | None = None
    country: str | None = None
    additional_info: str | None = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
```

### `schemas/user.py`

```python
class UserRead(BaseModel):
    id: UUID
    first_name: str | None
    last_name: str | None
    email: str
    phone_number: str | None
    city: str | None
    country: str | None
    photo_url: str | None
    additional_info: str | None
    is_admin: bool
    created_at: datetime

class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    city: str | None = None
    country: str | None = None
    additional_info: str | None = None
```

### `schemas/catalog.py`

```python
class CityRead(BaseModel):
    id: UUID
    name: str
    country: str | None
    cost_index: float | None
    popularity_score: int
    image_url: str | None

class ActivityRead(BaseModel):
    id: UUID
    city_id: UUID
    name: str
    category: str | None
    cost: float | None
    duration_mins: int | None
    description: str | None
    image_url: str | None
    popularity_score: int

class ActivityDetailRead(ActivityRead):
    city: CityRead  # nested parent city
```

### `schemas/search.py`

```python
class SearchResults(BaseModel):
    cities: list[CityRead]
    trips: list  # Will be list[TripSearchResult] after integration
```

---

## 4. Contracts Provided to Engineer 2

These are the interfaces Engineer 2 will depend on. They must be stable before branching.

| Contract | Module | Signature |
|---|---|---|
| Auth dependency | `core/security.py` | `get_current_user(token, db) -> User` |
| Admin guard | `core/security.py` | `get_current_admin_user(user) -> User` |
| City schema | `schemas/catalog.py` | `CityRead` |
| Activity schema | `schemas/catalog.py` | `ActivityRead` |
| DB session | `database.py` | `get_db() -> AsyncSession` |

---

## 5. Dependencies I Consume

| What | From Whom | Status | Workaround |
|---|---|---|---|
| `users` table (schema + seeds) | DB Engineer | Documented, not yet provisioned | Code against the documented schema; will work once migration runs |
| `cities` table (schema + seeds) | DB Engineer | Same | Same |
| `activities` table (schema + seeds) | DB Engineer | Same | Same |
| `community_posts`, `post_comments`, `post_likes` tables | DB Engineer | Optional / stretch | Only needed for Phase 6 |
| `search_public_trips(q)` | Engineer 2 | Not built yet | Return empty `trips: []` in search results; wire in after integration |

---

## 6. Testing Strategy

### Unit Tests (no DB required)

| Test | File | What it validates |
|---|---|---|
| Password hashing roundtrip | `tests/test_auth.py` | `verify_password(plain, hash_password(plain)) == True` |
| JWT encode/decode | `tests/test_auth.py` | Token contains correct `sub`, expiration works |
| Expired token rejection | `tests/test_auth.py` | `get_current_user` raises 401 for expired tokens |

### API Tests (TestClient + test DB)

| Test | File | What it validates |
|---|---|---|
| Register new user | `tests/test_auth.py` | 201, returns token, user appears in DB |
| Register duplicate email | `tests/test_auth.py` | 409 Conflict |
| Login with valid creds | `tests/test_auth.py` | 200, returns valid JWT |
| Login with wrong password | `tests/test_auth.py` | 401 |
| GET `/users/me` with valid token | `tests/test_users.py` | 200, correct user fields |
| GET `/users/me` without token | `tests/test_users.py` | 401 |
| PATCH `/users/me` partial update | `tests/test_users.py` | Only specified fields change |
| GET `/cities/popular` | `tests/test_catalog.py` | Returns list sorted by popularity |
| GET `/cities?search=paris` | `tests/test_catalog.py` | Filters correctly |
| GET `/cities/{id}` not found | `tests/test_catalog.py` | 404 |
| GET `/cities/{id}/suggestions` | `tests/test_catalog.py` | Returns activities for that city |
| GET `/activities?category=adventure` | `tests/test_catalog.py` | Filters by category |
| GET `/search?q=tokyo` | `tests/test_search.py` | Returns matching cities, empty trips |

### Test Fixtures (`tests/conftest.py`)

```python
# 1. Create an in-memory or test PostgreSQL database
# 2. Run the DB engineer's migrations against it
# 3. Seed a demo user (with known password) and a few cities/activities
# 4. Provide a TestClient and auth headers fixture
```

---

## 7. Execution Order & Priority

| Priority | Phase | Endpoints | Blocked By |
|---|---|---|---|
| 🔴 P0 | Phase 1: Scaffolding + Security | `get_current_user` | Nothing — start immediately |
| 🔴 P0 | Phase 2: Auth | `POST /auth/register`, `POST /auth/login` | Phase 1 |
| 🟡 P1 | Phase 3: Users | `GET/PATCH /users/me`, `POST /users/me/photo` | Phase 2 |
| 🟡 P1 | Phase 4: Catalog | All 6 city/activity endpoints | Phase 1 (needs models) |
| 🟢 P2 | Phase 5: Search | `GET /search?q=` | Phase 4 (needs catalog queries) |
| ⚪ Stretch | Phase 6: Community | 5 community endpoints | Phase 1 |
| ⚪ Stretch | Phase 7: Admin | 6 admin endpoints | Phase 1 |

---

## 8. Definition of Done Checklist

- [ ] FastAPI project runs with `uvicorn backend.main:app --reload`
- [ ] `get_current_user` dependency works and is importable by Engineer 2
- [ ] `POST /auth/register` creates user, returns JWT
- [ ] `POST /auth/login` authenticates, returns JWT
- [ ] `GET /users/me` returns profile for authenticated user
- [ ] `PATCH /users/me` partially updates profile
- [ ] `POST /users/me/photo` accepts file upload and updates `photo_url`
- [ ] `GET /cities/popular` returns top cities by popularity
- [ ] `GET /cities?search=&filter=&sort_by=` filters/sorts correctly
- [ ] `GET /cities/{id}` returns single city or 404
- [ ] `GET /cities/{id}/suggestions` returns activities for that city
- [ ] `GET /activities?search=&category=&group_by=&sort_by=` filters correctly
- [ ] `GET /activities/{id}` returns activity detail with nested city
- [ ] `GET /search?q=` returns matching cities (trips stubbed as empty)
- [ ] All tests pass independently
- [ ] No files in Engineer 2's ownership boundary were modified
- [ ] (Stretch) Community endpoints implemented
- [ ] (Stretch) Admin analytics endpoints implemented with admin-only guard

---

## 9. Notes for Future Integration

> **Do NOT act on these yet** — they are documented here for awareness only.

1. After Engineer 2 merges, wire `search_public_trips()` into `/search?q=`.
2. After integration, run a full E2E test: Register → Login → Search cities → (Create trip via Eng 2 endpoints) → Search trips → verify results.
3. The Contract Freeze in `main.py` should pre-register all routers (including Eng 2's empty stubs) so neither engineer edits `main.py` during parallel dev.
4. Engineer 1 merges to `main` first (foundation layer), then Engineer 2 rebases.
