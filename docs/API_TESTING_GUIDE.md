# GlobeTrotter API — Swagger UI Testing Guide

**How to use this file:**
1. Start your server: `uvicorn backend.main:app --reload` (from project root)
2. Open http://localhost:8000/docs in your browser
3. Follow each endpoint below **in order** (top to bottom)
4. For each endpoint: click it → click **Try it out** → paste the JSON body → click **Execute**
5. **Save the IDs** from responses — you'll need them for later endpoints

> **IMPORTANT:** For all endpoints marked with 🔒, you must first click the green **Authorize** button at the top of the Swagger page and paste your `access_token` (you'll get it from Step 1).

---

## ═══════════════════════════════════════════
## STEP 1: Register a User
## ═══════════════════════════════════════════

**Endpoint:** `POST /auth/register`
**Auth Required:** ❌ No

**Paste this JSON body:**
```json
{
  "first_name": "Shubham",
  "last_name": "Tankariya",
  "email": "shubham@globetrotter.com",
  "password": "Password@123",
  "phone_number": "+91-9876543210",
  "city": "Ahmedabad",
  "country": "India"
}
```

**Expected Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "first_name": "Shubham",
    "last_name": "Tankariya",
    "email": "shubham@globetrotter.com",
    "phone_number": "+91-9876543210",
    "city": "Ahmedabad",
    "country": "India",
    "photo_url": null,
    "additional_info": null,
    "is_admin": false,
    "created_at": "2026-08-22T06:00:00.000000Z"
  }
}
```

> ✅ **ACTION:** Copy the `access_token` value. Click the green **Authorize** 🔒 button at the top of the Swagger page, paste it, click **Authorize**, then click **Close**.

---

## ═══════════════════════════════════════════
## STEP 2: Login (if already registered)
## ═══════════════════════════════════════════

**Endpoint:** `POST /auth/login`
**Auth Required:** ❌ No

> ⚠️ This endpoint uses **form fields**, NOT JSON. In Swagger UI, fill in the form fields directly:

| Field | Value |
|---|---|
| username | `shubham@globetrotter.com` |
| password | `Password@123` |

Leave all other fields (`grant_type`, `scope`, `client_id`, `client_secret`) empty.

**Expected Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "first_name": "Shubham",
    "last_name": "Tankariya",
    "email": "shubham@globetrotter.com",
    "phone_number": "+91-9876543210",
    "city": "Ahmedabad",
    "country": "India",
    "photo_url": null,
    "additional_info": null,
    "is_admin": false,
    "created_at": "2026-08-22T06:00:00.000000Z"
  }
}
```

---

## ═══════════════════════════════════════════
## STEP 3: Get My Profile
## ═══════════════════════════════════════════

**Endpoint:** `GET /users/me`
**Auth Required:** 🔒 Yes

**No body needed.** Just click Try it out → Execute.

**Expected Response (200):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "first_name": "Shubham",
  "last_name": "Tankariya",
  "email": "shubham@globetrotter.com",
  "phone_number": "+91-9876543210",
  "city": "Ahmedabad",
  "country": "India",
  "photo_url": null,
  "additional_info": null,
  "is_admin": false,
  "created_at": "2026-08-22T06:00:00.000000Z"
}
```

---

## ═══════════════════════════════════════════
## STEP 4: Update My Profile
## ═══════════════════════════════════════════

**Endpoint:** `PATCH /users/me`
**Auth Required:** 🔒 Yes

**Paste this JSON body:**
```json
{
  "first_name": "Shubham",
  "last_name": "Tankariya",
  "phone_number": "+91-9876543210",
  "city": "Gandhinagar",
  "country": "India",
  "additional_info": "Travel enthusiast & full-stack developer"
}
```

**Expected Response (200):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "first_name": "Shubham",
  "last_name": "Tankariya",
  "email": "shubham@globetrotter.com",
  "phone_number": "+91-9876543210",
  "city": "Gandhinagar",
  "country": "India",
  "photo_url": null,
  "additional_info": "Travel enthusiast & full-stack developer",
  "is_admin": false,
  "created_at": "2026-08-22T06:00:00.000000Z"
}
```

---

## ═══════════════════════════════════════════
## STEP 5: Get Popular Cities
## ═══════════════════════════════════════════

**Endpoint:** `GET /cities/popular`
**Auth Required:** 🔒 Yes

**No body needed.** Just click Try it out → Execute.

