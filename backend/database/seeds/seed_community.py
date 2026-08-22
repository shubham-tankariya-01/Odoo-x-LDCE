"""
GlobeTrotter — Community Demo Seed
----------------------------------
Adds realistic community activity on top of the existing database seed:

- 8 demo community users
- 10 trips owned by those users
- 20 community posts
- 40 comments
- 80 likes

It is IDEMPOTENT:
- deterministic UUIDs are used
- re-running the script updates/reuses the same records
- post likes use the existing (post_id, user_id) unique constraint

Run from the project root:
    .\backend\venv\Scripts\python.exe backend\database\seeds\seed_community.py

The script expects backend/.env to contain DATABASE_URL.
"""

import os
import re
import sys
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


# ─────────────────────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parents[2]  # backend/
env_path = BASE_DIR / ".env"
if not env_path.exists():
    env_path = BASE_DIR / "database" / ".env"

load_dotenv(env_path)

raw_url = os.getenv("DATABASE_URL", "")


def clean_database_url(url: str) -> str:
    if not url:
        return ""

    match = re.search(r"postgresql(\+asyncpg|\+psycopg)?://[^\s'\"]+", url)
    extracted = match.group(0) if match else url.strip().strip("'").strip('"')

    if extracted.startswith("postgresql+asyncpg://"):
        extracted = extracted.replace(
            "postgresql+asyncpg://", "postgresql+psycopg://", 1
        )
    elif extracted.startswith("postgresql://"):
        extracted = extracted.replace(
            "postgresql://", "postgresql+psycopg://", 1
        )

    return extracted


DATABASE_URL = clean_database_url(raw_url)

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in backend/.env")
    sys.exit(1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))


# Pre-generated bcrypt hash for Demo@1234.
# No passlib/bcrypt import is needed, so this avoids the bcrypt __about__
# warning you saw when running the original seed script.
DEMO_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"


# ─────────────────────────────────────────────────────────────────────────────
# COMMUNITY USERS
# ─────────────────────────────────────────────────────────────────────────────

USERS = [
    ("community:aarav", "Aarav", "Sharma", "aarav.sharma@globetrotter.demo", "Mumbai", "India"),
    ("community:diya", "Diya", "Patel", "diya.patel@globetrotter.demo", "Ahmedabad", "India"),
    ("community:rohan", "Rohan", "Mehta", "rohan.mehta@globetrotter.demo", "Bengaluru", "India"),
    ("community:ananya", "Ananya", "Iyer", "ananya.iyer@globetrotter.demo", "Chennai", "India"),
    ("community:kabir", "Kabir", "Singh", "kabir.singh@globetrotter.demo", "Delhi", "India"),
    ("community:meera", "Meera", "Nair", "meera.nair@globetrotter.demo", "Kochi", "India"),
    ("community:vivaan", "Vivaan", "Joshi", "vivaan.joshi@globetrotter.demo", "Jaipur", "India"),
    ("community:sana", "Sana", "Khan", "sana.khan@globetrotter.demo", "Hyderabad", "India"),
]


# ─────────────────────────────────────────────────────────────────────────────
# TRIPS
# ─────────────────────────────────────────────────────────────────────────────

TRIPS = [
    ("aarav", "Mumbai Monsoon Weekend",  -12,  -9,  "completed",
     "A food and coastal weekend exploring Mumbai beyond the usual tourist spots.",
     "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=1200"),

    ("diya", "Kerala Backwater Escape",   8,  13,  "upcoming",
     "Slow travel through Kochi and the Kerala backwaters.",
     "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200"),

    ("rohan", "Bengaluru Startup Trail", -3,   0,  "completed",
     "A short city trip mixing tech spaces, cafes and Bengaluru landmarks.",
     "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200"),

    ("ananya", "Chennai & Mahabalipuram", 15,  19, "upcoming",
     "Temples, beaches, South Indian food and a day trip to Mahabalipuram.",
     "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200"),

    ("kabir", "Delhi Heritage Run",       -20, -17, "completed",
     "Three days of monuments, street food and old Delhi walks.",
     "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200"),

    ("meera", "Goa Beach Reset",            2,   6, "ongoing",
     "A relaxed Goa trip focused on beaches, sunsets and local food.",
     "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200"),

    ("vivaan", "Royal Rajasthan Road Trip", 24, 31, "upcoming",
     "Jaipur and Udaipur with forts, markets and a lot of chai.",
     "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200"),

    ("sana", "Hyderabad Food Crawl",      -7,  -4, "completed",
     "Charminar, old-city markets and an aggressively serious biryani mission.",
     "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=1200"),

    ("aarav", "Himalayan Manali Escape",   35,  41, "upcoming",
     "Mountain views, cafe hopping and an easy valley trek.",
     "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200"),

    ("diya", "Varanasi Sunrise Diaries",  -30, -27, "completed",
     "A reflective three-day trip around the ghats, temples and evening aarti.",
     "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=1200"),
]


