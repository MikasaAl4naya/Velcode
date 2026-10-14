"""Заполняет таблицу portfolio начальными данными.

Запуск: python -m scripts.seed_portfolio
"""

import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Portfolio

CASES = [
    {
        "slug": "trattoria",
        "title": "Сайт-визитка для рестобара Trattoria Pomodoro",
        "description": (
            "Комплексный веб-сайт для рестобара «Trattoria». Главные задачи — передать уникальную "
            "атмосферу заведения в цифровой среде, упростить пользовательский путь "
            "«выбор меню → бронирование столика» и сократить потери от быстрых заявок-бронирований."
        ),
        "image_url": "/assets/case-trattoria.png",
        "site_url": "trattoria.ru/",
        "tags": "Концепт,Веб-дизайн",
        "sort_order": 1,
    },
    {
        "slug": "sport-shop",
        "title": "Сайт для магазина спорт-товаров",
        "description": (
            "Интернет-магазин спортивных товаров с каталогом, корзиной и интеграцией "
            "с 1С для синхронизации остатков в реальном времени."
        ),
        "image_url": "/assets/case-sport.png",
        "site_url": "velcode.ru/",
        "tags": "Веб-дизайн,Интернет-магазин",
        "sort_order": 2,
    },
    {
        "slug": "bitrix-1c",
        "title": "Модуль интеграции Битрикс24 и 1С:Предприятие",
        "description": (
            "Разработка модуля двусторонней синхронизации между Битрикс24 CRM и "
            "1С:Предприятие: обмен заказами, остатками, клиентской базой."
        ),
        "image_url": "/assets/case-bitrix.png",
        "site_url": "velcode.ru/",
        "tags": "Интеграции с 1С и Битрикс24",
        "sort_order": 3,
    },
]


async def main() -> None:
    async with AsyncSessionLocal() as session:
        for data in CASES:
            existing = await session.execute(
                select(Portfolio).where(Portfolio.slug == data["slug"])
            )
            if existing.scalar_one_or_none() is not None:
                print(f"  уже есть: {data['slug']}")
                continue
            session.add(Portfolio(**data))
            print(f"  добавлен: {data['slug']}")
        await session.commit()
    print("Готово.")


if __name__ == "__main__":
    asyncio.run(main())
