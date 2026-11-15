"""Скрипт динамической сборки базы знаний для ИИ строго из базы данных (услуги и портфолио).

Никаких фиктивных данных и заглушек — только то, что реально сохранено в БД.
Сохраняет артефакты в knowledge_base/:
  - knowledge_base.json  — структурированные чанки услуг и проектов для RAG / векторных баз
  - knowledge_base.md    — сводный Markdown по услугам и проектам
  - site_catalog.json    — валидные ссылки страниц и проектов для проверки ответов модели

Запуск:
    python -m scripts.build_knowledge_base
"""

from __future__ import annotations

import argparse
import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal, init_models
from app.models import Category, Portfolio, Service


async def extract_knowledge_data() -> dict[str, Any]:
    """Извлекает из базы данных только услуги и проекты портфолио."""
    await init_models()

    async with AsyncSessionLocal() as db:
        # 1. Извлекаем услуги с подгрузкой категорий
        services_stmt = (
            select(Service)
            .options(selectinload(Service.categories))
            .order_by(Service.sort_order.asc(), Service.id.asc())
        )
        services_res = await db.execute(services_stmt)
        services = services_res.scalars().all()

        # 2. Извлекаем кейсы портфолио с тегами
        portfolio_stmt = (
            select(Portfolio)
            .options(selectinload(Portfolio.tags_list))
            .order_by(Portfolio.sort_order.asc(), Portfolio.id.asc())
        )
        portfolio_res = await db.execute(portfolio_stmt)
        projects = portfolio_res.scalars().all()

    return {
        "services": services,
        "projects": projects,
    }


def build_chunks(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Формирует массив смысловых чанков строго по услугам и портфолио из БД."""
    chunks: list[dict[str, Any]] = []

    # 1. Услуги из БД
    for s in data["services"]:
        cat_names = [c.name for c in s.categories] if s.categories else []
        cat_line = f"Категория: {', '.join(cat_names)}\n" if cat_names else ""
        price_val = s.price_discount or s.price_full
        price_line = f"Стоимость: от {price_val:,} ₽ {s.unit}\n".replace(",", " ") if price_val else ""
        desc_line = f"Описание: {s.description.strip()}\n" if s.description else ""

        chunk_text = (
            f"Услуга: {s.title}\n"
            f"{cat_line}"
            f"{price_line}"
            f"{desc_line}"
            f"Ссылка: /services"
        ).strip()

        chunks.append({
            "id": f"service_{s.id}",
            "category": "service",
            "title": s.title,
            "url": "/services",
            "content": chunk_text,
            "metadata": {
                "type": "service",
                "service_id": s.id,
                "url": "/services",
                "categories": cat_names,
                "price": price_val,
                "unit": s.unit,
            },
        })

    # 2. Кейсы портфолио из БД
    for p in data["projects"]:
        slug = p.slug or f"project-{p.id}"
        project_url = f"/portfolio/{slug}"

        tags_str = p.tags or ", ".join(t.name for t in p.tags_list) or ""
        tags_line = f"Теги: {tags_str}\n" if tags_str else ""
        desc_line = f"Описание: {p.description.strip()}\n" if p.description else ""
        what_done = f"Что было сделано: {p.what_was_done.strip()}\n" if p.what_was_done else ""
        site_line = f"Внешний сайт: {p.site_url.strip()}\n" if p.site_url else ""

        chunk_text = (
            f"Кейс / Проект: {p.title}\n"
            f"Ссылка: {project_url}\n"
            f"{tags_line}"
            f"{desc_line}"
            f"{what_done}"
            f"{site_line}"
        ).strip()

        chunks.append({
            "id": f"portfolio_{slug}",
            "category": "portfolio",
            "title": p.title,
            "url": project_url,
            "content": chunk_text,
            "metadata": {
                "type": "portfolio",
                "portfolio_id": p.id,
                "slug": slug,
                "url": project_url,
                "tags": [t.strip() for t in tags_str.split(",") if t.strip()] if tags_str else [],
            },
        })

    return chunks


def build_markdown_document(chunks: list[dict[str, Any]]) -> str:
    """Генерирует Markdown-документ только из услуг и кейсов БД."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines = [
        "# База знаний Велкод (Услуги и Портфолио)",
        f"> Дата генерации: {now}",
        "> Источник: база данных проекта",
        "",
        "---",
        "",
        "## Услуги",
        "",
    ]

    services = [c for c in chunks if c["category"] == "service"]
    if services:
        for s in services:
            lines.append(f"### {s['title']}")
            lines.append(s["content"])
            lines.append("")
    else:
        lines.append("_Услуги в базе данных не найдены._\n")

    lines.extend([
        "---",
        "",
        "## Портфолио",
        "",
    ])

    projects = [c for c in chunks if c["category"] == "portfolio"]
    if projects:
        for p in projects:
            lines.append(f"### {p['title']}")
            lines.append(p["content"])
            lines.append("")
    else:
        lines.append("_Кейсы в базе данных не найдены._\n")

    return "\n".join(lines)