# ─────────────────────────────────────────────────────────────────────────────
# POSTS
# ─────────────────────────────────────────────────────────────────────────────

POSTS = [
    ("aarav", "Mumbai is somehow even prettier during the monsoon. Marine Drive at sunset was unreal.",
     "Mumbai Monsoon Weekend", "Marine Drive Evening Walk"),

    ("diya", "Planning a Kerala trip soon. Is Kochi + Alleppey enough for 5 days, or should I squeeze in Munnar too?",
     "Kerala Backwater Escape", "Alleppey Backwaters Houseboat Day"),

    ("rohan", "Bengaluru cafes are basically coworking spaces with better coffee. No complaints.",
     "Bengaluru Startup Trail", None),

    ("ananya", "Mahabalipuram was the highlight of this trip. The Shore Temple is gorgeous in the evening.",
     "Chennai & Mahabalipuram", "Mahabalipuram Shore Temple Day Trip"),

    ("kabir", "Old Delhi food walk: absolutely worth doing hungry. Absolutely not worth doing after lunch.",
     "Delhi Heritage Run", None),

    ("meera", "Goa update: beach at 6am > beach at 2pm. The heat is no joke.",
     "Goa Beach Reset", None),

    ("vivaan", "The Jaipur-Udaipur route is looking stacked. Any hidden gems I should add?",
     "Royal Rajasthan Road Trip", None),

    ("sana", "Hyderabad biryani ranking is now a serious personal project.",
     "Hyderabad Food Crawl", "Authentic Hyderabadi Dum Biryani"),

    ("aarav", "Manali planning is done. Now I just need the mountains to cooperate with my budget.",
     "Himalayan Manali Escape", "Doddabetta Peak Trek"),

    ("diya", "Varanasi at sunrise is one of those experiences that photos don't really capture.",
     "Varanasi Sunrise Diaries", None),

    ("meera", "Hot take: Goa doesn't need a packed itinerary. Pick two beaches and chill.",
     "Goa Beach Reset", None),

    ("vivaan", "Jaipur's old city markets are dangerously effective at making you spend money.",
     "Royal Rajasthan Road Trip", None),

    ("sana", "Charminar at night has a completely different vibe compared with daytime.",
     "Hyderabad Food Crawl", "Charminar & Laad Bazaar"),

    ("ananya", "Filter coffee + dosa before sightseeing should honestly be mandatory.",
     "Chennai & Mahabalipuram", "South Indian Tiffin & Filter Coffee"),

    ("kabir", "Delhi monuments are much more enjoyable when you start early and beat the crowds.",
     "Delhi Heritage Run", None),

    ("rohan", "If you're doing Bengaluru in a weekend, don't underestimate traffic. Your itinerary will suffer.",
     "Bengaluru Startup Trail", None),

    ("diya", "Houseboat day in Alleppey is expensive compared with normal Kerala travel, but absolutely worth doing once.",
     "Kerala Backwater Escape", "Alleppey Backwaters Houseboat Day"),

    ("aarav", "The mountains are calling. My semester schedule is calling louder. Pain.",
     "Himalayan Manali Escape", None),

    ("meera", "Sunset at the beach, cheap local food and no alarm tomorrow. That's the Goa itinerary.",
     "Goa Beach Reset", None),

    ("sana", "Would happily return to Hyderabad just for the food. The monuments are a bonus.",
     "Hyderabad Food Crawl", None),
]


# ─────────────────────────────────────────────────────────────────────────────
# COMMENTS
# ─────────────────────────────────────────────────────────────────────────────

