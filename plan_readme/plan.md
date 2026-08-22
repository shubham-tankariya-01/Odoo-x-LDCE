# GlobeTrotter: Hackathon Proposal and Delivery Plan

## 1. Executive proposal

**GlobeTrotter** is a collaborative travel-planning web application that lets a traveller build a multi-city itinerary, organise activities day by day, and see the estimated trip cost update instantly. The product turns fragmented travel research into one understandable, shareable plan.

For the hackathon, the team should ship a polished end-to-end MVP centred on one complete journey:

> Sign in -> create a trip -> add and reorder city stops -> add activities -> review timeline and budget -> share a public itinerary.

This is the smallest scope that demonstrates the brief's core strengths: relational data modelling, dynamic interfaces, useful budget insight, and social sharing. Administrative analytics, rich recommendation engines, cover-photo uploads, and full drag-and-drop editing should be treated as stretch goals.

## 2. Problem framing

Travel planning becomes difficult when dates, destinations, activities, and costs are kept in separate tools. Multi-city trips add dependencies: a stop must fit the trip dates, activities must belong to a stop and day, and every change should affect the trip timeline and total spend.

GlobeTrotter solves this by making the **trip** the single source of truth. Each trip contains ordered stops; each stop contains dated activities; each activity contributes to a transparent cost breakdown. A public share link makes a finished plan useful beyond its original creator.

### Target users

- **Primary - independent traveller:** plans a 3-14 day, multi-city holiday and needs one organised view.
- **Secondary - trip organiser:** builds a plan for friends or family and shares a read-only version.
- **Stretch - platform admin:** sees high-level adoption and destination trends.

### Success criteria for the demo

- A new user can create a trip and populate at least two stops.
- Stops appear in order, have valid dates within the trip, and can be rearranged.
- Activities are attached to a specific stop and day.
- The itinerary and budget recalculate from persisted database records.
- A public URL renders a read-only shareable itinerary.

## 3. MVP scope

| Area | Ship in MVP | Leave for stretch / future |
| --- | --- | --- |
| Authentication | Email/password sign-up and login; seeded demo account | Password reset, OAuth, account deletion |
| Dashboard | Recent trips, plan-new-trip action, simple budget highlights | Personalised recommendations |
| Trip management | Create, view, edit, delete owned trips | Cover-photo upload and archival workflows |
| Itinerary builder | Add city stops, set dates, reorder stops, add activities | Drag-and-drop calendar interaction |
| Discovery | Search/filter seeded city and activity catalogue | Live third-party travel APIs |
| Budget | Total plus transport, stay, activity and meal categories; per-day average | Currency conversion, alerts and forecasting |
| Sharing | Unlisted public slug, read-only itinerary, copy trip | Social posting integrations and comments |
| Admin | Not required | Usage dashboard and user management |

## 4. User experience and screens

1. **Login / sign-up** - fast entry with validation and a visible demo-account option.
2. **Dashboard** - welcome state, upcoming trip cards, quick-create action, a few curated destinations.
3. **Create trip** - name, description, overall start/end date, optional total budget.
4. **My trips** - card list with date range, number of stops, total estimate, edit/delete actions.
5. **Itinerary builder** - ordered stop rail and main detail panel. Adding a stop requires city plus arrival/departure dates; adding an activity assigns a day and time.
6. **Discover panel** - city search and activity catalogue with filters (category, cost, duration), designed to add directly to the active stop.
7. **Itinerary view** - calendar/list toggle. Default demo view should be a vertical day-by-day timeline because it is easier to scan and more reliable to build.
8. **Budget view** - category cards, a cost-by-day bar chart, a category doughnut chart, and an over-budget indicator when an optional trip budget is exceeded.
9. **Shared itinerary** - clean read-only page at `/share/:slug`, with summary, route, day plan, and a "Copy this trip" action for signed-in users.

## 5. Data model

Use a relational database (PostgreSQL is recommended) and enforce ownership and date rules at the service layer. Store monetary amounts as integer minor units (for example paise/cents), never floating-point values.

```text
User 1--* Trip 1--* TripStop *--1 City
                    |
                    *--* ItineraryActivity *--1 ActivityCatalogItem

Trip 1--* Expense (optional manual / transport / stay / meal adjustments)
Trip 1--0..1 ShareLink
```

### Essential tables

| Table | Key fields | Notes |
| --- | --- | --- |
| `users` | id, name, email, password_hash, avatar_url | email is unique |
| `trips` | id, user_id, title, description, start_date, end_date, budget_minor, currency | user-owned parent record |
| `cities` | id, name, country, region, cost_index, image_url | curated searchable catalogue |
| `trip_stops` | id, trip_id, city_id, sort_order, arrival_date, departure_date | unique `(trip_id, sort_order)` |
| `activities` | id, city_id, title, category, duration_minutes, estimated_cost_minor, image_url | curated catalogue |
| `itinerary_activities` | id, trip_stop_id, activity_id, activity_date, start_time, sort_order, estimated_cost_minor | cost can override catalogue amount |
| `expenses` | id, trip_id, category, amount_minor, date, note | supports stay, transport and meals |
| `share_links` | id, trip_id, slug, is_public, created_at | slug is unique |

### Core validation rules

- Trip start date must be on or before end date.
- Stop dates must fall inside the parent trip dates; departure cannot precede arrival.
- Activity date must fall inside its stop's date range.
- Only the owning user can modify a trip, stop, activity, expense, or share setting.
- Public pages expose only data for an active public share link; never user email or private profile data.

## 6. Technical solution

Recommended stack: **Next.js + TypeScript** for the responsive web app; **PostgreSQL + Prisma** (or Supabase) for relational persistence and auth; **Tailwind CSS + shadcn/ui** for consistent UI; **Recharts** for budget visuals; and a server-generated route for sharing.

If fast hosted infrastructure is available, Supabase is the pragmatic hackathon choice because it provides Postgres, authentication, row-level security, and a manageable dashboard. If not, run a local Postgres instance and seed the application with 12-20 cities and 40-60 activities so that discovery feels real without dependency on third-party APIs.

### Derived-budget formula

```text
trip_total = SUM(itinerary_activity.estimated_cost)
           + SUM(expense.amount for transport, stay, meals, and adjustments)

daily_total(day) = activity costs scheduled on day + expenses dated on day
average_daily_cost = trip_total / max(number_of_trip_days, 1)
```

Calculate totals on the server or in one shared domain utility, not separately in each screen. This prevents discrepancies between the builder, budget page, and shared view.

## 7. Delivery plan

### Phase 0 - align (30-45 minutes)

- Agree on MVP scope and the demo storyline.
- Choose stack and define the seeded catalogue.
- Create a shared UI reference: warm travel imagery, map-inspired accents, strong day/date hierarchy, accessible contrast.
- Define the route and data contract before parallel UI work begins.

### Phase 1 - foundation (1.5-2 hours)

- Set up repository, environment configuration, linting, and deployment target.
- Create schema, migrations, seed script, authentication, and ownership policy.
- Build reusable primitives: layout, navigation, cards, modal/drawer, form controls, empty states, currency formatter.
- Seed a compelling demo user with one finished sample trip.

### Phase 2 - primary flow (3-4 hours)

- Implement dashboard, trip creation, and trip list.