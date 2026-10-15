from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Category, Faq, Portfolio, Service
from app.schemas import CategoryOut, FaqOut, PortfolioOut, ServiceOut

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


@router.get("/portfolio", response_model=list[PortfolioOut])
async def list_portfolio(main: bool = False, db: AsyncSession = Depends(get_db)) -> list[Portfolio]:
    query = select(Portfolio)
    if main:
        query = query.where(Portfolio.show_on_main == True)
    query = query.order_by(Portfolio.sort_order, Portfolio.id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/portfolio/{slug}", response_model=PortfolioOut)
async def get_portfolio_item(slug: str, db: AsyncSession = Depends(get_db)) -> Portfolio:
    from fastapi import HTTPException
    result = await db.execute(select(Portfolio).where(Portfolio.slug == slug))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return item
