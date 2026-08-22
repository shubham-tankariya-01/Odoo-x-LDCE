# GlobeTrotter API Documentation (`ENDPOINTS.md`)
> **Complete REST API Specification for Hackathon Evaluators**  
> Base URL: `http://localhost:8000` | Swagger UI: `http://localhost:8000/docs`

All protected endpoints require the HTTP Header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

---

## 📑 Endpoints Index

- [1. Authentication (`/auth`)](#1-authentication-auth)
- [2. User Management (`/users`)](#2-user-management-users)
- [3. Trip Management (`/trips`)](#3-trip-management-trips)
- [4. Itinerary Sections & Legs (`/trips/{id}/sections`, `/sections`)](#4-itinerary-sections--legs)
- [5. Activity Scheduling (`/sections/{id}/activities`, `/section-activities`)](#5-activity-scheduling)
- [6. Destination & Activity Catalog (`/cities`, `/countries`, `/activities`)](#6-destination--activity-catalog)
- [7. Search (`/search`)](#7-search-search)
- [8. Community & Social Feed (`/community`)](#8-community--social-feed-community)
- [9. Admin Console (`/admin`)](#9-admin-console-admin)

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
* **Description**: Register a new user account and immediately returns a JWT access token.
* **Auth Required**: No
* **Request Body**:
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@example.com",
  "password": "securepassword123",
  "phone_number": "+1234567890",
  "city": "San Francisco",
  "country": "United States",
  "additional_info": "Avid backpacker and landscape photographer."
}
```
* **Response `(201 Created)`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": "7b0a8e12-421b-4f90-8d59-3a1bcf6a1234",
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "phone_number": "+1234567890",
    "city": "San Francisco",
    "country": "United States",
    "is_admin": false,
    "created_at": "2026-08-22T10:00:00Z"
  }
}
```

---

### `POST /auth/login`
* **Description**: Authenticate with email and password via OAuth2 Form Data.
* **Auth Required**: No
* **Content-Type**: `application/x-www-form-urlencoded`
* **Form Fields**: `username` (email), `password`
* **Response `(200 OK)`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": { ... }
}
```

---

## 2. User Management (`/users`)

### `GET /users/me`
* **Description**: Get profile details for the authenticated user.
* **Auth Required**: Yes (`Bearer <token>`)
* **Response `(200 OK)`**: Returns `UserRead` model.

### `PUT /users/me`
* **Description**: Update profile information (name, phone, bio, city, country).
* **Auth Required**: Yes
* **Request Body**: `UserUpdate`

### `POST /users/me/photo`
* **Description**: Upload and update profile photo.
* **Auth Required**: Yes
* **Content-Type**: `multipart/form-data`

---

## 3. Trip Management (`/trips`)

### `POST /trips`
* **Description**: Create a new trip container.
* **Auth Required**: Yes
* **Request Body**:
```json
{
  "name": "Japan Autumn Discovery",
  "start_date": "2026-10-01",
  "end_date": "2026-10-14",
  "description": "2-week journey across Tokyo, Kyoto, and Osaka.",
  "cover_photo_url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26",
  "status": "upcoming"
}
```
* **Response `(201 Created)`**: Returns `TripRead`.

---

### `GET /trips`
* **Description**: List trips owned by current user or filter by ownership/status.
* **Query Parameters**:
  * `owner` (`me` or `all`)
  * `status` (`upcoming`, `ongoing`, `completed`, `all`)
  * `sort_by` (`recent`, `name`)
  * `limit` (default `20`)
* **Auth Required**: Yes

---

### `GET /trips/{trip_id}`
* **Description**: Get single trip metadata.
* **Auth Required**: Yes

---

### `GET /trips/{trip_id}/itinerary`
* **Description**: Retrieve the complete structured itinerary including all sequential sections and nested scheduled activities.
* **Auth Required**: Yes
* **Response `(200 OK)`**:
```json
{
  "id": "73876b0f-8530-42f0-a3e6-b7ef8304fb10",
  "name": "Japan Autumn Discovery",
  "start_date": "2026-10-01",
  "end_date": "2026-10-14",
  "status": "upcoming",
  "sections": [
    {
      "id": "90e21b71-124b-4b2a-86c5-1bc7d290fae1",
      "city_id": "c1a01-...",
      "city_name": "Tokyo",
      "title": "Tokyo Modern & Neon",
      "start_date": "2026-10-01",
      "end_date": "2026-10-06",
      "budget": 1200.00,
      "order_index": 0,
      "activities": [
        {
          "id": "act-101-...",
          "activity_id": "a2b-...",
          "activity_name": "Shibuya Sky Observation Deck",
          "activity_category": "sightseeing",
          "scheduled_date": "2026-10-02",
          "scheduled_time": "17:30:00",
          "cost": 22.00,
          "notes": "Sunset slot booked."
        }
      ]
    }
  ]
}
```

---

### `GET /trips/{trip_id}/budget`
* **Description**: Get live computed financial breakdown, allocated leg budgets, category distribution, and timeline.
* **Auth Required**: Yes
* **Response `(200 OK)`**:
```json
{
  "trip_id": "73876b0f-8530-42f0-a3e6-b7ef8304fb10",
  "total": 845.50,
  "allocated_budget": 2000.00,
  "average_daily": 60.39,
  "by_category": [
    { "category": "sightseeing", "total": 310.00 },
    { "category": "dining", "total": 280.50 },
    { "category": "transport", "total": 155.00 },
    { "category": "stay", "total": 100.00 }
  ],
  "by_section": [
    {
      "section_id": "90e21b71-...",
      "title": "Tokyo Modern & Neon",
      "city_name": "Tokyo",
      "budget": 1200.00,
      "total_spent": 520.00,
      "activities_count": 6
    }
  ],
  "by_day": [
    { "date": "2026-10-01", "total": 140.00 },
    { "date": "2026-10-02", "total": 210.50 }
  ]
}
```

---

## 4. Itinerary Sections & Legs

### `POST /trips/{trip_id}/sections`
* **Description**: Append a new itinerary leg/section to a trip.
* **Auth Required**: Yes
* **Request Body**:
```json
{
  "city_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Kyoto Temples & Tradition",
  "description": "Exploring historic shrines and tea houses",
  "start_date": "2026-10-07",
  "end_date": "2026-10-11",
  "budget": 800.00
}
```

### `PUT /sections/{section_id}`
* **Description**: Update section dates, title, or target budget.
* **Auth Required**: Yes

### `DELETE /sections/{section_id}`
* **Description**: Remove an itinerary section and cascade delete its scheduled activities.
* **Auth Required**: Yes

### `POST /trips/{trip_id}/sections/reorder`
* **Description**: Reorder sections sequentially.
* **Auth Required**: Yes
* **Request Body**: `{"section_ids": ["id-sec-2", "id-sec-1", "id-sec-3"]}`

---

## 5. Activity Scheduling

### `POST /sections/{section_id}/activities`
* **Description**: Schedule an activity from catalog into an itinerary section.
* **Auth Required**: Yes
* **Request Body**:
```json
{
  "activity_id": "a9012-...",
  "scheduled_date": "2026-10-08",
  "scheduled_time": "09:00:00",
  "cost_override": 15.00,
  "notes": "Early morning visit to avoid crowds."
}
```

### `PUT /section-activities/{section_activity_id}`
* **Description**: Update date, time, notes, or cost override of a scheduled activity.
* **Auth Required**: Yes

### `DELETE /section-activities/{section_activity_id}`
* **Description**: Remove scheduled activity from section.
* **Auth Required**: Yes

---

## 6. Destination & Activity Catalog

### `GET /cities`
* **Description**: Search & list destination cities.
* **Query Parameters**:
  * `query` (name search)
  * `country` (country filter)
  * `min_cost`, `max_cost` (cost index bounds)
  * `sort_by` (`popularity`, `cost_low`, `cost_high`, `name`)
  * `limit` (default `50`)
* **Auth Required**: No

### `GET /cities/popular`
* **Description**: Fetch top rated/popular destination cities for homepage highlights.
* **Auth Required**: No

### `GET /countries`
* **Description**: Returns list of all available countries in the database.
* **Auth Required**: No

### `GET /activities`
* **Description**: Fetch activities by city or search keyword.
* **Query Parameters**: `city_id`, `category`, `query`
* **Auth Required**: No

---

## 7. Search (`/search`)

### `GET /search`
* **Description**: Global unified search across destination cities, activities, and public community posts.
* **Query Parameters**: `q` (search term)
* **Auth Required**: No

---

## 8. Community & Social Feed (`/community`)

### `GET /community/posts`
* **Description**: Retrieve traveler posts feed with attached trip/activity tags, author metadata, like counts, and comments.
* **Query Parameters**: `search`, `sort_by` (`recent`, `popular`), `trip_id`
* **Auth Required**: No

### `POST /community/posts`
* **Description**: Create a public travel story post.
* **Auth Required**: Yes
* **Request Body**:
```json
{
  "content": "Just visited Fushimi Inari at 6 AM. The quiet atmosphere was breathtaking!",
  "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e",
  "trip_id": "73876b0f-...",
  "activity_id": "act-101-..."
}
```

### `POST /community/posts/{post_id}/like`
* **Description**: Toggle like/unlike on a post.
* **Auth Required**: Yes
* **Response**: `{"is_liked": true, "likes_count": 14}`

### `POST /community/posts/{post_id}/comments`
* **Description**: Add a comment to a post.
* **Auth Required**: Yes
* **Request Body**: `{"content": "Amazing shot! What camera did you use?"}`

### `DELETE /community/comments/{comment_id}`
* **Description**: Delete a comment authored by the user.
* **Auth Required**: Yes

---

## 9. Admin Console (`/admin`)

> **Note**: Requires an authenticated user with `is_admin == true`.

### `GET /admin/stats`
* **Description**: Returns platform aggregated statistics: total users, trips, sections, scheduled activities, posts, and comments.
* **Auth Required**: Yes (Admin)

### `POST /admin/cities`
* **Description**: Add a new destination city to catalog.
* **Auth Required**: Yes (Admin)

### `POST /admin/activities`
* **Description**: Add a new activity to catalog.
* **Auth Required**: Yes (Admin)

### `DELETE /admin/cities/{city_id}`
* **Description**: Delete a city and its associated activities.
* **Auth Required**: Yes (Admin)

### `DELETE /admin/activities/{activity_id}`
* **Description**: Delete an activity from catalog.
* **Auth Required**: Yes (Admin)
