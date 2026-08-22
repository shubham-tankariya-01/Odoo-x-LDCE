"""
GlobeTrotter — Database Seed Script
Populates: 18 Indian Cities, 90+ Curated Activities, Demo Users, Trips, Sections, Scheduled Activities, and Expenses.
Idempotent: Safe to run multiple times.
Usage:
    python backend/database/seeds/seed.py
"""

import os
import re
import sys
import uuid
from datetime import date, timedelta, time
from pathlib import Path
from dotenv import load_dotenv

# ── Load Environment Variables ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
env_path = BASE_DIR / ".env"
if not env_path.exists():
    env_path = BASE_DIR / "database" / ".env"

load_dotenv(dotenv_path=env_path)

raw_url = os.getenv("DATABASE_URL", "")

def clean_database_url(url: str) -> str:
    if not url:
        return ""
    match = re.search(r"postgresql(\+asyncpg|\+psycopg)?://[^\s'\"]+", url)
    extracted = match.group(0) if match else url.strip().strip("'").strip('"')
    if extracted.startswith("postgresql+asyncpg://"):
        extracted = extracted.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    elif extracted.startswith("postgresql://"):
        extracted = extracted.replace("postgresql://", "postgresql+psycopg://", 1)
    return extracted

DATABASE_URL = clean_database_url(raw_url)
if not DATABASE_URL:
    print("❌ Error: DATABASE_URL not found in .env")
    sys.exit(1)

from sqlalchemy import create_engine, text
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# ── Password Hashing ────────────────────────────────────────────────────────
DEMO_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"   # Demo@1234
ADMIN_HASH = "$2b$12$e88yv/2qX4J.b/3d10kZkeH8W7.Kq2yvN5hFjW4GZfB77n831YI1W"  # Admin@1234

def hash_pw(pw: str) -> str:
    try:
        from passlib.context import CryptContext
        return CryptContext(schemes=["bcrypt"], deprecated="auto").hash(pw)
    except Exception:
        try:
            import bcrypt
            return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
        except Exception:
            if pw == "Demo@1234":
                return DEMO_HASH
            if pw == "Admin@1234":
                return ADMIN_HASH
            import hashlib
            return hashlib.sha256(pw.encode()).hexdigest()

# ── Deterministic UUID Generator ───────────────────────────────────────────
NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))

today = date.today()
def fd(delta: int) -> date:
    return today + timedelta(days=delta)

# ══════════════════════════════════════════════════════════════════════════════
# CITIES (18 Indian Cities)
# ══════════════════════════════════════════════════════════════════════════════

CITIES = [
    ("Mumbai",        "India", 6.5, 95, "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800"),
    ("Delhi",         "India", 5.8, 94, "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800"),
    ("Jaipur",        "India", 4.5, 92, "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800"),
    ("Goa",           "India", 5.2, 96, "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800"),
    ("Udaipur",       "India", 4.8, 90, "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=800"),
    ("Varanasi",      "India", 3.2, 88, "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=800"),
    ("Bengaluru",     "India", 6.0, 89, "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800"),
    ("Kolkata",       "India", 3.8, 85, "https://images.unsplash.com/photo-1558431382-27e303142255?w=800"),
    ("Agra",          "India", 4.0, 93, "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800"),
    ("Manali",        "India", 4.2, 91, "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800"),
    ("Rishikesh",     "India", 3.5, 89, "https://images.unsplash.com/photo-1605649487212-47bdab064df8?w=800"),
    ("Kochi",         "India", 4.4, 86, "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800"),
    ("Hyderabad",     "India", 5.0, 87, "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=800"),
    ("Amritsar",      "India", 3.6, 88, "https://images.unsplash.com/photo-1588096344356-9b4977464673?w=800"),
    ("Leh Ladakh",    "India", 5.5, 92, "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800"),
    ("Ahmedabad",     "India", 4.2, 84, "https://images.unsplash.com/photo-1597040663342-45b6af3d91a5?w=800"),
    ("Chennai",       "India", 4.6, 83, "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800"),
    ("Ooty",          "India", 4.1, 85, "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800"),
]

# ══════════════════════════════════════════════════════════════════════════════
# ACTIVITIES (Curated per City)
# ══════════════════════════════════════════════════════════════════════════════

