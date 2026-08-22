from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import date
from decimal import Decimal
from collections import defaultdict

from backend.models.trip import Trip
from backend.models.section import Section
from backend.models.section_activity import SectionActivity
from backend.models.expense import Expense
from backend.schemas.trip import TripBudgetRead, BudgetCategoryBreakdown, DailyBudget, SectionBudgetBreakdown

async def get_trip_budget(db: AsyncSession, trip_id: UUID) -> TripBudgetRead:
    # 1. Fetch expenses
    expense_stmt = select(Expense).where(Expense.trip_id == trip_id)
    expense_res = await db.execute(expense_stmt)
    expenses = expense_res.scalars().all()
    
    # 2. Fetch sections with cities and activities
    sections_stmt = (
        select(Section)
        .options(
            selectinload(Section.city),
            selectinload(Section.activities).selectinload(SectionActivity.activity)
        )
        .where(Section.trip_id == trip_id)
        .order_by(Section.order_index)
    )
    sections_res = await db.execute(sections_stmt)
    sections = sections_res.scalars().all()

    total = Decimal("0.0")
    allocated_budget = Decimal("0.0")
    by_category = defaultdict(Decimal)
    by_day = defaultdict(Decimal)
    by_section_list = []

    # Process Sections & Activities
    for sec in sections:
        sec_budget = Decimal(str(sec.budget or 0))
        allocated_budget += sec_budget
        sec_spent = Decimal("0.0")
        act_count = len(sec.activities)

        for sa in sec.activities:
            cost = sa.cost_override
            if cost is None and sa.activity and sa.activity.cost is not None:
                cost = sa.activity.cost
            
            if cost:
                c_dec = Decimal(str(cost))
                total += c_dec
                sec_spent += c_dec
                cat = (sa.activity.category if sa.activity else "activity") or "activity"
                by_category[cat] += c_dec
                if sa.scheduled_date:
                    by_day[sa.scheduled_date] += c_dec

        by_section_list.append(
            SectionBudgetBreakdown(
                section_id=sec.id,
                title=sec.title or (sec.city.name if sec.city else "Leg"),
                city_name=sec.city.name if sec.city else None,
                budget=float(sec_budget),
                total_spent=float(sec_spent),
                activities_count=act_count
            )
        )
    
    # Process Standalone Expenses
    for exp in expenses:
        total += exp.amount
        cat = exp.category or "other"
        by_category[cat] += exp.amount
        # If expense belongs to a specific section, add it to section total
        if exp.section_id:
            for s_item in by_section_list:
                if s_item.section_id == exp.section_id:
                    s_item.total_spent += float(exp.amount)

    # Format category breakdown
    by_category_list = [
        BudgetCategoryBreakdown(category=k, total=float(v))
        for k, v in by_category.items()
    ]
    by_category_list.sort(key=lambda x: x.total, reverse=True)
    
    # Format daily breakdown
    by_day_list = [
        DailyBudget(date=k, total=float(v))
        for k, v in by_day.items()
    ]
    by_day_list.sort(key=lambda x: x.date)
    
    # Compute average daily
    trip_res = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip_obj = trip_res.scalars().first()
    
    days = 1
    if trip_obj and trip_obj.start_date and trip_obj.end_date:
        days = max((trip_obj.end_date - trip_obj.start_date).days + 1, 1)
        
    avg_daily = float(total) / days if days > 0 else 0.0

    return TripBudgetRead(
        trip_id=trip_id,
        total=float(total),
        allocated_budget=float(allocated_budget),
        by_category=by_category_list,
        by_day=by_day_list,
        by_section=by_section_list,
        average_daily=avg_daily
    )

