# 1. Mission

You own the **Trip Engine** of GlobeTrotter. Your objective is to build the core itinerary builder, nested trip aggregation, date validations, and budget calculations. 

Your work is the heart of the application: ensuring that users can create multi-city trips, schedule activities, and see a unified timeline and budget that calculates flawlessly.

# 2. Ownership Boundary

**Modules Owned:**
* `trips` (Trip shell CRUD and complex read views)
* `sections` (Stops / legs of a trip)
* `trip_activities` (Activities scheduled into sections)
* `budget` (Aggregation logic for expenses and costs)

**Expected to Modify:**
* `backend/api/routes/trips.py`
* `backend/api/routes/sections.py`
* `backend/api/routes/trip_activities.py`
* `backend/services/trip_service.py` (Itinerary nesting logic)
* `backend/services/budget_service.py` (Cost aggregation logic)
* `backend/schemas/trip.py`, `backend/schemas/section.py`, `backend/schemas/trip_activity.py`

**Explicitly Off-Limits:**
* You MUST NOT modify `auth`, `users`, or authentication security logic.
* You MUST NOT modify the core `cities` or `activities` catalog routes.
* You MUST NOT modify database migration schemas or seed scripts (handled by the Database Engineer).

# 3. Endpoints Owned

### Trips
* **POST** `/trips`
  * **Purpose:** Create trip shell (name, dates, place).
  * **Auth Required:** Bearer JWT (Owner).
* **GET** `/trips?status=&group_by=&sort_by=&search=&owner=&limit=`
  * **Purpose:** Trip listing, filtered/grouped/sorted.
* **GET** `/users/me/trips?type=preplanned|previous`
  * **Purpose:** Fetch current user's trips.
* **GET** `/trips/{tripId}/itinerary`
  * **Purpose:** Full day-wise itinerary (nested: trip → sections → activities). Powers both List and Calendar views.
* **GET** `/trips/{tripId}/budget`
  * **Purpose:** Expense/budget breakdown by category.

### Sections (Stops/Legs)
* **GET** `/trips/{tripId}/sections`
  * **Purpose:** List all sections for the itinerary builder.
* **POST** `/trips/{tripId}/sections`
  * **Purpose:** Add another Section (creates a stop/leg).
* **PATCH** `/sections/{sectionId}`
  * **Purpose:** Update section info, date range, budget.
* **DELETE** `/sections/{sectionId}`
  * **Purpose:** Remove a section.
* **PATCH** `/trips/{tripId}/sections/reorder`
  * **Purpose:** Reorder sections.

### Trip Activities
* **POST** `/sections/{sectionId}/activities`
  * **Purpose:** Add selected activity into a trip section.
* **PATCH** `/trip-activities/{id}`
  * **Purpose:** Edit a scheduled activity (time, cost override, notes).
* **DELETE** `/trip-activities/{id}`
  * **Purpose:** Remove an activity from the day.

# 4. Backend Logic Owned

* **Deep Nesting / Read Logic:** The `/trips/{tripId}/itinerary` endpoint must return a highly structured, 3-level nested JSON object (Trip -> Sections -> Activities) ordered by dates and times.
* **Date Validation Rules:** 
  * A Trip's end_date must be >= start_date.
  * A Section's dates must fall entirely within its parent Trip's dates.
  * A TripActivity's scheduled_date must fall entirely within its parent Section's dates.
* **Budget Aggregation:** `/trips/{tripId}/budget` must calculate total costs on the fly. Formula: `SUM(trip_activities.cost_override OR activities.cost) + SUM(sections.budget) + SUM(expenses.amount)`. Group these dynamically by category.
* **Reordering:** Implement the array/index swap logic for `/trips/{tripId}/sections/reorder` using the `order_index` database column.
* **Authorization:** Every endpoint MUST check that the `current_user.id` equals the `trip.user_id`. Do not allow users to edit trips they do not own.

# 5. Dependencies

* **Database Engineer:** Provides the complex relational schema (`trips`, `sections`, `section_activities`, `expenses`). **Development is unblocked** as the schema is documented.
* **Engineer 1:** Provides the `get_current_user` dependency for authentication, and the Pydantic schemas for `City` and `Activity` which you will embed in your itinerary response.
  * **Development is unblocked:** You can temporarily mock `get_current_user` to return a fake User object while Engineer 1 builds the real auth system.

# 6. Interface / Contract With Engineer 1

* **Auth Contract:** You will import `get_current_user` from Engineer 1's security module. 
* **Search Contract:** You will expose a service function `search_public_trips(query: str)` so Engineer 1 can call it from their global `/search?q=` endpoint.
* **Read Schemas:** You will import `CityRead` and `ActivityRead` from Engineer 1 to ensure standard formatting when returning catalog data nested inside your trips.

# 7. Independent Testing Plan

1. **Mock Authentication:** Create a fake `override_dependency` in FastAPI for `get_current_user` that injects a hardcoded demo user ID. This allows you to test all ownership rules immediately.
2. **Database Dependency:** Use the DB Agent's seeded data. Specifically, test against the seeded "Upcoming" trip that already contains sections and activities.
3. **API Tests:** Write end-to-end tests for the Builder loop: Create Trip -> Create Section -> Add Activity -> Fetch Itinerary.
4. **Validation Tests:** Write strict unit tests for date bounding (e.g., trying to schedule an activity outside a section's dates must return 400 Bad Request).
5. **Budget Tests:** Ensure `cost_override` successfully overrides the base `activity.cost` in the budget aggregation.

# 8. Definition of Done

- [ ] Authorization checks ensure users can only see/edit their own trips.
- [ ] Nested itinerary endpoint returns correctly formatted and sorted data.
- [ ] Budget endpoint accurately aggregates base costs, overrides, and section expenses.
- [ ] Date validations correctly reject invalid timelines.
- [ ] Section reordering updates `order_index` correctly in the database.
- [ ] All 13 Trip Engine endpoints are functional.
