# GlobeTrotter Frontend Pages Guide (`FRONTEND_PAGES.md`)
> **Complete UI/UX Breakdown & Screen Architecture for Hackathon Evaluators**

This guide provides a comprehensive overview of each page in GlobeTrotter, describing their primary purpose, route parameters, key features, dynamic components, and user interaction flows.

---

## 🗺️ Screen Navigation Sitemap

```
├── Public Screens
│   ├── /login                     ➔ Login Page
│   ├── /register                  ➔ Register Page
│   └── /search                    ➔ Explore Cities & Destination Finder
│
├── Authenticated User Screens
│   ├── /                          ➔ Landing / Home Dashboard
│   ├── /trips                     ➔ My Trips Explorer
│   ├── /trips/new                 ➔ 3-Phase Trip Creation Wizard
│   ├── /trips/:tripId/build       ➔ Interactive Multi-Leg Itinerary Builder
│   ├── /trips/:tripId             ➔ Full Itinerary View & Day Timeline
│   ├── /trips/:tripId/budget      ➔ Trip Budget & Cost Breakdown Screen
│   ├── /calendar                  ➔ Interactive Calendar View
│   ├── /community                 ➔ Travelers Community & Social Feed
│   └── /profile                   ➔ User Profile & Trip Statistics
│
└── Administrator Screens
    └── /admin                     ➔ Admin Platform Metrics & Catalog Curation
```

---

## 1. Landing / Home Dashboard (`/`)
* **Route**: `/`
* **Access**: Authenticated
* **Key Features**:
  * Personalized greeting header with traveler's name and quick action *"Plan New Trip"*.
  * **Quick Statistics**: Counts of ongoing, upcoming, and completed journeys.
  * **Active & Upcoming Trips Carousel**: Visual cards linking directly into itinerary view.
  * **Popular Destinations Showcase**: Curated top cities loaded dynamically from backend catalog with cost tags and popularity stars.
  * **Recent Community Highlights**: Latest traveler stories and travel tips snippet.

---

## 2. Explore Cities & Destination Finder (`/search`)
* **Route**: `/search`
* **Access**: Public & Authenticated
* **Key Features**:
  * **Live Search**: Instant keyword filtering across destinations and activities.
  * **Multi-Filter Toolbar**:
    * Filter by **Country** (dynamically loaded via `GET /countries`).
    * Filter by **Budget / Cost Index** (Budget Friendly $, Moderate $$, Luxury $$$).
    * Sort by **Popularity**, **Cost (Low to High)**, **Cost (High to Low)**, or **Alphabetical**.
  * **Interactive Destination Cards**: Image preview, country context, popularity rating, and cost index pill.
  * **"Add to Trip" Flow**: Opens a modal allowing users to instantly append the selected city as a new leg in any of their existing trips, or start a new trip centered around it.

---

## 3. My Trips Dashboard (`/trips`)
* **Route**: `/trips`
* **Access**: Authenticated
* **Key Features**:
  * Tabbed/Filtered views: **All Statuses**, **Ongoing**, **Upcoming**, and **Completed**.
  * Live title and destination search bar.
  * **Trip Action Cards**:
    * Cover photo, departure/return dates, duration badge, and status pill.
    * Direct buttons for **"💰 Budget"** (jumps directly to cost breakdown) and **"View Itinerary ➔"**.
  * Dynamic empty state with illustration when no trips match the filter.

---

## 4. 3-Phase Trip Creation Wizard (`/trips/new`)
* **Route**: `/trips/new`
* **Access**: Authenticated
* **User Flow**:
  * **Phase 1: Basic Information**: Trip name, departure/return date selection with date validation, and optional description.
  * **Phase 2: Destination & Initial Leg**: Search and pick the primary arrival city from the catalog, assign leg title, and set starting leg budget.
  * **Phase 3: Curated Activity Selection**: Multi-select activity checklist (Dining, Sightseeing, Transport, Lodging) with estimated costs.
  * Auto-creates trip and first section in backend, then smoothly redirects straight into the **Interactive Itinerary Builder**.

---

## 5. Interactive Itinerary Builder (`/trips/:tripId/build`)
* **Route**: `/trips/:tripId/build`
* **Access**: Authenticated
* **Key Features**:
  * **Top Progress Bar & Live Save Status**: Real-time visual confirmation of auto-saving.
  * **Section / Leg Selector**: Tabbed leg navigator with *"Add Leg / Section"* button opening a modal with automatic date boundary clamping.
  * **3-Step Tabbed Workflow per Leg**:
    1. **Edit Leg Details**: Adjust leg city, dates, and allocated budget.
    2. **Activity Picker & Scheduler**: Checkbox catalog with instant activity search, duration, and default price.
    3. **Scheduled Timeline Review**: Customize dates, times, user notes, and cost overrides for each scheduled item.
  * **Action Bar**: Direct navigation buttons to **"View Itinerary"** and **"View Budget Breakdown"**.