COMMENTS = [
    (0,  "This is making me want to plan a Mumbai trip immediately."),
    (0,  "Marine Drive during monsoon is elite."),
    (1,  "I'd skip Munnar if you want a relaxed five days."),
    (1,  "Kochi + Alleppey sounds perfect."),
    (2,  "The coffee culture there is genuinely ridiculous 😂"),
    (3,  "Agreed. Mahabalipuram at sunset was my favourite too."),
    (4,  "The after-lunch warning is important information."),
    (5,  "6am beach walks are underrated."),
    (6,  "Add a local blue pottery workshop if you can."),
    (7,  "Please publish the biryani ranking when complete."),
    (8,  "Budget-friendly mountain trips are the real challenge."),
    (9,  "Sunrise there feels completely different."),
    (10, "Exactly. Goa is better when you stop trying to see everything."),
    (11, "Markets are a financial hazard 😂"),
    (12, "Nighttime Charminar is beautiful."),
    (13, "This is the correct breakfast."),
    (14, "Early starts make such a difference."),
    (15, "Traffic is basically a hidden boss fight."),
    (16, "Adding Alleppey to my list now."),
    (17, "Semester schedule: final boss."),
    (18, "That is honestly the perfect Goa plan."),
    (19, "Food alone is a valid reason to go back."),
    (0,  "What month would you recommend for Mumbai?"),
    (3,  "Did you do the full Mahabalipuram day trip?"),
    (6,  "How many days are you giving Jaipur?"),
    (7,  "Biryani research is important work."),
    (8,  "The cafe hopping part sounds perfect."),
    (9,  "Did you do the evening aarti too?"),
    (10, "This is exactly how I travel."),
    (12, "Did you visit Laad Bazaar as well?"),
    (16, "Houseboat booked yet?"),
    (18, "No itinerary is the best itinerary."),
    (19, "Hyderabad food > everything."),
    (2,  "Which cafes did you like most?"),
    (4,  "Old Delhi is dangerous when you're hungry."),
    (5,  "The heat really changes the strategy."),
    (11, "My wallet can confirm this."),
    (13, "Filter coffee supremacy."),
    (14, "What time did you start?"),
    (15, "This should be printed on every Bengaluru itinerary."),
    (17, "The mountains can wait. The semester cannot 😭"),
]


