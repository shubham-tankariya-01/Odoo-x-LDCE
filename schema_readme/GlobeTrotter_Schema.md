# GlobeTrotter — Database Schema (PostgreSQL)

Matches the screens/endpoints already defined. Terminology uses **Section** (not "Stop") to match the wireframe's Build Itinerary Screen language.

---

## Entity Overview

```
User
 └─< Trip
       └─< Section (a leg/stop of the trip: place + date range + budget)
             └─< SectionActivity (an Activity scheduled into a Section, with day/time/cost)
       └─< Expense (rollup-level costs not tied to one activity, e.g. flights/stay)

City
 └─< Activity (activities available in that city)

CommunityPost (User shares about a Trip/Activity)
 └─< PostComment
 └─< PostLike
```

---

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | |
| phone_number | VARCHAR(20) | |
| city | VARCHAR(100) | user's home city |
| country | VARCHAR(100) | |
| photo_url | TEXT | |
| additional_info | TEXT | freeform, per Registration screen |
| is_admin | BOOLEAN DEFAULT FALSE | gates Admin Panel screen |
| created_at | TIMESTAMPTZ DEFAULT now() | |

### `trips`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| user_id | FK → users.id | owner |
| name | VARCHAR(200) NOT NULL | |
| start_date | DATE | |
| end_date | DATE | |
| description | TEXT | |
| cover_photo_url | TEXT | |
| status | VARCHAR(20) | `upcoming` / `ongoing` / `completed` — derive from dates, or store + recompute on read |
| created_at | TIMESTAMPTZ DEFAULT now() | |

### `sections`
One row per "Section" in the Build Itinerary screen (a place/leg within the trip).
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| trip_id | FK → trips.id | |
| city_id | FK → cities.id | which place this section covers |
| title | VARCHAR(200) | e.g. "Travel", "Hotel stay", "Activity block" — per wireframe's "can be travel, hotel, or any other activity" |
| description | TEXT | "all the necessary information about this section" |
| start_date | DATE | |
| end_date | DATE | |
| budget | NUMERIC(10,2) | "Budget of this section" |
| order_index | INTEGER | drag-reorder support |
| created_at | TIMESTAMPTZ DEFAULT now() | |

### `cities`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| name | VARCHAR(150) NOT NULL | |
| country | VARCHAR(100) | |
| cost_index | NUMERIC(5,2) | relative cost rating |
| popularity_score | INTEGER DEFAULT 0 | powers "Top Regional Selections" + Admin "Popular Cities" |
| image_url | TEXT | |

### `activities`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| city_id | FK → cities.id | |
| name | VARCHAR(200) NOT NULL | e.g. "Paragliding" |
| category | VARCHAR(50) | for filter/group-by on Activity Search screen |
| cost | NUMERIC(10,2) | |
| duration_mins | INTEGER | |
| description | TEXT | |
| image_url | TEXT | |
| popularity_score | INTEGER DEFAULT 0 | powers Admin "Popular Activities" |

### `section_activities`
An Activity scheduled into a specific Section, on a specific day — this is the row that powers both the Itinerary View (Day 1/Day 2 blocks) and the Calendar View (same data, different render).
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| section_id | FK → sections.id | |
| activity_id | FK → activities.id | |
| scheduled_date | DATE | which day this falls on |
| scheduled_time | TIME | |
| cost_override | NUMERIC(10,2) | if user edits the default activity cost |
| notes | TEXT | |

### `expenses`
Trip- or section-level costs not tied to a specific activity (flights, accommodation, general spend) — feeds the budget breakdown on the Itinerary View screen.
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| trip_id | FK → trips.id | |
| section_id | FK → sections.id NULLABLE | null = trip-level expense |
| category | VARCHAR(30) | `transport` / `stay` / `activity` / `meal` / `other` |
| amount | NUMERIC(10,2) NOT NULL | |
| note | VARCHAR(255) | |

### `community_posts`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| user_id | FK → users.id | author |
| trip_id | FK → trips.id NULLABLE | optional link to the trip being shared |
| activity_id | FK → activities.id NULLABLE | optional link to a specific activity |
| content | TEXT NOT NULL | |
| image_url | TEXT | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

### `post_comments`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| post_id | FK → community_posts.id | |
| user_id | FK → users.id | |
| content | TEXT NOT NULL | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

### `post_likes`
| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL PK | |
| post_id | FK → community_posts.id | |
| user_id | FK → users.id | |
| UNIQUE(post_id, user_id) | prevents duplicate likes | |

---

## SQL DDL (copy-paste ready, Postgres syntax)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(100),
    photo_url TEXT,
    additional_info TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    country VARCHAR(100),
    cost_index NUMERIC(5,2),
    popularity_score INTEGER DEFAULT 0,
    image_url TEXT
);

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    cost NUMERIC(10,2),
    duration_mins INTEGER,
    description TEXT,
    image_url TEXT,
    popularity_score INTEGER DEFAULT 0
);

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    cover_photo_url TEXT,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    city_id UUID REFERENCES cities(id),
    title VARCHAR(200),
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget NUMERIC(10,2),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE section_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id),
    scheduled_date DATE,
    scheduled_time TIME,
    cost_override NUMERIC(10,2),
    notes TEXT
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    category VARCHAR(30),
    amount NUMERIC(10,2) NOT NULL,
    note VARCHAR(255)
);

CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (post_id, user_id)
);

-- Helpful indexes
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_sections_trip_id ON sections(trip_id);
CREATE INDEX idx_section_activities_section_id ON section_activities(section_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_activities_city_id ON activities(city_id);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
```

---

## Notes on design decisions

- **No separate "budget" table** — a trip's total budget is `SUM(sections.budget)` or `SUM(expenses.amount)`, computed at read time via the `/trips/{id}/budget` endpoint. Don't cache a running total unless performance forces it.
- **`section_activities` is the single source of truth for both Screen 9 (Itinerary View) and Screen 11 (Calendar View)** — group by `scheduled_date` for the day-blocks view, or plot by date for the calendar grid. One table, two renderers.
- **`status` on `trips`** is stored rather than always computed from dates, so the User Trip Listing screen (Ongoing/Upcoming/Completed grouping) is a simple `WHERE` filter — but you can also just compute it on the fly from `start_date`/`end_date` if you'd rather not worry about keeping it in sync.
- **UUID vs SERIAL**: UUIDs used above so IDs aren't guessable if you expose any public/shareable trip URLs later — swap to `SERIAL`/`BIGSERIAL` if you'd rather have simpler auto-increment IDs for the 8-hour build; either works fine at this scale.
- **`is_admin` flag on `users`**, not a separate roles table — enough to gate the Admin Panel screen without building a full RBAC system under time pressure.
