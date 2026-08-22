import asyncio
from sqlalchemy import select, func

from backend.database import SessionLocal

from backend.models.city import City
from backend.models.user import User
from backend.models.trip import Trip
from backend.models.activity import Activity
from backend.models.community_post import CommunityPost
from backend.models.expense import Expense
from backend.models.post_comment import PostComment
from backend.models.post_like import PostLike
from backend.models.section import Section
from backend.models.section_activity import SectionActivity


MODELS = [
    City,
    User,
    Trip,
    Activity,
    CommunityPost,
    Expense,
    PostComment,
    PostLike,
    Section,
    SectionActivity,
]


async def inspect_database():
    try:
        print("Connecting to the database...\n")

        async with SessionLocal() as session:

            for model in MODELS:
                table_name = model.__tablename__

                # Count rows
                count = await session.scalar(
                    select(func.count()).select_from(model)
                )

                print(f"{'=' * 50}")
                print(f"{table_name}: {count} rows")

                # Show first 5 rows
                result = await session.execute(
                    select(model).limit(5)
                )

                rows = result.scalars().all()

                if not rows:
                    print("  (empty)")
                    continue

                for row in rows:
                    print(f"  {row}")

        print(f"\n{'=' * 50}")
        print("Database inspection successful!")

    except Exception as e:
        print(f"\nError inspecting database: {e}")


if __name__ == "__main__":
    asyncio.run(inspect_database())