**Expected Response (200):**
```json
[
  {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "name": "Paris",
    "country": "France",
    "cost_index": 8.5,
    "popularity_score": 100,
    "image_url": "https://example.com/paris.jpg"
  },
  {
    "id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "name": "Tokyo",
    "country": "Japan",
    "cost_index": 9.0,
    "popularity_score": 95,
    "image_url": "https://example.com/tokyo.jpg"
  }
]
```

> ✅ **ACTION:** Copy any `id` value from the response. You will need a `city_id` in Step 10.

> ⚠️ **NOTE:** If this returns `[]` (empty array), it means no cities have been seeded in the database yet. You can still test the trip endpoints below — just skip the `city_id` field when creating sections.

---

## ═══════════════════════════════════════════
## STEP 6: Search Cities
## ═══════════════════════════════════════════

**Endpoint:** `GET /cities`
**Auth Required:** 🔒 Yes

**Fill in the query parameters (NOT JSON body):**

| Parameter | Value |
|---|---|
| search | `paris` |
| filter | _(leave empty)_ |
| sort_by | `popularity` |

**Expected Response (200):** Same format as Step 5, filtered to matching cities.

---

## ═══════════════════════════════════════════
## STEP 7: Get City Suggestions (Activities)
## ═══════════════════════════════════════════

**Endpoint:** `GET /cities/{id}/suggestions`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| id | _(paste a city_id from Step 5)_ |

**Expected Response (200):**
```json
[
  {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "city_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "name": "Eiffel Tower Visit",
    "category": "sightseeing",
    "cost": 25.00,
    "duration_mins": 120,
    "description": "Visit the iconic Eiffel Tower",
    "image_url": "https://example.com/eiffel.jpg",
    "popularity_score": 98
  }
]
```

> ✅ **ACTION:** Copy an `id` from this response. You will need an `activity_id` in Step 12.

---

## ═══════════════════════════════════════════
## STEP 8: Get All Activities
## ═══════════════════════════════════════════

**Endpoint:** `GET /activities`
**Auth Required:** 🔒 Yes

**Fill in the query parameters (all optional):**

| Parameter | Value |
|---|---|
| search | _(leave empty)_ |
| category | `sightseeing` |
| sort_by | `popularity` |

**Expected Response (200):** Same format as Step 7 but across all cities.

---

## ═══════════════════════════════════════════
## STEP 9: Create a Trip
## ═══════════════════════════════════════════

**Endpoint:** `POST /trips`
**Auth Required:** 🔒 Yes

**Paste this JSON body:**
```json
{
  "name": "European Adventure 2025",
  "start_date": "2025-03-01",
  "end_date": "2025-03-15",
  "description": "Exploring Paris, Rome, and Barcelona over spring break"
}
```

**Expected Response (201):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "name": "European Adventure 2025",
  "start_date": "2025-03-01",
  "end_date": "2025-03-15",
  "description": "Exploring Paris, Rome, and Barcelona over spring break",
  "cover_photo_url": null,
  "status": "upcoming",
  "created_at": "2026-08-22T06:00:00.000000Z"
}
```

> ✅ **ACTION:** Copy the `id` value. This is your `trip_id` — you need it for Steps 10-14.

---

## ═══════════════════════════════════════════
## STEP 9b: Create Trip — INVALID DATES (Error Test)
## ═══════════════════════════════════════════

**Endpoint:** `POST /trips`
**Auth Required:** 🔒 Yes

**Paste this JSON body:**
```json
{
  "name": "Bad Trip",
  "start_date": "2025-03-15",
  "end_date": "2025-03-01"
}
```

**Expected Response (400):**
```json
{
  "detail": "Trip end date cannot be before start date"
}
```

---

## ═══════════════════════════════════════════
## STEP 10: Create a Section (Add a City Leg)
## ═══════════════════════════════════════════

**Endpoint:** `POST /trips/{trip_id}/sections`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| trip_id | _(paste your trip_id from Step 9)_ |

**Paste this JSON body:**
```json
{
  "title": "Paris Days",
  "description": "Exploring the City of Light",
  "start_date": "2025-03-01",
  "end_date": "2025-03-05",
  "budget": 800.00
}
```

> **TIP:** If you got a `city_id` from Step 5, you can add it:
> ```json
> {
>   "city_id": "paste-city-id-here",
>   "title": "Paris Days",
>   "description": "Exploring the City of Light",
>   "start_date": "2025-03-01",
>   "end_date": "2025-03-05",
>   "budget": 800.00
> }
> ```

**Expected Response (201):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "trip_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "city_id": null,
  "title": "Paris Days",
  "description": "Exploring the City of Light",
  "start_date": "2025-03-01",
  "end_date": "2025-03-05",
  "budget": 800.00,
  "order_index": 0,
  "created_at": "2026-08-22T06:00:00.000000Z"
}
```

