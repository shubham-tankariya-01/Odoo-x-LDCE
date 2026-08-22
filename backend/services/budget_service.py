from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import date
from decimal import Decimal
from collections import defaultdict

from backend.models.trip import Trip
from backend.models.section import Section
from backend.models.section_activity import SectionActivity
from backend.models.expense import Expense
from backend.schemas.trip import TripBudgetRead, BudgetCategoryBreakdown, DailyBudget

async def get_trip_budget(db: AsyncSession, trip_id: UUID) -> TripBudgetRead:
    # 1. Fetch expenses
    expense_stmt = select(Expense).where(Expense.trip_id == trip_id)
    expense_res = await db.execute(expense_stmt)
    expenses = expense_res.scalars().all()
    
    # 2. Fetch section activities to get costs
    sa_stmt = (
        select(SectionActivity, Section.start_date)
        .join(Section, Section.id == SectionActivity.section_id)
        .where(Section.trip_id == trip_id)
    )
    sa_res = await db.execute(sa_stmt)
    # Load activities separately to get base cost
    from sqlalchemy.orm import selectinload
    sa_full_stmt = (
        select(SectionActivity)
        .options(selectinload(SectionActivity.activity))
        .join(Section, Section.id == SectionActivity.section_id)
        .where(Section.trip_id == trip_id)
    )
    sa_full_res = await db.execute(sa_full_stmt)
    section_activities = sa_full_res.scalars().all()
    
    total = Decimal("0.0")
    by_category = defaultdict(Decimal)
    by_day = defaultdict(Decimal)
    
    # Process Expenses
    for exp in expenses:
        total += exp.amount
        cat = exp.category or "other"
        by_category[cat] += exp.amount
        # Note: expenses don't natively have a date in our schema unless linked via section
        # For this hackathon, we might not assign expenses to a specific day, or we can spread them
        # We will ignore date tracking for trip-level expenses, but that's a known constraint.
    
    # Process Activities
    for sa in section_activities:
        cost = sa.cost_override
        if cost is None and sa.activity and sa.activity.cost is not None:
            cost = sa.activity.cost
            
        if cost:
            total += cost
            cat = (sa.activity.category if sa.activity else "activity") or "activity"
            by_category[cat] += cost
            if sa.scheduled_date:
                by_day[sa.scheduled_date] += cost
                
    # Format output
    by_category_list = [
        BudgetCategoryBreakdown(category=k, total=float(v))
        for k, v in by_category.items()
    ]
    
    by_day_list = [
        DailyBudget(date=k, total=float(v))
        for k, v in by_day.items()
    ]
    by_day_list.sort(key=lambda x: x.date)
    
    # Compute average
    # A simple calculation: total / number of days in the trip, or number of days with activities
    trip = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip_obj = trip.scalars().first()
    
    days = 1
    if trip_obj and trip_obj.start_date and trip_obj.end_date:
        days = max((trip_obj.end_date - trip_obj.start_date).days + 1, 1)
        
    avg_daily = float(total) / days if days > 0 else 0.0

    return TripBudgetRead(
        trip_id=trip_id,
        total=float(total),
        by_category=by_category_list,
        by_day=by_day_list,
        average_daily=avg_daily
    )
