# Database Module — GlobeTrotter

Manages the Neon PostgreSQL database connection, migrations, and seed data.

---

## 📁 Directory Structure

```
backend/database/
├── __init__.py                  # Module exports (engine, SessionLocal, get_db)
├── connection.py                # SQLAlchemy engine & session configuration
├── .env                         # Local environment configuration (Neon DB connection)
└── README.md                    # Setup, examples, and usage guide
```

---

## ⚙️ 1. Configuration

Set your Neon PostgreSQL URL in `backend/database/.env`:
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

---

## 📝 2. Migration File Example (`00X_migration_name.sql`)

Place new migration SQL files in `database/migrations/`:

```sql
-- 1. Enable extensions if required
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create tables with constraints and foreign keys
CREATE TABLE IF NOT EXISTS example_table (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100)   NOT NULL,
    amount      NUMERIC(10, 2) DEFAULT 0.00,
    created_at  TIMESTAMPTZ    DEFAULT now(),
    CONSTRAINT chk_example_amount_nonnegative CHECK (amount >= 0)
);

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_example_user_id ON example_table(user_id);
```

---

## 🌱 3. Seeding File Example (`seed_example.py`)

Pattern for idempotent database seeds in `database/seeds/`:

```python
import uuid
from sqlalchemy import create_engine, text
from database.connection import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Deterministic UUID generation for idempotent re-runs
NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))

EXAMPLE_CITIES = [
    {"id": uid("city:delhi"), "name": "Delhi", "country": "India", "cost_index": 5.8, "popularity_score": 94}
]

def run_seed():
    with engine.begin() as conn:
        for city in EXAMPLE_CITIES:
            conn.execute(text("""
                INSERT INTO cities (id, name, country, cost_index, popularity_score)
                VALUES (:id, :name, :country, :cost_index, :popularity_score)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    country = EXCLUDED.country
            """), city)
        print("✓ Seed completed.")

if __name__ == "__main__":
    run_seed()
```

---

## 🚀 4. Usage & Commands

Run from `backend/` with active virtual environment:

### Test Connection
```powershell
python database/connection.py
```

### Apply Migrations
```powershell
psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
```

### Seed Database
```powershell
python database/seeds/seed.py
```

---

## 👤 Seed Accounts

| Role | Email | Password |
|---|---|---|
| **Demo User** | `demo@globetrotter.com` | `Demo@1234` |
| **Admin User** | `admin@globetrotter.com` | `Admin@1234` |