> ✅ **ACTION:** Copy the `id` value. This is your `section_id` — you need it for Steps 12-13.

---

## ═══════════════════════════════════════════
## STEP 10b: Create a Second Section
## ═══════════════════════════════════════════

**Endpoint:** `POST /trips/{trip_id}/sections`
**Auth Required:** 🔒 Yes

**Same trip_id as above. Paste this JSON body:**
```json
{
  "title": "Rome Weekend",
  "description": "Ancient history and amazing food",
  "start_date": "2025-03-06",
  "end_date": "2025-03-10",
  "budget": 600.00
}
```

**Expected Response (201):** Same format, but `order_index` will be `1`.

> ✅ **ACTION:** Save this second `section_id` for the reorder test in Step 14.

---

## ═══════════════════════════════════════════
## STEP 10c: Create Section — BAD DATES (Error Test)
## ═══════════════════════════════════════════

**Endpoint:** `POST /trips/{trip_id}/sections`
**Auth Required:** 🔒 Yes

**Same trip_id. Paste this JSON body:**
```json
{
  "title": "Invalid Section",
  "start_date": "2025-02-01",
  "end_date": "2025-02-05"
}
```

**Expected Response (400):**
```json
{
  "detail": "Section start date cannot be before trip start date"
}
```

---

## ═══════════════════════════════════════════
## STEP 11: List All Sections of a Trip
## ═══════════════════════════════════════════

**Endpoint:** `GET /trips/{trip_id}/sections`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| trip_id | _(paste your trip_id from Step 9)_ |

**No body needed.** Just click Execute.

**Expected Response (200):**
```json
[
  {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "trip_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "city_id": null,
    "title": "Paris Days",
    "description": "Exploring the City of Light",
    "start_date": "2025-03-01",
    "end_date": "2025-03-05",
    "budget": 800.00,
    "order_index": 0,
    "created_at": "2026-08-22T06:00:00.000000Z"
  },
  {
    "id": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
    "trip_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "city_id": null,
    "title": "Rome Weekend",
    "description": "Ancient history and amazing food",
    "start_date": "2025-03-06",
    "end_date": "2025-03-10",
    "budget": 600.00,
    "order_index": 1,
    "created_at": "2026-08-22T06:00:00.000000Z"
  }
]
```

---

## ═══════════════════════════════════════════
## STEP 12: Add Activity to a Section
## ═══════════════════════════════════════════

**Endpoint:** `POST /sections/{section_id}/activities`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| section_id | _(paste your section_id from Step 10)_ |

**Paste this JSON body:**
```json
{
  "activity_id": "paste-an-activity-id-from-step-7-here",
  "scheduled_date": "2025-03-02",
  "scheduled_time": "10:00:00",
  "notes": "Book tickets online in advance"
}
```

> ⚠️ **IMPORTANT:** You MUST replace `"paste-an-activity-id-from-step-7-here"` with a real activity UUID from Step 7. If you have no activities in the database, you cannot test this endpoint yet.

**Expected Response (201):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "section_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "activity_id": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
  "scheduled_date": "2025-03-02",
  "scheduled_time": "10:00:00",
  "cost_override": null,
  "notes": "Book tickets online in advance"
}
```

> ✅ **ACTION:** Copy the `id` value. This is your `trip_activity_id` for Steps 12b-12c.

---

## ═══════════════════════════════════════════
## STEP 12b: Add Activity — BAD DATE (Error Test)
## ═══════════════════════════════════════════

**Endpoint:** `POST /sections/{section_id}/activities`
**Auth Required:** 🔒 Yes

**Same section_id. Paste this JSON body:**
```json
{
  "activity_id": "paste-an-activity-id-from-step-7-here",
  "scheduled_date": "2025-12-25",
  "notes": "This date is way outside the section"
}
```

**Expected Response (400):**
```json
{
  "detail": "Activity date cannot be after section end date"
}
```

---

## ═══════════════════════════════════════════
## STEP 12c: Update an Activity
## ═══════════════════════════════════════════

**Endpoint:** `PATCH /trip-activities/{id}`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| id | _(paste your trip_activity_id from Step 12)_ |

**Paste this JSON body:**
```json
{
  "scheduled_time": "14:30:00",
  "cost_override": 35.00,
  "notes": "Changed to afternoon slot, premium ticket"
}
```

**Expected Response (200):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "section_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "activity_id": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
  "scheduled_date": "2025-03-02",
  "scheduled_time": "14:30:00",
  "cost_override": 35.00,
  "notes": "Changed to afternoon slot, premium ticket"
}
```