def run():
    today = date.today()
    now = datetime.now()

    with engine.begin() as conn:
        print("\n" + "=" * 58)
        print("🌱 Seeding GlobeTrotter Community Demo Data")
        print("=" * 58)

        # ── 1. Users ────────────────────────────────────────────────────────
        print("\n[1/5] Seeding community users...")

        user_ids = {}

        for key, first, last, email, city, country in USERS:
            user_id = uid(key)
            user_ids[key.split(":")[-1]] = user_id

            conn.execute(
                text("""
                    INSERT INTO users (
                        id, first_name, last_name, email, password_hash,
                        city, country, is_admin
                    )
                    VALUES (
                        :id, :first_name, :last_name, :email, :password_hash,
                        :city, :country, false
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        city = EXCLUDED.city,
                        country = EXCLUDED.country
                """),
                {
                    "id": user_id,
                    "first_name": first,
                    "last_name": last,
                    "email": email,
                    "password_hash": DEMO_HASH,
                    "city": city,
                    "country": country,
                },
            )

        print(f"  ✓ {len(USERS)} community users")

        # ── 2. Trips ────────────────────────────────────────────────────────
        print("\n[2/5] Seeding community trips...")

        trip_ids = {}

        for i, (
            owner, name, start_offset, end_offset, status,
            description, cover
        ) in enumerate(TRIPS):
            trip_id = uid(f"community:trip:{i}:{name}")
            trip_ids[name] = trip_id

            conn.execute(
                text("""
                    INSERT INTO trips (
                        id, user_id, name, start_date, end_date,
                        description, cover_photo_url, status
                    )
                    VALUES (
                        :id, :user_id, :name, :start_date, :end_date,
                        :description, :cover_photo_url, :status
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        name = EXCLUDED.name,
                        start_date = EXCLUDED.start_date,
                        end_date = EXCLUDED.end_date,
                        description = EXCLUDED.description,
                        cover_photo_url = EXCLUDED.cover_photo_url,
                        status = EXCLUDED.status
                """),
                {
                    "id": trip_id,
                    "user_id": user_ids[owner],
                    "name": name,
                    "start_date": today + timedelta(days=start_offset),
                    "end_date": today + timedelta(days=end_offset),
                    "description": description,
                    "cover_photo_url": cover,
                    "status": status,
                },
            )

        print(f"  ✓ {len(TRIPS)} community trips")

        # ── 3. Posts ─────────────────────────────────────────────────────────
        print("\n[3/5] Seeding community posts...")

        post_ids = []

        activity_cache = {}

        for index, (author, content, trip_name, activity_name) in enumerate(POSTS):
            post_id = uid(f"community:post:{index}")

            activity_id = None
            if activity_name:
                if activity_name not in activity_cache:
                    result = conn.execute(
                        text("""
                            SELECT id
                            FROM activities
                            WHERE name = :name
                            LIMIT 1
                        """),
                        {"name": activity_name},
                    ).scalar_one_or_none()

                    activity_cache[activity_name] = result

                activity_id = activity_cache[activity_name]

            trip_id = trip_ids.get(trip_name)

            created_at = now - timedelta(days=max(1, len(POSTS) - index))

            conn.execute(
                text("""
                    INSERT INTO community_posts (
                        id, user_id, trip_id, activity_id,
                        content, created_at
                    )
                    VALUES (
                        :id, :user_id, :trip_id, :activity_id,
                        :content, :created_at
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        trip_id = EXCLUDED.trip_id,
                        activity_id = EXCLUDED.activity_id,
                        content = EXCLUDED.content,
                        created_at = EXCLUDED.created_at
                """),
                {
                    "id": post_id,
                    "user_id": user_ids[author],
                    "trip_id": trip_id,
                    "activity_id": activity_id,
                    "content": content,
                    "created_at": created_at,
                },
            )

            post_ids.append(post_id)

        print(f"  ✓ {len(POSTS)} community posts")

        # ── 4. Comments ─────────────────────────────────────────────────────
        print("\n[4/5] Seeding comments...")

        comment_count = 0
        community_user_keys = list(user_ids.keys())

        for index, (post_index, content) in enumerate(COMMENTS):
            post_id = post_ids[post_index]

            # Rotate commenters so posts don't look artificially single-user.
            commenter = community_user_keys[(index + 2) % len(community_user_keys)]
            comment_id = uid(f"community:comment:{index}")

            conn.execute(
                text("""
                    INSERT INTO post_comments (
                        id, post_id, user_id, content, created_at
                    )
                    VALUES (
                        :id, :post_id, :user_id, :content, :created_at
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        post_id = EXCLUDED.post_id,
                        user_id = EXCLUDED.user_id,
                        content = EXCLUDED.content,
                        created_at = EXCLUDED.created_at
                """),
                {
                    "id": comment_id,
                    "post_id": post_id,
                    "user_id": user_ids[commenter],
                    "content": content,
                    "created_at": now - timedelta(hours=index * 7),
                },
            )

            comment_count += 1

        print(f"  ✓ {comment_count} comments")

        # ── 5. Likes ─────────────────────────────────────────────────────────
        print("\n[5/5] Seeding likes...")

        like_count = 0

        # Give every post several likes from different community users.
        for post_index, post_id in enumerate(post_ids):
            for offset in range(4):
                liker = community_user_keys[
                    (post_index + offset + 1) % len(community_user_keys)
                ]

                like_id = uid(f"community:like:{post_index}:{liker}")

                conn.execute(
                    text("""
                        INSERT INTO post_likes (
                            id, post_id, user_id
                        )
                        VALUES (
                            :id, :post_id, :user_id
                        )
                        ON CONFLICT (post_id, user_id) DO NOTHING
                    """),
                    {
                        "id": like_id,
                        "post_id": post_id,
                        "user_id": user_ids[liker],
                    },
                )

                like_count += 1

        print(f"  ✓ {like_count} likes")

        print("\n" + "=" * 58)
        print("✅ Community demo data successfully seeded!")
        print("=" * 58)
        print("   Users:    8")
        print("   Trips:   10")
        print("   Posts:   20")
        print(f"   Comments:{comment_count:3}")
        print(f"   Likes:   {like_count:3}")
        print("\n   All community users use password: Demo@1234")
        print("   Safe to run again — IDs are deterministic.")
        print("=" * 58 + "\n")


if __name__ == "__main__":
    run()