ACTIVITIES = [
    # Mumbai
    ("Mumbai", "Gateway of India & Ferry",        "sightseeing",   50.0,   60, "Iconic arch monument overlooking the Arabian Sea.", "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600"),
    ("Mumbai", "Marine Drive Evening Walk",       "relaxation",     0.0,   90, "Queen's Necklace promenade with panoramic ocean views.", "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600"),
    ("Mumbai", "Elephanta Caves Tour",            "culture",      300.0,  240, "UNESCO World Heritage rock-cut cave temples.", "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600"),
    ("Mumbai", "Chowpatty Street Food Walk",      "food",         250.0,  120, "Taste authentic Pav Bhaji, Bhel Puri, and Kulfi.", "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"),
    ("Mumbai", "Bollywood Film City Tour",        "culture",     1200.0,  180, "Exclusive guided studio tour of live sets and stages.", "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600"),
    ("Mumbai", "Bandra Nightlife & Pub Crawl",    "nightlife",    800.0,  240, "Trendy cafes, cocktail lounges, and live music venues.", "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600"),

    # Delhi
    ("Delhi", "Red Fort Exploration",             "sightseeing",  100.0,  120, "Mughal era fortress and UNESCO heritage site.", "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600"),
    ("Delhi", "Old Delhi Chandni Chowk Food Tour","food",         400.0,  180, "Famous Paranthe Wali Gali, chaat, and jalebis.", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600"),
    ("Delhi", "Qutub Minar & Mehrauli",           "culture",       80.0,  120, "World's tallest brick minaret surrounded by historic ruins.", "https://images.unsplash.com/photo-1548013146-72479768bada?w=600"),
    ("Delhi", "Humayun's Tomb Visit",             "sightseeing",   80.0,   90, "Splendid Persian-style Mughal garden tomb.", "https://images.unsplash.com/photo-1608958435020-e8a7109ba809?w=600"),
    ("Delhi", "Hauz Khas Village Nightlife",      "nightlife",    600.0,  240, "Medieval ruins backdrop with vibrant bars and bistros.", "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600"),
    ("Delhi", "Lodhi Garden Heritage Walk",       "nature",         0.0,   75, "Lush landscaped historic park perfect for peaceful walks.", "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600"),

    # Jaipur
    ("Jaipur", "Amber Fort & Palace Tour",        "sightseeing",  200.0,  180, "Majestic hilltop fort with Sheesh Mahal mirror palace.", "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600"),
    ("Jaipur", "Hawa Mahal & Old Bazaar",         "sightseeing",   50.0,   90, "Palace of Winds and shopping for handicrafts & gemstones.", "https://images.unsplash.com/photo-1603288940316-2495393db371?w=600"),
    ("Jaipur", "Nahargarh Fort Sunset View",      "adventure",    100.0,  120, "Panoramic evening views over the entire Pink City.", "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600"),
    ("Jaipur", "Rajasthani Thali Dining",         "food",         500.0,   90, "Authentic Dal Baati Churma and royal Rajasthani banquet.", "https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?w=600"),
    ("Jaipur", "Block Printing Workshop",         "culture",      450.0,  120, "Hands-on traditional Sanganeri textile art session.", "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600"),

    # Goa
    ("Goa", "North Goa Beach Watersports",        "adventure",   1200.0,  240, "Parasailing, jet ski, and banana boat at Baga/Calangute.", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600"),
    ("Goa", "Old Goa Churches & Cathedral",       "culture",        0.0,  120, "Basilica of Bom Jesus and Portuguese colonial architecture.", "https://images.unsplash.com/photo-1548013146-72479768bada?w=600"),
    ("Goa", "Dudhsagar Waterfalls Trek",          "nature",       900.0,  360, "Four-tiered majestic cascading jungle waterfall.", "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600"),
    ("Goa", "Anjuna Beach Sunset Party",          "nightlife",    500.0,  240, "Live beach DJ, bonfire, and coastal seafood shacks.", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600"),
    ("Goa", "Spice Plantation Tour & Lunch",      "food",         400.0,  180, "Guided tropical spice plantation tour with traditional buffet.", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600"),

    # Udaipur
    ("Udaipur", "City Palace Grand Tour",         "sightseeing",  300.0,  180, "Rajasthan's largest royal palace complex overlooking Lake Pichola.", "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=600"),
    ("Udaipur", "Lake Pichola Sunset Boat Cruise","relaxation",   400.0,   75, "Peaceful boat ride with Jag Mandir & Lake Palace views.", "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=600"),
    ("Udaipur", "Bagore Ki Haveli Folk Dance",    "culture",      150.0,   90, "Dharohar evening dance and puppet show by the lake.", "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=600"),
    ("Udaipur", "Saheliyon Ki Bari Gardens",      "nature",        50.0,   60, "Lush fountains, marble elephants, and lotus pools.", "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=600"),
    ("Udaipur", "Rooftop Candlelight Dinner",     "food",         750.0,  120, "Lakeside dining with illuminated palace views.", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600"),

    # Varanasi
    ("Varanasi", "Dashashwamedh Ghat Ganga Aarti","culture",        0.0,   90, "Mesmerizing evening prayer ceremony with fire lanterns.", "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=600"),
    ("Varanasi", "Sunrise Boat Ride on Ganges",   "relaxation",   300.0,   90, "Morning rowboat along the ancient spiritual ghats.", "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=600"),
    ("Varanasi", "Kashi Vishwanath Temple Darshan","culture",      0.0,  120, "Sacred golden temple dedicated to Lord Shiva.", "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=600"),
    ("Varanasi", "Banarasi Street Food & Lassi",  "food",         150.0,   90, "Creamy Blue Lassi, Kachori Sabzi, and Malaiyo.", "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"),
    ("Varanasi", "Sarnath Buddhist Heritage Tour","sightseeing",   50.0,  180, "Where Buddha delivered his first sermon; Dhamek Stupa.", "https://images.unsplash.com/photo-1548013146-72479768bada?w=600"),

    # Bengaluru
    ("Bengaluru", "Lalbagh Botanical Garden Walk","nature",        30.0,  120, "Famous 240-acre glass house and centuries-old trees.", "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600"),
    ("Bengaluru", "Indiranagar Microbrewery Crawl","nightlife",   900.0,  240, "Craft beer tasting at India's leading pub capital.", "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600"),
    ("Bengaluru", "Bangalore Palace Royal Tour",  "culture",      250.0,  120, "Tudor-style royal architecture with wood carvings.", "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600"),
    ("Bengaluru", "VV Puram Food Street Trail",   "food",         200.0,  120, "Dosass, Paddus, Congress bun, and filter coffee trail.", "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600"),
    ("Bengaluru", "Nandi Hills Sunrise Excursion","adventure",    150.0,  240, "Early morning drive for sea-of-clouds sunrise panorama.", "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600"),

    # Agra
    ("Agra", "Taj Mahal Sunrise Visit",           "sightseeing",  250.0,  180, "World Wonder in white marble at golden sunrise.", "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600"),
    ("Agra", "Agra Fort Heritage Tour",           "culture",       50.0,  120, "Mughal imperial city and defensive brick fort.", "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600"),
    ("Agra", "Fatehpur Sikri Day Trip",           "sightseeing",   50.0,  240, "Ancient red sandstone ghost city built by Akbar.", "https://images.unsplash.com/photo-1548013146-72479768bada?w=600"),
    ("Agra", "Mughlai Food & Petha Tasting",      "food",         250.0,   90, "Traditional Agra petha sweets and rich kebabs.", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600"),
    ("Agra", "Mehtab Bagh Sunset Taj View",       "relaxation",    30.0,   90, "Charbagh garden across the river framing the Taj.", "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600"),

    # Manali
    ("Manali", "Solang Valley Paragliding",       "adventure",   1500.0,  240, "High adrenaline aero and snow sports in the Himalayas.", "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600"),
    ("Manali", "Atal Tunnel & Sissu Day Trip",    "nature",       800.0,  300, "Drive through engineering marvel into Lahaul valley.", "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600"),
    ("Manali", "Old Manali Cafe Hopping",         "food",         400.0,  180, "Bohemian wooden cafes with trout and live acoustic music.", "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600"),
    ("Manali", "Hadimba Temple Forest Walk",      "culture",       30.0,   60, "Ancient wooden pagoda temple in cedar pine woods.", "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600"),
    ("Manali", "Vashisht Hot Water Springs",      "relaxation",     0.0,   60, "Natural sulfur thermal healing springs.", "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600"),

    # Rishikesh
    ("Rishikesh", "Ganga White Water Rafting",    "adventure",    800.0,  180, "Grade III/IV rapids on the holy Ganges.", "https://images.unsplash.com/photo-1605649487212-47bdab064df8?w=600"),
    ("Rishikesh", "Triveni Ghat Evening Aarti",   "culture",        0.0,   90, "Spiritual hymn chants and floating earthen lamps.", "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=600"),
    ("Rishikesh", "Beatles Ashram Exploration",   "sightseeing",  150.0,  120, "Historic Maharishi Mahesh Yogi ashram with graffiti art.", "https://images.unsplash.com/photo-1605649487212-47bdab064df8?w=600"),
    ("Rishikesh", "Yoga & Meditation Workshop",   "relaxation",   350.0,   90, "Rejuvenating Hatha yoga session with Himalayan masters.", "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600"),
    ("Rishikesh", "Bungee Jumping at Mohan Chatti","adventure",  3500.0,  120, "India's highest 83-meter fixed platform bungee jump.", "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600"),

    # Kochi
    ("Kochi", "Fort Kochi & Chinese Fishing Nets","sightseeing",    0.0,   90, "Iconic cantilevered shore nets and colonial streets.", "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600"),
    ("Kochi", "Alleppey Backwaters Houseboat Day","nature",      1800.0,  360, "Glide along serene palm-fringed Kerala backwater lagoons.", "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600"),
    ("Kochi", "Kathakali Classical Performance",  "culture",      350.0,   90, "Vibrant makeup and traditional Kerala classical dance drama.", "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600"),
    ("Kochi", "Kerala Seafood & Sadhya Feast",    "food",         450.0,   90, "Banana leaf traditional Sadhya and Karimeen Pollichathu.", "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600"),
    ("Kochi", "Jew Town & Mattancherry Palace",   "culture",       25.0,  120, "Historic spice markets, antique shops, and synagoue.", "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600"),

    # Amritsar
    ("Amritsar", "Golden Temple (Harmandir Sahib)","culture",       0.0,  180, "Spiritual sanctum of Sikhism with sacred Amrit Sarovar lake.", "https://images.unsplash.com/photo-1588096344356-9b4977464673?w=600"),
    ("Amritsar", "Langar Community Kitchen Service","culture",      0.0,   90, "World's largest free community kitchen serving thousands.", "https://images.unsplash.com/photo-1588096344356-9b4977464673?w=600"),
    ("Amritsar", "Wagah Border Beating Retreat",  "sightseeing",    0.0,  180, "High-energy military drill ceremony at India-Pakistan border.", "https://images.unsplash.com/photo-1588096344356-9b4977464673?w=600"),
    ("Amritsar", "Amritsari Kulcha & Lassi Trail","food",         180.0,   90, "Crispy stuffed kulchas with homemade butter and rich lassi.", "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"),
    ("Amritsar", "Jallianwala Bagh Memorial",     "culture",        0.0,   60, "Historic national memorial park and eternal flame.", "https://images.unsplash.com/photo-1588096344356-9b4977464673?w=600"),

    # Leh Ladakh
    ("Leh Ladakh", "Pangong Tso Lake Excursion",  "nature",      1500.0,  480, "Famous color-changing high altitude salt lake.", "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=600"),
    ("Leh Ladakh", "Khardung La Pass Motorbike Ride","adventure", 2000.0, 300, "Conquer one of the world's highest motorable passes.", "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=600"),
    ("Leh Ladakh", "Thiksey Monastery Morning Prayer","culture",   50.0,  120, "Mini Potala Palace with 49-foot Maitreya Buddha statue.", "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=600"),
    ("Leh Ladakh", "Magnetic Hill & Indus Sangam", "sightseeing",   0.0,  120, "Confluence of Indus and Zanskar rivers & gravity hill.", "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=600"),
    ("Leh Ladakh", "Ladakhi Thukpa & Momos Tasting","food",       200.0,   60, "Hearty Himalayan noodle soup and steaming momos.", "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600"),

    # Kolkata
    ("Kolkata", "Victoria Memorial & Maidan Walk","sightseeing",   50.0,  120, "Magnificent white marble palace surrounded by gardens.", "https://images.unsplash.com/photo-1558431382-27e303142255?w=600"),
    ("Kolkata", "Howrah Bridge & Flower Market Walk","culture",     0.0,   90, "Asia's largest flower market alongside the cantilever bridge.", "https://images.unsplash.com/photo-1558431382-27e303142255?w=600"),
    ("Kolkata", "Kolkata Kathi Roll & Mishti Trail","food",       150.0,   90, "Kathi rolls at Nizam's and authentic Rosogolla & Mishti Doi.", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600"),
    ("Kolkata", "Kumartuli Idol Makers Colony",   "culture",        0.0,   90, "Traditional clay artisans crafting Durga idols.", "https://images.unsplash.com/photo-1558431382-27e303142255?w=600"),
    ("Kolkata", "Park Street Evening Dine & Jazz","nightlife",    600.0,  180, "Historic culinary heart with live jazz performances.", "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600"),

    # Hyderabad
    ("Hyderabad", "Charminar & Laad Bazaar",      "sightseeing",   25.0,  120, "16th-century landmark and historic lacquer bangle market.", "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=600"),
    ("Hyderabad", "Golconda Fort Sound & Light",  "culture",      100.0,  180, "Medieval fortress with acoustic engineering marvels.", "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=600"),
    ("Hyderabad", "Authentic Hyderabadi Dum Biryani","food",      350.0,   90, "World-renowned slow-cooked fragrant rice and meat banquet.", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600"),
    ("Hyderabad", "Ramoji Film City Full Day",    "adventure",   1350.0,  480, "World's largest film studio complex and theme park.", "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600"),
    ("Hyderabad", "Hussain Sagar Lake Boat Cruise","relaxation",  100.0,   75, "Boat ride to the monolith Buddha statue in the lake.", "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=600"),

    # Ahmedabad
    ("Ahmedabad", "Sabarmati Ashram Heritage Tour","culture",       0.0,   90, "Mahatma Gandhi's peaceful headquarters during freedom movement.", "https://images.unsplash.com/photo-1597040663342-45b6af3d91a5?w=600"),
    ("Ahmedabad", "Manek Chowk Night Food Market","food",         200.0,  120, "Jewelry market transforms into midnight street food feast.", "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"),
    ("Ahmedabad", "Adalaj Stepwell Exploration",  "sightseeing",   25.0,   90, "Intricately carved 5-story Indo-Islamic subterranean stepwell.", "https://images.unsplash.com/photo-1597040663342-45b6af3d91a5?w=600"),
    ("Ahmedabad", "Sabarmati Riverfront Promenade","relaxation",    0.0,   75, "Modern waterfront park with river breezes.", "https://images.unsplash.com/photo-1597040663342-45b6af3d91a5?w=600"),
    ("Ahmedabad", "Traditional Gujarati Thali",   "food",         350.0,   90, "Unlimited royal vegetarian spread of dhokla, thepla, and sweets.", "https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?w=600"),

    # Chennai
    ("Chennai", "Marina Beach Promenade & Sunrise","relaxation",    0.0,   90, "India's longest natural urban beach.", "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600"),
    ("Chennai", "Kapaleeshwarar Temple Visit",    "culture",        0.0,   90, "Dravidian architecture temple with colorful sculpted gopuram.", "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600"),
    ("Chennai", "Mahabalipuram Shore Temple Day Trip","sightseeing", 40.0, 240, "UNESCO monolithic rock carvings and ancient coastal temples.", "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600"),
    ("Chennai", "South Indian Tiffin & Filter Coffee","food",     150.0,   90, "Crispy Ghee Podi Dosa, Idli, and authentic Kaapi.", "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600"),
    ("Chennai", "Kalakshetra Arts Foundation Tour","culture",     100.0,  120, "Academy dedicated to Bharatanatyam dance and Carnatic music.", "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600"),

    # Ooty
    ("Ooty", "Nilgiri Mountain Toy Train Ride",   "sightseeing",  205.0,  240, "UNESCO heritage steam locomotive across tea valleys.", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600"),
    ("Ooty", "Ooty Botanical Gardens Walk",       "nature",        30.0,  120, "Sprawling terraced garden with exotic floral species.", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600"),
    ("Ooty", "Doddabetta Peak Trek",              "adventure",     10.0,  150, "Highest mountain in the Nilgiris with panoramic view telescope.", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600"),
    ("Ooty", "Tea Factory & Chocolate Tasting",   "food",          50.0,   90, "See fresh tea processing and sample homemade fudge & chocolates.", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600"),
    ("Ooty", "Pykara Lake Speedboating",          "relaxation",   200.0,   60, "Scenic lake boat ride surrounded by shola forests.", "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=600"),
]

# ══════════════════════════════════════════════════════════════════════════════
# SEED RUNNER
# ══════════════════════════════════════════════════════════════════════════════

def run():
    with engine.begin() as conn:
        print("\n" + "="*50)
        print("🌱 Seeding GlobeTrotter Database (Indian Destinations)")
        print("="*50)

        # ── 1. Cities ────────────────────────────────────────────────────────
        print("\n[1/7] Seeding Indian Cities...")
        city_id_map = {}
        for name, country, cost_idx, pop, img in CITIES:
            cid = uid(f"city:{name}:{country}")
            city_id_map[name] = cid
            conn.execute(text("""
                INSERT INTO cities (id, name, country, cost_index, popularity_score, image_url)
                VALUES (:id, :name, :country, :cost_index, :popularity_score, :image_url)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    country = EXCLUDED.country,
                    cost_index = EXCLUDED.cost_index,
                    popularity_score = EXCLUDED.popularity_score,
                    image_url = EXCLUDED.image_url
            """), dict(id=cid, name=name, country=country, cost_index=cost_idx,
                       popularity_score=pop, image_url=img))
        print(f"  ✓ {len(CITIES)} Indian cities seeded")

        # ── 2. Activities ────────────────────────────────────────────────────
        print("\n[2/7] Seeding Activities...")
        act_id_map = {}
        for city_name, act_name, cat, cost, dur, desc, img in ACTIVITIES:
            aid = uid(f"activity:{city_name}:{act_name}")
            act_id_map[(city_name, act_name)] = aid
            cid = city_id_map[city_name]
            conn.execute(text("""
                INSERT INTO activities
                  (id, city_id, name, category, cost, duration_mins, description, image_url, popularity_score)
                VALUES (:id, :city_id, :name, :category, :cost, :duration_mins, :desc, :img, :pop)
                ON CONFLICT (id) DO UPDATE SET
                    city_id = EXCLUDED.city_id,
                    name = EXCLUDED.name,
                    category = EXCLUDED.category,
                    cost = EXCLUDED.cost,
                    duration_mins = EXCLUDED.duration_mins,
                    description = EXCLUDED.description,
                    image_url = EXCLUDED.image_url
            """), dict(id=aid, city_id=cid, name=act_name, category=cat, cost=cost,
                       duration_mins=dur, desc=desc, img=img, pop=85))
        print(f"  ✓ {len(ACTIVITIES)} activities seeded")

        # ── 3. Users ─────────────────────────────────────────────────────────
        print("\n[3/7] Seeding Demo Users...")
        demo_pw   = hash_pw("Demo@1234")
        admin_pw  = hash_pw("Admin@1234")
        demo_id   = uid("user:demo@globetrotter.com")
        admin_id  = uid("user:admin@globetrotter.com")

        conn.execute(text("""
            INSERT INTO users (id, first_name, last_name, email, password_hash,
                               phone_number, city, country, is_admin)
            VALUES (:id, :fn, :ln, :email, :ph, :phone, :city, :country, :admin)
            ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                city = EXCLUDED.city
        """), [
            dict(id=demo_id,  fn="Aarav", ln="Sharma", email="demo@globetrotter.com",
                 ph=demo_pw,  phone="+91-9876543210", city="Ahmedabad", country="India", admin=False),
            dict(id=admin_id, fn="Admin", ln="GlobeTrotter", email="admin@globetrotter.com",
                 ph=admin_pw, phone="+91-9876500000", city="Mumbai", country="India", admin=True),
        ])
        print("  ✓ 2 demo users (demo@globetrotter.com / Demo@1234, admin@globetrotter.com / Admin@1234)")

        # ── 4. Trips ─────────────────────────────────────────────────────────
        print("\n[4/7] Seeding Demo Trips...")
        trip_up_id   = uid("trip:upcoming:royal-rajasthan")
        trip_on_id   = uid("trip:ongoing:goa-beach")
        trip_done_id = uid("trip:completed:himachal-manali")

        trips = [
            dict(id=trip_up_id,   user_id=demo_id, name="Royal Rajasthan Expedition",
                 start_date=fd(15), end_date=fd(22), status="upcoming",
                 description="7-day heritage journey covering Jaipur (Pink City) and Udaipur (City of Lakes).",
                 cover_photo_url="https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200"),
            dict(id=trip_on_id,   user_id=demo_id, name="Goa Sunshine & Watersports",
                 start_date=fd(-1), end_date=fd(3),  status="ongoing",
                 description="Quick coastal break with water adventures and seafood shacks.",
                 cover_photo_url="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200"),
            dict(id=trip_done_id, user_id=demo_id, name="Himalayan Manali Getaway",
                 start_date=fd(-30), end_date=fd(-24), status="completed",
                 description="Serene escape in the mountains with valley treks and cafe hopping.",
                 cover_photo_url="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200"),
        ]
        for t in trips:
            conn.execute(text("""
                INSERT INTO trips (id, user_id, name, start_date, end_date,
                                   description, cover_photo_url, status)
                VALUES (:id, :user_id, :name, :start_date, :end_date,
                        :description, :cover_photo_url, :status)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    start_date = EXCLUDED.start_date,
                    end_date = EXCLUDED.end_date,
                    status = EXCLUDED.status
            """), t)
        print("  ✓ 3 demo trips (Upcoming, Ongoing, Completed)")

        # ── 5. Sections ──────────────────────────────────────────────────────
        print("\n[5/7] Seeding Trip Sections...")
        sec_jaipur_id  = uid("section:jaipur:trip-upcoming")
        sec_udaipur_id = uid("section:udaipur:trip-upcoming")
        sec_goa_id     = uid("section:goa:trip-ongoing")
        sec_manali_id  = uid("section:manali:trip-completed")

        sections = [
            dict(id=sec_jaipur_id, trip_id=trip_up_id, city_id=city_id_map["Jaipur"],
                 title="Jaipur — Palaces & Forts",
                 description="Explore the Pink City, Amber Fort, and traditional bazaars.",
                 start_date=fd(15), end_date=fd(18), budget=15000.00, order_index=1),
            dict(id=sec_udaipur_id, trip_id=trip_up_id, city_id=city_id_map["Udaipur"],
                 title="Udaipur — Romantic Lakes",
                 description="Lakeside palaces, sunset cruises, and royal dining.",
                 start_date=fd(19), end_date=fd(22), budget=22000.00, order_index=2),
            dict(id=sec_goa_id, trip_id=trip_on_id, city_id=city_id_map["Goa"],
                 title="Goa — Beaches & Shacks",
                 description="Water sports and beachside relaxation.",
                 start_date=fd(-1), end_date=fd(3), budget=12000.00, order_index=1),
            dict(id=sec_manali_id, trip_id=trip_done_id, city_id=city_id_map["Manali"],
                 title="Manali — Alpine Serenity",
                 description="Valley views and pine forest walks.",
                 start_date=fd(-30), end_date=fd(-24), budget=18000.00, order_index=1),
        ]
        for s in sections:
            conn.execute(text("""
                INSERT INTO sections (id, trip_id, city_id, title, description,
                                      start_date, end_date, budget, order_index)
                VALUES (:id, :trip_id, :city_id, :title, :description,
                        :start_date, :end_date, :budget, :order_index)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    start_date = EXCLUDED.start_date,
                    end_date = EXCLUDED.end_date,
                    budget = EXCLUDED.budget,
                    order_index = EXCLUDED.order_index
            """), s)
        print("  ✓ 4 sections seeded")

        # ── 6. Section Activities ────────────────────────────────────────────
        print("\n[6/7] Seeding Section Activities...")

        def sa(city, act, section_id, sdate, stime, override=None, notes=None):
            return dict(
                id         = uid(f"sa:{city}:{act}:{sdate}"),
                section_id = section_id,
                activity_id= act_id_map[(city, act)],
                scheduled_date = sdate,
                scheduled_time = stime,
                cost_override  = override,
                notes          = notes,
            )

        sa_rows = [
            # Jaipur Day 1
            sa("Jaipur", "Amber Fort & Palace Tour",        sec_jaipur_id, fd(15), time(9,30)),
            sa("Jaipur", "Hawa Mahal & Old Bazaar",         sec_jaipur_id, fd(15), time(15,0)),
            # Jaipur Day 2
            sa("Jaipur", "Block Printing Workshop",         sec_jaipur_id, fd(16), time(11,0)),
            sa("Jaipur", "Nahargarh Fort Sunset View",      sec_jaipur_id, fd(16), time(17,30)),
            # Jaipur Day 3
            sa("Jaipur", "Rajasthani Thali Dining",         sec_jaipur_id, fd(17), time(13,0), override=450.0, notes="Group discount applied"),

            # Udaipur Day 1
            sa("Udaipur", "City Palace Grand Tour",         sec_udaipur_id, fd(19), time(10,0)),
            sa("Udaipur", "Lake Pichola Sunset Boat Cruise", sec_udaipur_id, fd(19), time(17,0)),
            # Udaipur Day 2
            sa("Udaipur", "Saheliyon Ki Bari Gardens",      sec_udaipur_id, fd(20), time(10,30)),
            sa("Udaipur", "Bagore Ki Haveli Folk Dance",    sec_udaipur_id, fd(20), time(19,0)),
            # Udaipur Day 3
            sa("Udaipur", "Rooftop Candlelight Dinner",     sec_udaipur_id, fd(21), time(20,0)),
        ]

        for row in sa_rows:
            conn.execute(text("""
                INSERT INTO section_activities
                  (id, section_id, activity_id, scheduled_date, scheduled_time,
                   cost_override, notes)
                VALUES (:id, :section_id, :activity_id, :scheduled_date, :scheduled_time,
                        :cost_override, :notes)
                ON CONFLICT (id) DO UPDATE SET
                    scheduled_date = EXCLUDED.scheduled_date,
                    scheduled_time = EXCLUDED.scheduled_time,
                    cost_override = EXCLUDED.cost_override,
                    notes = EXCLUDED.notes
            """), row)
        print(f"  ✓ {len(sa_rows)} section_activities scheduled")

        # ── 7. Expenses ──────────────────────────────────────────────────────
        print("\n[7/7] Seeding Expenses...")
        expenses = [
            # Rajasthan Trip: Jaipur Section
            dict(id=uid("exp:jaipur:train"),   trip_id=trip_up_id, section_id=sec_jaipur_id,
                 category="transport", amount=1450.00, note="Vande Bharat Express Train Tickets"),
            dict(id=uid("exp:jaipur:hotel"),   trip_id=trip_up_id, section_id=sec_jaipur_id,
                 category="stay",      amount=7500.00, note="3 Nights Heritage Haveli Stay"),
            dict(id=uid("exp:jaipur:meals"),   trip_id=trip_up_id, section_id=sec_jaipur_id,
                 category="meals",     amount=2800.00, note="Cafe & Street Food Expenses"),
            # Rajasthan Trip: Udaipur Section
            dict(id=uid("exp:udaipur:cab"),    trip_id=trip_up_id, section_id=sec_udaipur_id,
                 category="transport", amount=3200.00, note="Private Taxi Jaipur to Udaipur"),
            dict(id=uid("exp:udaipur:hotel"),  trip_id=trip_up_id, section_id=sec_udaipur_id,
                 category="stay",      amount=11500.00, note="3 Nights Lake View Boutique Hotel"),
            dict(id=uid("exp:udaipur:meals"),  trip_id=trip_up_id, section_id=sec_udaipur_id,
                 category="meals",     amount=4000.00,  note="Dining & Lake Cafes"),
            # Rajasthan Trip: General Trip Level Expense
            dict(id=uid("exp:rajasthan:souvenir"), trip_id=trip_up_id, section_id=None,
                 category="activity",  amount=2500.00, note="Local Handicrafts & Souvenirs"),

            # Ongoing Goa Trip
            dict(id=uid("exp:goa:flight"),     trip_id=trip_on_id, section_id=sec_goa_id,
                 category="transport", amount=5500.00, note="Round-trip Flight Tickets"),
            dict(id=uid("exp:goa:resort"),     trip_id=trip_on_id, section_id=sec_goa_id,
                 category="stay",      amount=6000.00, note="Beach Resort 4 Nights"),

            # Completed Manali Trip
            dict(id=uid("exp:manali:volvo"),   trip_id=trip_done_id, section_id=sec_manali_id,
                 category="transport", amount=3000.00, note="Volvo Bus Delhi <-> Manali"),
            dict(id=uid("exp:manali:hotel"),   trip_id=trip_done_id, section_id=sec_manali_id,
                 category="stay",      amount=9500.00, note="Riverside Cottage 6 Nights"),
        ]
        for e in expenses:
            conn.execute(text("""
                INSERT INTO expenses (id, trip_id, section_id, category, amount, note)
                VALUES (:id, :trip_id, :section_id, :category, :amount, :note)
                ON CONFLICT (id) DO UPDATE SET
                    amount = EXCLUDED.amount,
                    note = EXCLUDED.note
            """), e)
        print(f"  ✓ {len(expenses)} expenses seeded")

        print("\n" + "="*50)
        print("✅ Database successfully seeded!")
        print("   Demo Login:  demo@globetrotter.com  /  Demo@1234")
        print("   Admin Login: admin@globetrotter.com /  Admin@1234")
        print("="*50 + "\n")

if __name__ == "__main__":
    run()
