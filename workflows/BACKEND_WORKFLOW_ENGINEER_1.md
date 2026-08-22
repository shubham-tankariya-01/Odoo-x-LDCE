# 1. Mission

You own the **Foundation, Discovery, and Platform** layer of GlobeTrotter. Your objective is to manage user identity, authentication, the core travel catalog (cities and activities), global search, and the platform's stretch goals (community sharing and admin analytics). 

Your work ensures users can securely sign in, find places to go, and interact with the platform beyond their personal itineraries.

# 2. Ownership Boundary

**Modules Owned:**
* `auth` (Authentication & JWT handling)
* `users` (Profile management)
* `catalog` (Cities and Activities read operations)
* `search` (Global search aggregation)
* `community` (Social posts, likes, comments - Stretch Goal)
* `admin` (User management and analytics - Stretch Goal)

**Expected to Modify:**
* `backend/api/routes/auth.py`
* `backend/api/routes/users.py`
* `backend/api/routes/catalog.py`
* `backend/api/routes/search.py`
* `backend/api/routes/community.py`
* `backend/api/routes/admin.py`
* `backend/core/security.py` (JWT and hashing logic)
* `backend/schemas/user.py`, `backend/schemas/catalog.py`, `backend/schemas/community.py`

**Explicitly Off-Limits:**
* You MUST NOT modify `trips`, `sections`, `trip_activities`, or `budget` business logic.
* You MUST NOT modify the itinerary generation or nested trip aggregation routes.
* You MUST NOT modify database migration schemas or seed scripts (handled by the Database Engineer).

# 3. Endpoints Owned

### Authentication
* **POST** `/auth/login`
  * **Purpose:** Authenticate user, return JWT.
  * **Request:** Username (email), Password.
  * **Response:** `{ "access_token": "...", "token_type": "bearer" }`
  * **Auth Required:** None.
* **POST** `/auth/register`
  * **Purpose:** Create user account.
  * **Request:** User details (First Name, Last Name, Email, Password, etc.).
  * **Response:** User object / JWT.
  * **Auth Required:** None.
  * **Validation:** Email uniqueness check.

### Users
* **GET** `/users/me`
  * **Purpose:** Fetch current user profile.
  * **Auth Required:** Bearer JWT.
* **PATCH** `/users/me`
  * **Purpose:** Edit profile fields.
  * **Auth Required:** Bearer JWT.
* **POST** `/users/me/photo`
  * **Purpose:** Upload profile photo.
  * **Auth Required:** Bearer JWT.

### Cities & Activities (Catalog)
* **GET** `/cities?search=&filter=&sort_by=`
  * **Purpose:** Search/filter cities.
* **GET** `/cities/{id}`
  * **Purpose:** City detail view.
* **GET** `/cities/{id}/suggestions`
  * **Purpose:** Suggested places/activities for the selected city.
* **GET** `/cities/popular`
  * **Purpose:** Top regional selections.
* **GET** `/activities?search=&category=&group_by=&sort_by=`
  * **Purpose:** Search/filter activities.
* **GET** `/activities/{id}`
  * **Purpose:** Activity detail view.

### Search
* **GET** `/search?q=`
  * **Purpose:** Global search across cities and trips.

### Community (Stretch Goal)
* **GET** `/community/posts?search=&group_by=&sort_by=`
* **POST** `/community/posts`
* **GET** `/community/posts/{id}`
* **POST** `/community/posts/{id}/like`
* **POST** `/community/posts/{id}/comments`

### Admin (Stretch Goal)
* **GET** `/admin/users`
* **PATCH** `/admin/users/{id}`
* **DELETE** `/admin/users/{id}`
* **GET** `/admin/analytics/popular-cities`
* **GET** `/admin/analytics/popular-activities`
* **GET** `/admin/analytics/trends`
*(Admin endpoints require admin authorization check).*

# 4. Backend Logic Owned

* **JWT & Security:** Implement the dependency to decode and verify JWTs (`get_current_user`). This is the most critical block for parallel development as Engineer 2 needs it.
* **Password Hashing:** Hash passwords on registration using bcrypt/passlib.
* **Catalog Queries:** Build flexible SQLAlchemy queries to filter, sort, and search the seeded `cities` and `activities` tables.
* **Global Search Aggregation:** Implement logic to search both `cities` and `trips` simultaneously for `/search?q=`. You will need to import a trip search service from Engineer 2 to fulfill this.
* **Admin Analytics:** If building stretch goals, write aggregate SQL queries (e.g., `COUNT(trips) GROUP BY city_id`) to power popular cities/activities metrics.

# 5. Dependencies

* **Database Engineer:** Provides the `users`, `cities`, `activities`, and `community_posts` tables and seeds them. **Development is unblocked** because you know the schema.
* **Engineer 2:** Owns the `trips` table. You depend on Engineer 2 for the `/search?q=` endpoint (to search trips). **Development is unblocked**; you can stub the trip results until they finish their search service.
* **Shared Infrastructure:** You will establish the `security.py` utilities (JWT tokens). Engineer 2 depends on YOU for this.

# 6. Interface / Contract With Engineer 2

* **The Auth Contract:** You will provide a `get_current_user` FastAPI dependency. You must define this function signature immediately so Engineer 2 can mock it.
  * Example: `async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:`
* **Search Contract:** You will call `search_public_trips(query: str)` from Engineer 2's domain to fulfill the global `/search` endpoint. Agree on the returned object shape.
* **Schema Sharing:** You provide the Pydantic schemas for `CityRead` and `ActivityRead`. Engineer 2 will nest these inside their Itinerary responses.

# 7. Independent Testing Plan

You can test entirely independently of Engineer 2:
1. **Unit Tests:** Test password hashing, JWT encoding/decoding, and token expiration logic directly.
2. **API Tests:** Use FastAPI's `TestClient` to test `/auth/register` and `/auth/login`. Extract the token and use it to hit `/users/me`.
3. **Database Dependency:** Use the Database Engineer's local seed script to populate cities and activities.
4. **Testing Search:** Mock the trip results in the global search endpoint until Engineer 2 provides the trip search service.

# 8. Definition of Done

- [ ] JWT authentication is fully implemented and tested.
- [ ] `get_current_user` dependency is exported and stable.
- [ ] Profile CRUD operations work correctly.
- [ ] All 6 catalog endpoints accurately query the database and support filtering.
- [ ] Global search successfully returns city results (and mocked trip results).
- [ ] (Stretch) Community endpoints implemented.
- [ ] (Stretch) Admin analytics endpoints implemented with admin-only authorization.
