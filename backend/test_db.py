from sqlalchemy import select
from backend.database import SessionLocal
from backend.models.city import City
from backend.models.user import User

def test_db_connection():
    try:
        print("Connecting to the database...")
        with SessionLocal() as session:
            # Query Cities
            print("Querying cities...")
            result = session.execute(select(City).limit(5))
            cities = result.scalars().all()
            
            print(f"Found {len(cities)} cities:")
            for city in cities:
                print(f" - {city.name} ({city.country})")
                
            # Query Users
            print("\nQuerying users...")
            user_result = session.execute(select(User).limit(5))
            users = user_result.scalars().all()
            
            print(f"Found {len(users)} users:")
            for user in users:
                print(f" - {user.first_name} {user.last_name} ({user.email})")
                
        print("\nDatabase connection and queries successful!")
    except Exception as e:
        print(f"\nError querying database: {e}")

if __name__ == "__main__":
    test_db_connection()
