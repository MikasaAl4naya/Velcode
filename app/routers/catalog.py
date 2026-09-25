from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Category, Faq, Service
from app.schemas import CategoryOut, FaqOut, ServiceOut

router = APIRouter(prefix="/api", tags=["catalog"])


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[Category]:
    result = await db.execute(select(Category).order_by(Category.sort_order, Category.id))
    return list(result.scalars().all())


@router.get("/services", response_model=list[ServiceOut])
async def list_services(
    category_id: int | None = None, db: AsyncSession = Depends(get_db)
) -> list[Service]:
    query = select(Service).options(selectinload(Service.categories))
    if category_id is not None:
        query = query.join(Service.categories).where(Category.id == category_id)
    query = query.order_by(Service.sort_order, Service.id)
    result = await db.execute(query)
    return list(result.scalars().unique().all())


@router.get("/faq", response_model=list[FaqOut])
async def list_faq(db: AsyncSession = Depends(get_db)) -> list[Faq]:
    result = await db.execute(select(Faq).order_by(Faq.sort_order, Faq.id))
    return list(result.scalars().all())