def build_site_catalog(chunks: list[dict[str, Any]]) -> dict[str, Any]:
    """Реестр всех страниц услуг и проектов для валидатора ссылок."""
    portfolio_routes: dict[str, str] = {}
    for ch in chunks:
        if ch["category"] == "portfolio":
            portfolio_routes[ch["title"]] = ch["url"]

    valid_urls = list(set(["/services", "/portfolio"] + list(portfolio_routes.values())))

    return {
        "routes": {
            "услуги": "/services",
            "портфолио": "/portfolio",
        },
        "portfolio_projects": portfolio_routes,
        "valid_urls": valid_urls,
    }


async def rebuild_knowledge_base(
    out_dir: str = "knowledge_base",
    output_format: str = "all",
) -> dict[str, Any]:
    """Пересобирает базу знаний строго из БД."""
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    data = await extract_knowledge_data()
    chunks = build_chunks(data)

    if output_format in ("all", "json"):
        json_file = out_path / "knowledge_base.json"
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "total_chunks": len(chunks),
                    "chunks": chunks,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )

        catalog_file = out_path / "site_catalog.json"
        with open(catalog_file, "w", encoding="utf-8") as f:
            json.dump(build_site_catalog(chunks), f, ensure_ascii=False, indent=2)

    if output_format in ("all", "md"):
        md_file = out_path / "knowledge_base.md"
        md_content = build_markdown_document(chunks)
        with open(md_file, "w", encoding="utf-8") as f:
            f.write(md_content)

    return {
        "services_count": len(data["services"]),
        "projects_count": len(data["projects"]),
        "total_chunks": len(chunks),
    }


def trigger_knowledge_base_rebuild() -> None:
    """Универсальный триггер для вызова из событий SQLAlchemy или хуков админки."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(rebuild_knowledge_base())
    except RuntimeError:
        asyncio.run(rebuild_knowledge_base())


async def main() -> None:
    parser = argparse.ArgumentParser(description="Сборка базы знаний для ИИ из базы данных Velcode")
    parser.add_argument("--out-dir", default="knowledge_base", help="Папка для выгрузки")
    parser.add_argument("--format", choices=["all", "json", "md"], default="all", help="Формат выгрузки")
    args = parser.parse_args()

    print("=" * 60)
    print("🚀 Сборка базы знаний ИИ строго из базы данных (услуги + портфолио)...")
    print("=" * 60)

    res = await rebuild_knowledge_base(out_dir=args.out_dir, output_format=args.format)

    print(f"✓ Извлечено услуг: {res['services_count']}")
    print(f"✓ Извлечено кейсов портфолио: {res['projects_count']}")
    print(f"✓ Сформировано смысловых чанков: {res['total_chunks']}")
    print(f"💾 Файлы сохранены в: {args.out_dir}")
    print("=" * 60)
    print("🎉 База знаний успешно обновлена!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
