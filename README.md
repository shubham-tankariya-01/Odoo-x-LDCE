# GlobeTrotter 🌍✈️
> **Next-Generation Travel Itinerary Planner & Community Platform**  
> Built for the LDCE Odoo Hackathon.

GlobeTrotter is a full-stack, responsive travel planning and itinerary management platform that allows users to explore global destinations, construct multi-city leg-by-leg itineraries with categorized activities, dynamically track budgets and live costs, sync trips onto interactive calendars, and share travel stories in a social community feed.

---

## 🎥 Project Video Demonstration & Walkthrough

[![GlobeTrotter Video Demo](https://img.shields.io/badge/▶%EF%B8%8F_Watch_Video_Demo-Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/drive/folders/1EZS729YOCC6CvXRLwWO1nKEf6qWPtuW1)

> 📺 **Click the link above to watch the full project video walkthrough:**  
> **[Google Drive Video Link: GlobeTrotter Walkthrough & Feature Demo](https://drive.google.com/drive/folders/1EZS729YOCC6CvXRLwWO1nKEf6qWPtuW1)**

---

## 📑 Table of Contents
- [Project Video Demonstration](#-project-video-demonstration--walkthrough)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Folder Structure](#-architecture--folder-structure)
- [Prerequisites](#-prerequisites)
- [Local Setup & Installation](#-local-setup--installation)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Backend Setup & Run](#3-backend-setup--run)
  - [4. Frontend Setup & Run](#4-frontend-setup--run)
- [Database & Migrations](#-database--migrations)
- [Documentation Directory](#-documentation-directory)
- [Hackathon Evaluation Quick Links](#-hackathon-evaluation-quick-links)

---


## 🌟 Key Features

### 1. 🧭 Destination Explorer & City Discovery
- Live search across global cities with filters for **Country**, **Cost Index**, and **Popularity Ranking**.
- 1-click destination preview and *"Add to Active Trip"* / *"Start New Trip"* workflow.

### 2. 🗺️ Multi-Leg Interactive Itinerary Builder
- Visual 3-phase trip creator and leg-by-leg itinerary builder (`/trips/:id/build`).
- Add, edit, delete, and reorder itinerary legs / sections (e.g. *Tokyo Leg* ➔ *Kyoto Leg*).
- Schedule categorized activities (Dining, Sightseeing, Transport, Lodging, Activities) with date, time, and custom cost overrides.
- Automated date boundary validation keeping section schedules within overall trip bounds.

### 3. 💰 Live Trip Budget & Cost Breakdown
- Dedicated real-time financial tracking screen (`/trips/:id/budget`).
- 4 Top metric cards: **Total Estimated Spent**, **Planned Budget**, **Remaining Balance (Surplus/Deficit)**, and **Average Daily Spend**.
- Visual budget health meter with threshold alerts.
- Category-wise expense distribution & leg-by-leg budget comparison.
- Chronological itemized activity ledger with search/category filters and printable export view.

### 4. 📅 Interactive Calendar View
- Calendar view (`/calendar`) displaying scheduled activities, departure dates, and trip durations across monthly grids.

### 5. 👥 Travelers Community & Social Feed
- Public feed (`/community`) for travelers to share stories, travel tips, and high-res photos.
- Tag active trips and specific activities directly to posts.
- Interactive likes with optimistic updates and threaded comments with author moderation.
- Inline quick composer and modal story creator with live image preview.

### 6. 🛡️ Role-Based Access & Admin Console
- Secure JWT authentication with case-insensitive login and instant registration onboarding.
- Admin management dashboard (`/admin`) for platform statistics and catalog curation (cities, activities).

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18 (Vite), React Router v6, Lucide Icons, Pure CSS Design System |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn, Python-Jose (JWT), Passlib (Bcrypt) |
| **Database** | PostgreSQL (Neon Cloud / Local), SQLAlchemy 2.0 (Asyncpg), Alembic |
| **Storage / Media** | Cloudinary API integration & remote image URL embedding |

---

## 📂 Architecture & Folder Structure

```
Odoo-x-Ldce/
├── backend/                  # FastAPI Application
│   ├── api/
│   │   ├── routes/           # Modular API endpoints (auth, trips, catalog, community, admin...)
│   │   └── deps.py           # Dependency injection (DB session, current user, admin guard)
│   ├── core/                 # Security, hashing, JWT token generation
│   ├── database/             # Async SQLAlchemy engine & session maker
│   ├── models/               # SQLAlchemy ORM database models (10 tables)
│   ├── schemas/              # Pydantic v2 request/response schemas
│   ├── services/             # Business logic layer (auth, trip, budget, catalog, community)
│   ├── config.py             # App settings & environment loading
│   └── main.py               # FastAPI entry point & CORS configuration
│
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── api/client.js     # Centralized API fetcher client
│   │   ├── context/          # AuthContext with persistent session state
│   │   ├── pages/            # 13 Application pages (Itinerary, Budget, Community...)
│   │   ├── components/       # Reusable UI (Navbar, ProtectedRoute, Modals)
│   │   ├── styles/           # CSS design system (tokens, components, pages)
│   │   ├── App.jsx           # Client-side routing
│   │   └── main.jsx          # React DOM root
│   ├── package.json
│   └── vite.config.js
│
├── ENTITY_RELATIONSHIP_DIAGRAM.md  # Detailed Database ER Diagram
├── ENDPOINTS.md                    # Complete REST API reference for evaluators
├── FRONTEND_PAGES.md               # Visual page & feature guide
└── README.md                       # Main project documentation
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18.0 or higher) & **npm** (v9.0 or higher)
- **Python** (v3.10 or higher) & **pip**
- **Git**

---

## 🚀 Local Setup & Installation

### 1. Clone Repository
```bash
git clone https://github.com/shubham-tankariya-01/Odoo-x-LDCE.git
cd Odoo-x-LDCE
```

---

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory (or use the configured default):

```env
DATABASE_URL=postgresql://neondb_owner:npg_6VvdREkH9DYU@ep-cold-breeze-axj5u0o4.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET_KEY=my_super_secret_jwt_key_123
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
CLOUDINARY_CLOUD_NAME="ejxfx8dd"
CLOUDINARY_API_KEY="962379534883731"
CLOUDINARY_API_SECRET="l25JVDD1d5BDdk6fowaJTTf5hAM"
```

> **Note**: The provided cloud PostgreSQL instance is pre-configured and seeded with global cities and activities.

---

### 3. Backend Setup & Run

1. Open a terminal and navigate to the project root:
```bash
# Create and activate Python virtual environment
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

2. Start the FastAPI development server:
```bash
uvicorn backend.main:app --reload --port 8000
```

* Backend API runs at: **`http://localhost:8000`**
* Interactive Swagger Docs: **`http://localhost:8000/docs`**
* ReDoc API Reference: **`http://localhost:8000/redoc`**

---

### 4. Frontend Setup & Run

1. Open a new terminal and navigate to the `frontend/` directory:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```

* Frontend application runs at: **`http://localhost:5173`** (or `http://localhost:5174`)

---

## 🗄️ Database & Migrations

The database models are automatically created on startup using SQLAlchemy asynchronous metadata.

If you wish to test database connectivity independently:
```bash
python backend/test_async_conn.py
```

To view the complete entity relationships, check:
* **[`ENTITY_RELATIONSHIP_DIAGRAM.md`](file:///d:/Learning/Odoo/Odoo-x-Ldce/ENTITY_RELATIONSHIP_DIAGRAM.md)**

---

## 📖 Documentation Directory

For complete and detailed documentation:
- 📑 **[ENDPOINTS.md](file:///d:/Learning/Odoo/Odoo-x-Ldce/ENDPOINTS.md)** — Comprehensive API reference, request payloads, response structures, and authorization headers.
- 🎨 **[FRONTEND_PAGES.md](file:///d:/Learning/Odoo/Odoo-x-Ldce/FRONTEND_PAGES.md)** — Comprehensive breakdown of every frontend screen, user flows, and interaction states.
- 📊 **[ENTITY_RELATIONSHIP_DIAGRAM.md](file:///d:/Learning/Odoo/Odoo-x-Ldce/ENTITY_RELATIONSHIP_DIAGRAM.md)** — Mermaid ER Diagram, table schemas, keys, and foreign constraints.

---

## 🏆 Hackathon Evaluation Quick Links

| Evaluation Area | Direct Link / Route | Description |
| :--- | :--- | :--- |
| **🎥 Video Walkthrough** | [Google Drive Demo Link](https://drive.google.com/drive/folders/1EZS729YOCC6CvXRLwWO1nKEf6qWPtuW1) | Full project demonstration & walkthrough video |
| **API Documentation** | `http://localhost:8000/docs` | Live interactive FastAPI Swagger UI |
| **Explore Cities** | `http://localhost:5173/search` | Dynamic city catalog search with budget filters |
| **Itinerary Builder** | `http://localhost:5173/trips/new` | Multi-step trip planner & drag/drop activity scheduler |
| **Budget Breakdown** | `http://localhost:5173/trips/:id/budget` | Real-time budget health, category distribution, ledger |
| **Travel Community** | `http://localhost:5173/community` | Story sharing, photo attachment, likes, comments |
| **Calendar Sync** | `http://localhost:5173/calendar` | Monthly view of scheduled trips & daily activities |
| **Admin Console** | `http://localhost:5173/admin` | Platform health stats and city/activity catalog manager |

