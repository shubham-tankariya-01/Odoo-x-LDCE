# GlobeTrotter — Entity Relationship (ER) Diagram

This document illustrates the complete database architecture, entity schemas, data types, primary keys (PK), foreign keys (FK), and relationship cardinalities for the **GlobeTrotter** travel planning platform.

---

## 1. Visual Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ TRIPS : "owns"
    USERS ||--o{ COMMUNITY_POSTS : "authors"
    USERS ||--o{ POST_COMMENTS : "writes"
    USERS ||--o{ POST_LIKES : "likes"

    TRIPS ||--o{ SECTIONS : "contains"
    TRIPS ||--o{ EXPENSES : "tracks"
    TRIPS ||--o{ COMMUNITY_POSTS : "referenced in"

    CITIES ||--o{ ACTIVITIES : "hosts"
    CITIES ||--o{ SECTIONS : "destination for"

    SECTIONS ||--o{ SECTION_ACTIVITIES : "schedules"
    SECTIONS ||--o{ EXPENSES : "allocates"

    ACTIVITIES ||--o{ SECTION_ACTIVITIES : "scheduled as"
    ACTIVITIES ||--o{ COMMUNITY_POSTS : "tagged in"

    COMMUNITY_POSTS ||--o{ POST_COMMENTS : "receives"
    COMMUNITY_POSTS ||--o{ POST_LIKES : "liked by"

    USERS {
        UUID id PK "gen_random_uuid()"
        VARCHAR first_name "max 100"
        VARCHAR last_name "max 100"
        VARCHAR email "unique, not null"
        VARCHAR password_hash "not null"
        VARCHAR phone_number "max 20"
        VARCHAR city "max 100"
        VARCHAR country "max 100"
        VARCHAR photo_url
        VARCHAR additional_info
        BOOLEAN is_admin "default false"
        TIMESTAMPTZ created_at "default now()"
    }

    TRIPS {
        UUID id PK "gen_random_uuid()"
        UUID user_id FK "references users(id) ON DELETE CASCADE"
        VARCHAR name "not null"
        DATE start_date
        DATE end_date
        TEXT description
        TEXT cover_photo_url
        VARCHAR status "default 'upcoming'"
        TIMESTAMPTZ created_at "default now()"
    }

    CITIES {
        UUID id PK "gen_random_uuid()"
        VARCHAR name "not null"
        VARCHAR country
        NUMERIC cost_index "5,2"
        INTEGER popularity_score "default 0"
        VARCHAR image_url
    }

    ACTIVITIES {
        UUID id PK "gen_random_uuid()"
        UUID city_id FK "references cities(id) ON DELETE CASCADE"
        VARCHAR name "not null"
        VARCHAR category "max 50"
        NUMERIC cost "10,2"
        INTEGER duration_mins
        VARCHAR description
        VARCHAR image_url
        INTEGER popularity_score "default 0"
    }

    SECTIONS {
        UUID id PK "gen_random_uuid()"
        UUID trip_id FK "references trips(id) ON DELETE CASCADE"
        UUID city_id FK "references cities(id) ON DELETE SET NULL"
        VARCHAR title "max 200"
        TEXT description
        DATE start_date
        DATE end_date
        NUMERIC budget "10,2"
        INTEGER order_index "default 0"
        TIMESTAMPTZ created_at "default now()"
    }

    SECTION_ACTIVITIES {
        UUID id PK "gen_random_uuid()"
        UUID section_id FK "references sections(id) ON DELETE CASCADE"
        UUID activity_id FK "references activities(id)"
        DATE scheduled_date
        TIME scheduled_time
        NUMERIC cost_override "10,2"
        TEXT notes
    }

    EXPENSES {
        UUID id PK "gen_random_uuid()"
        UUID trip_id FK "references trips(id) ON DELETE CASCADE"
        UUID section_id FK "references sections(id) ON DELETE SET NULL"
        VARCHAR category "transport | stay | activity | meal | other"
        NUMERIC amount "10,2, not null"
        VARCHAR note "max 255"
    }

    COMMUNITY_POSTS {
        UUID id PK "gen_random_uuid()"
        UUID user_id FK "references users(id) ON DELETE CASCADE"
        UUID trip_id FK "references trips(id) ON DELETE SET NULL"
        UUID activity_id FK "references activities(id) ON DELETE SET NULL"
        VARCHAR content "not null"
        VARCHAR image_url
        TIMESTAMPTZ created_at "default now()"
    }

    POST_COMMENTS {
        UUID id PK "gen_random_uuid()"
        UUID post_id FK "references community_posts(id) ON DELETE CASCADE"
        UUID user_id FK "references users(id) ON DELETE CASCADE"
        VARCHAR content "not null"
        TIMESTAMPTZ created_at "default now()"
    }

    POST_LIKES {
        UUID id PK "gen_random_uuid()"
        UUID post_id FK "references community_posts(id) ON DELETE CASCADE"
        UUID user_id FK "references users(id) ON DELETE CASCADE"
    }
```

---

## 2. Table Specifications & Relationships

### Core Domain: Identity & Trip Planning

| Entity | Description | Foreign Keys | Key Relationships |
| :--- | :--- | :--- | :--- |
| **`users`** | Registered user profiles & credentials | None | 1-to-N with `trips`, `community_posts`, `post_comments`, `post_likes` |
| **`trips`** | High-level trip containers (dates, cover photo, status) | `user_id` → `users.id` | 1-to-N with `sections`, `expenses`, `community_posts` |
| **`sections`** | Itinerary legs / stages (ordered by `order_index`, assigned to a city) | `trip_id` → `trips.id`<br>`city_id` → `cities.id` | 1-to-N with `section_activities`, `expenses` |
| **`section_activities`** | Bridge table linking scheduled activities into specific sections with date, time, and cost overrides | `section_id` → `sections.id`<br>`activity_id` → `activities.id` | N-to-1 with `sections`, N-to-1 with `activities` |
| **`expenses`** | Standalone & section-specific trip expense logs | `trip_id` → `trips.id`<br>`section_id` → `sections.id` | N-to-1 with `trips`, N-to-1 with `sections` |

---

### Catalog Domain: Destinations & Activities

| Entity | Description | Foreign Keys | Key Relationships |
| :--- | :--- | :--- | :--- |
| **`cities`** | Global destination catalog with cost index & popularity | None | 1-to-N with `activities`, 1-to-N with `sections` |
| **`activities`** | Standard catalog of activities (cost, duration, category) | `city_id` → `cities.id` | 1-to-N with `section_activities`, 1-to-N with `community_posts` |

---

### Social & Community Domain

| Entity | Description | Foreign Keys | Key Relationships |
| :--- | :--- | :--- | :--- |
| **`community_posts`** | Traveler stories, reviews, tips & photo shares | `user_id` → `users.id`<br>`trip_id` → `trips.id`<br>`activity_id` → `activities.id` | 1-to-N with `post_comments`, `post_likes` |
| **`post_comments`** | Threaded comments on community posts | `post_id` → `community_posts.id`<br>`user_id` → `users.id` | N-to-1 with `community_posts`, N-to-1 with `users` |
| **`post_likes`** | Unique likes per post and user (`uq_post_like_user`) | `post_id` → `community_posts.id`<br>`user_id` → `users.id` | N-to-1 with `community_posts`, N-to-1 with `users` |

---

## 3. Cardinality Summary

1. **User to Trips**: `1 : N` (One user can own many trips; deleting a user cascades and deletes their trips).
2. **Trip to Sections**: `1 : N` (One trip has multiple sequential itinerary legs/sections ordered by `order_index`).
3. **City to Activities**: `1 : N` (One city contains many predefined activities).
4. **Section to Section Activities**: `1 : N` (A leg/section schedules multiple activities with date, time, and custom cost overrides).
5. **Trip to Expenses**: `1 : N` (A trip logs expenses categorized into stay, transport, dining, and activities).
6. **Community Post to Comments & Likes**: `1 : N` (A post receives many comments and unique user likes).
