import datetime as dt
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Category, CompanyContact, Faq, Portfolio, Service
from app.schemas import CategoryOut, CompanyContactOut, FaqOut, PortfolioOut, ServiceOut

router = APIRouter(prefix="/api", tags=["catalog"])


@router.get("/contacts", response_model=CompanyContactOut)
async def get_contacts(db: AsyncSession = Depends(get_db)) -> CompanyContact:
    result = await db.execute(select(CompanyContact).order_by(CompanyContact.id.asc()).limit(1))
    contact = result.scalar_one_or_none()
    if contact is None:
        contact = CompanyContact()
    return contact


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


@router.get("/price.yml")
async def get_yml_price(request: Request, db: AsyncSession = Depends(get_db)) -> Response:
    """Генерация YML прайс-листа для 2ГИС из базы данных."""
    cats_res = await db.execute(select(Category).order_by(Category.sort_order, Category.id))
    categories = list(cats_res.scalars().all())

    serv_res = await db.execute(
        select(Service)
        .options(selectinload(Service.categories))
        .order_by(Service.sort_order, Service.id)
    )
    services = list(serv_res.scalars().unique().all())

    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or ""
    proto = request.headers.get("x-forwarded-proto") or "https"
    if not host or host.startswith("127.0.0.1") or host.startswith("localhost"):
        base_url = "https://velcode.ru"
    else:
        base_url = f"{proto}://{host}".rstrip("/")
    now_str = dt.datetime.now().strftime("%Y-%m-%d %H:%M")

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<yml_catalog date="{now_str}">',
        "  <shop>",
        "    <name>Velcode</name>",
        "    <company>Velcode</company>",
        f"    <url>{escape(base_url)}</url>",
        "    <currencies>",
        '      <currency id="RUR" rate="1"/>',
        "    </currencies>",
        "    <categories>",
    ]

    if categories:
        for cat in categories:
            lines.append(f'      <category id="{cat.id}">{escape(cat.name)}</category>')
    else:
        lines.append('      <category id="1">Услуги</category>')

    lines.append("    </categories>")
    lines.append("    <offers>")

    for srv in services:
        if srv.price_discount is not None and srv.price_discount < srv.price_full:
            price = srv.price_discount
            old_price = srv.price_full
        else:
            price = srv.price_full
            old_price = None

        cat_id = srv.categories[0].id if srv.categories else (categories[0].id if categories else 1)

        lines.append(f'      <offer id="{srv.id}" available="true">')
        lines.append(f"        <name>{escape(srv.title)}</name>")
        lines.append(f"        <url>{escape(base_url)}/services</url>")
        lines.append(f"        <price>{price}</price>")
        if old_price is not None:
            lines.append(f"        <oldprice>{old_price}</oldprice>")
        lines.append("        <currencyId>RUR</currencyId>")
        lines.append(f"        <categoryId>{cat_id}</categoryId>")
        if srv.description:
            lines.append(f"        <description>{escape(srv.description)}</description>")
        lines.append("      </offer>")

    lines.extend([
        "    </offers>",
        "  </shop>",
        "</yml_catalog>",
    ])

    xml_content = "\n".join(lines)
    return Response(content=xml_content, media_type="application/xml; charset=utf-8")