---

## ═══════════════════════════════════════════
## STEP 13: Update a Section
## ═══════════════════════════════════════════

**Endpoint:** `PATCH /sections/{section_id}`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| section_id | _(paste your section_id from Step 10)_ |

**Paste this JSON body:**
```json
{
  "title": "Paris Extended",
  "budget": 1200.00
}
```

**Expected Response (200):**
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "trip_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "city_id": null,
  "title": "Paris Extended",
  "description": "Exploring the City of Light",
  "start_date": "2025-03-01",
  "end_date": "2025-03-05",
  "budget": 1200.00,
  "order_index": 0,
  "created_at": "2026-08-22T06:00:00.000000Z"
}
```

---

## ═══════════════════════════════════════════
## STEP 14: Reorder Sections
## ═══════════════════════════════════════════

**Endpoint:** `PATCH /trips/{trip_id}/sections/reorder`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| trip_id | _(paste your trip_id from Step 9)_ |

**Paste this JSON body (swap the order — put Rome first, Paris second):**
```json
{
  "ordered_ids": [
    "paste-rome-section-id-from-step-10b",
    "paste-paris-section-id-from-step-10"
  ]
}
```

> ⚠️ **IMPORTANT:** Replace both IDs with the actual section UUIDs you received.

**Expected Response (200):** Array of sections with updated `order_index` values (Rome = 0, Paris = 1).

---

## ═══════════════════════════════════════════
## STEP 15: View Full Itinerary
## ═══════════════════════════════════════════

**Endpoint:** `GET /trips/{trip_id}/itinerary`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| trip_id | _(paste your trip_id from Step 9)_ |

**No body needed.** Just click Execute.

**Expected Response (200):**
```json
{
  "id": "trip-uuid",
  "name": "European Adventure 2025",
  "start_date": "2025-03-01",
  "end_date": "2025-03-15",
  "description": "Exploring Paris, Rome, and Barcelona over spring break",
  "status": "upcoming",
  "sections": [
    {
      "id": "section-uuid",
      "city_id": null,
      "city_name": null,
      "title": "Rome Weekend",
      "description": "Ancient history and amazing food",
      "start_date": "2025-03-06",
      "end_date": "2025-03-10",
      "budget": 600.00,
      "order_index": 0,
      "activities": []
    },
    {
      "id": "section-uuid",
      "city_id": null,
      "city_name": null,
      "title": "Paris Extended",
      "description": "Exploring the City of Light",
      "start_date": "2025-03-01",
      "end_date": "2025-03-05",
      "budget": 1200.00,
      "order_index": 1,
      "activities": [
        {
          "id": "activity-uuid",
          "activity_id": "activity-catalog-uuid",
          "activity_name": "Eiffel Tower Visit",
          "activity_category": "sightseeing",
          "scheduled_date": "2025-03-02",
          "scheduled_time": "14:30",
          "cost": 35.00,
          "notes": "Changed to afternoon slot, premium ticket"
        }
      ]
    }
  ]
}
```

---

## ═══════════════════════════════════════════
## STEP 16: View Trip Budget
## ═══════════════════════════════════════════

**Endpoint:** `GET /trips/{trip_id}/budget`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| trip_id | _(paste your trip_id from Step 9)_ |

**No body needed.** Just click Execute.

**Expected Response (200):**
```json
{
  "trip_id": "trip-uuid",
  "total": 35.00,
  "by_category": [
    {
      "category": "sightseeing",
      "total": 35.00
    }
  ],
  "by_day": [
    {
      "date": "2025-03-02",
      "total": 35.00
    }
  ],
  "average_daily": 2.33
}
```

---

## ═══════════════════════════════════════════
## STEP 17: List All My Trips
## ═══════════════════════════════════════════

**Endpoint:** `GET /trips`
**Auth Required:** 🔒 Yes

**Fill in query parameters (all optional):**

| Parameter | Value |
|---|---|
| status | _(leave empty for all, or type `upcoming`)_ |
| sort_by | `recent` |
| search | _(leave empty)_ |
| limit | `100` |

**No body needed.** Just click Execute.

**Expected Response (200):**
```json
[
  {
    "id": "trip-uuid",
    "user_id": "user-uuid",
    "name": "European Adventure 2025",
    "start_date": "2025-03-01",
    "end_date": "2025-03-15",
    "description": "Exploring Paris, Rome, and Barcelona over spring break",
    "cover_photo_url": null,
    "status": "upcoming",
    "created_at": "2026-08-22T06:00:00.000000Z"
  }
]
```

---

## ═══════════════════════════════════════════
## STEP 18: Get My Trips (Filtered)
## ═══════════════════════════════════════════

**Endpoint:** `GET /users/me/trips`
**Auth Required:** 🔒 Yes

**Fill in query parameter:**

| Parameter | Value |
|---|---|
| type | `preplanned` |

**No body needed.** Just click Execute.

**Expected Response (200):** Same array format as Step 17, filtered to `status = "upcoming"`.

---

## ═══════════════════════════════════════════
## STEP 19: Global Search
## ═══════════════════════════════════════════

**Endpoint:** `GET /search`
**Auth Required:** ❌ No

**Fill in query parameter:**

| Parameter | Value |
|---|---|
| q | `europe` |

**No body needed.** Just click Execute.

**Expected Response (200):**
```json
{
  "cities": [],
  "trips": [
    {
      "id": "trip-uuid",
      "name": "European Adventure 2025",
      "description": "Exploring Paris, Rome, and Barcelona over spring break",
      "status": "upcoming"
    }
  ]
}
```

---

## ═══════════════════════════════════════════
## STEP 20: Delete an Activity
## ═══════════════════════════════════════════

**Endpoint:** `DELETE /trip-activities/{id}`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| id | _(paste your trip_activity_id from Step 12)_ |

**No body needed.** Just click Execute.

**Expected Response (204):** Empty response body — success.

---

## ═══════════════════════════════════════════
## STEP 21: Delete a Section
## ═══════════════════════════════════════════

**Endpoint:** `DELETE /sections/{section_id}`
**Auth Required:** 🔒 Yes

**Fill in the path parameter:**

| Parameter | Value |
|---|---|
| section_id | _(paste any section_id)_ |

**No body needed.** Just click Execute.

**Expected Response (204):** Empty response body — success.

---

## Quick Reference — All Endpoints

| # | Method | Path | Auth | Body? |
|---|---|---|---|---|
| 1 | POST | `/auth/register` | ❌ | ✅ JSON |
| 2 | POST | `/auth/login` | ❌ | ✅ Form |
| 3 | GET | `/users/me` | 🔒 | ❌ |
| 4 | PATCH | `/users/me` | 🔒 | ✅ JSON |
| 5 | GET | `/cities/popular` | 🔒 | ❌ |
| 6 | GET | `/cities?search=` | 🔒 | ❌ |
| 7 | GET | `/cities/{id}/suggestions` | 🔒 | ❌ |
| 8 | GET | `/activities` | 🔒 | ❌ |
| 9 | POST | `/trips` | 🔒 | ✅ JSON |
| 10 | POST | `/trips/{id}/sections` | 🔒 | ✅ JSON |
| 11 | GET | `/trips/{id}/sections` | 🔒 | ❌ |
| 12 | POST | `/sections/{id}/activities` | 🔒 | ✅ JSON |
| 12c | PATCH | `/trip-activities/{id}` | 🔒 | ✅ JSON |
| 13 | PATCH | `/sections/{id}` | 🔒 | ✅ JSON |
| 14 | PATCH | `/trips/{id}/sections/reorder` | 🔒 | ✅ JSON |
| 15 | GET | `/trips/{id}/itinerary` | 🔒 | ❌ |
| 16 | GET | `/trips/{id}/budget` | 🔒 | ❌ |
| 17 | GET | `/trips` | 🔒 | ❌ |
| 18 | GET | `/users/me/trips` | 🔒 | ❌ |
| 19 | GET | `/search?q=` | ❌ | ❌ |
| 20 | DELETE | `/trip-activities/{id}` | 🔒 | ❌ |
| 21 | DELETE | `/sections/{id}` | 🔒 | ❌ |