---

## 6. Full Itinerary View & Day Timeline (`/trips/:tripId`)
* **Route**: `/trips/:tripId`
* **Access**: Authenticated
* **Key Features**:
  * **Hero Header**: Scenic trip cover photo, dates, status, and navigation shortcuts.
  * **Day-by-Day Filter Bar**: Filter itinerary by specific calendar days (`Day 1`, `Day 2`, `All Days`).
  * **Chronological Activity Timeline**:
    * Activity cards displaying time pills, category badges, cost tags, and traveler notes.
  * **Budget Overview Sidebar**:
    * Live estimated total cost vs. allocated budget.
    * Dynamic budget health indicator with progress bar.
    * Category breakdown list (Dining, Sightseeing, Transport, Stay, Activities).
    * One-click button to **"Detailed Cost Breakdown"**.

---

## 7. Trip Budget & Cost Breakdown Screen (`/trips/:tripId/budget`)
* **Route**: `/trips/:tripId/budget`
* **Access**: Authenticated
* **Key Features**:
  * **4 Top Metric Cards**:
    * **Total Estimated Spent**: Aggregated live across all activities and expenses.
    * **Allocated Planned Budget**: Sum of all leg targets.
    * **Remaining Balance**: Positive (surplus) or Negative (deficit alert with alert icon).
    * **Average Daily Spend**: Computed across trip duration.
  * **Budget Health & Utilization Bar**: Adaptive visual gauge (green <80%, orange 80-100%, red >100% with warning alert).
  * **2-Column Analytical Layout**:
    * **Category Breakdown**: Category share percentages with visual bars.
    * **Leg-by-Leg Allocation**: Target vs. actual spend per trip leg with under/over budget status.
  * **Itemized Activity & Expense Ledger**:
    * Searchable, filterable table listing all scheduled expenses by date, leg, category, notes, and exact dollar cost.
  * **Print / Export Report**: Printable view formatted for PDF export and offline sharing.

---

## 8. Interactive Calendar View (`/calendar`)
* **Route**: `/calendar`
* **Access**: Authenticated
* **Key Features**:
  * Month-by-month calendar navigation with prev/next controls.
  * Renders scheduled trips and individual activities directly inside calendar day cells.
  * Color-coded category tags on day slots.
  * Click on any calendar event to view activity details and trip metadata.

---

## 9. Travelers Community & Social Feed (`/community`)
* **Route**: `/community`
* **Access**: Authenticated & Public
* **Key Features**:
  * **Inline Quick-Composer**: Top feed widget to share stories, attach photos, and tag trips/activities.
  * **Floating Story Creator Modal**:
    * Textarea with live character counter.
    * Live image URL preview with remove button.
    * Styled dropdowns for tagging active trips and activities.
  * **Social Post Cards**:
    * Traveler avatar with fallback initials.
    * Tagged Trip and Activity badges.
    * Full post body and attached responsive photo preview.
    * **Optimistic Like Button**: Real-time counter animation.
    * **Expandable Threaded Comments**: Dropdown tray with real-time comment authoring, timestamping, and author comment deletion.

---

## 10. User Profile & Settings (`/profile`)
* **Route**: `/profile`
* **Access**: Authenticated
* **Key Features**:
  * Profile avatar upload/preview.
  * Personal information form (name, email, phone, city, country, bio).
  * Lifetime travel summary (total trips taken, destinations visited, stories shared).
  * Password update & security section.

---

## 11. Admin Management Console (`/admin`)
* **Route**: `/admin`
* **Access**: Protected (Requires `is_admin: true`)
* **Key Features**:
  * **Platform Overview Statistics**: Total registered users, active trips, destinations, scheduled activities, and community stories.
  * **Destination Catalog Manager**: Form to add/edit destination cities (country, cost index, popularity score, image URL).
  * **Activity Catalog Manager**: Add/edit city activities (cost, category, duration, description).
  * Instant deletion and catalog curation controls.

---

## 12. Authentication Screens (`/login`, `/register`)
* **Routes**: `/login`, `/register`
* **Access**: Public (auto-redirects to `/` if already authenticated)
* **Key Features**:
  * Case-insensitive email and username authentication.
  * Instant token storage and seamless navigation directly to dashboard upon registration or login.
  * Clean error handling and input validation.
