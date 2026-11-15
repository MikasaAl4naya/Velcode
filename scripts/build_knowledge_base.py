"""Скрипт динамической сборки базы знаний для ИИ строго из базы данных (услуги и портфолио).

- Чанки для RAG/LLM собираются напрямую из таблиц services и portfolio базы данных.
- Реестр ссылок для валидатора (site_catalog.json) тянется напрямую из живого sitemap.xml.

Сохраняет артефакты в knowledge_base/:
  - knowledge_base.json  — структурированные чанки услуг и проектов для RAG / векторных баз
  - knowledge_base.md    — сводный Markdown по услугам и проектам
  - site_catalog.json    — валидные ссылки сайта из sitemap.xml для проверки ответов модели

Запуск:
    python -m scripts.build_knowledge_base
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal, init_models
from app.models import Category, CompanyContact, Faq, Portfolio, Service


async def extract_knowledge_data() -> dict[str, Any]:
    """Извлекает из базы данных услуги, проекты портфолио и FAQ."""
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

        # 3. Извлекаем вопросы-ответы FAQ
        faq_stmt = (
            select(Faq)
            .order_by(Faq.sort_order.asc(), Faq.id.asc())
        )
        faq_res = await db.execute(faq_stmt)
        faqs = faq_res.scalars().all()

        # 4. Извлекаем контакты компании (если нет, создаём дефолтную запись)
        contacts_stmt = select(CompanyContact).order_by(CompanyContact.id.asc()).limit(1)
        contacts_res = await db.execute(contacts_stmt)
        contact = contacts_res.scalars().first()
        if not contact:
            contact = CompanyContact(
                legal_entity="ИП Манилат Виктория Пхетудоновна, ИНН: 381914585931, ОГРНИП: 326385000117097",
                phone="+7 (924) 534 51 82",
                messengers="Telegram: https://t.me/VelcodeIRK (@VelcodeIRK)",
                email="velcode@inbox.ru",
            )
            db.add(contact)
            await db.commit()
            await db.refresh(contact)

    return {
        "services": services,
        "projects": projects,
        "faqs": faqs,
        "contact": contact,
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

    # 3. Контакты и реквизиты компании из БД
    contact = data.get("contact")
    if contact:
        phone = contact.phone.strip() if contact.phone else ""
        email = contact.email.strip() if contact.email else ""
        messengers = contact.messengers.strip() if contact.messengers else ""
        legal = contact.legal_entity.strip() if contact.legal_entity else ""
    else:
        phone = "+7 (924) 534 51 82"
        email = "velcode@inbox.ru"
        messengers = "Telegram: https://t.me/VelcodeIRK (@VelcodeIRK)"
        legal = "ИП Манилат Виктория Пхетудоновна, ИНН: 381914585931, ОГРНИП: 326385000117097"

    lines = ["Контакты и реквизиты компании Велкод:"]
    if phone:
        lines.append(f"Телефон: {phone}")
    if email:
        lines.append(f"Email: {email}")
    if messengers:
        lines.append(f"Мессенджеры: {messengers}")
    if legal:
        lines.append(f"Реквизиты: {legal}")
    lines.append("Ссылка: /contacts")

    contacts_text = "\n".join(lines).strip()

    chunks.append({
        "id": "company_contacts",
        "category": "contacts",
        "title": "Контакты и реквизиты Велкод",
        "url": "/contacts",
        "content": contacts_text,
        "metadata": {
            "type": "contacts",
            "url": "/contacts",
            "phone": phone,
            "email": email,
            "messengers": messengers,
            "legal_entity": legal,
        },
    })

    # 4. Частые вопросы и ответы (FAQ) из БД
    for f in data.get("faqs", []):
        faq_text = (
            f"Вопрос: {f.question.strip()}\n"
            f"Ответ: {f.answer.strip()}\n"
            f"Ссылка: /faq"
        ).strip()

        chunks.append({
            "id": f"faq_{f.id}",
            "category": "faq",
            "title": f.question.strip(),
            "url": "/faq",
            "content": faq_text,
            "metadata": {
                "type": "faq",
                "faq_id": f.id,
                "sort_order": f.sort_order,
                "url": "/faq",
            },
        })

    return chunks


def build_markdown_document(chunks: list[dict[str, Any]]) -> str:
    """Генерирует сводный Markdown-документ (услуги, портфолио, контакты, FAQ)."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines = [
        "# База знаний Велкод",
        f"> Дата генерации: {now}",
        "> Источник: база данных проекта и sitemap.xml",
        "",
        "---",
        "",
        "## Контакты и реквизиты",
        "",
    ]

    contacts = [c for c in chunks if c["category"] == "contacts"]
    if contacts:
        for c in contacts:
            lines.append(c["content"])
            lines.append("")
    else:
        lines.append("_Контакты не найдены._\n")

    lines.extend([
        "---",
        "",
        "## Услуги",
        "",
    ])

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

    lines.extend([
        "---",
        "",
        "## Частые вопросы (FAQ)",
        "",
    ])

    faqs = [c for c in chunks if c["category"] == "faq"]
    if faqs:
        for idx, f in enumerate(faqs, start=1):
            lines.append(f"### {idx}. {f['title']}")
            lines.append(f["content"])
            lines.append("")
    else:
        lines.append("_Вопросы FAQ в базе данных не найдены._\n")

    return "\n".join(lines)


async def fetch_sitemap_urls(
    sitemap_url: str = "http://127.0.0.1:3000/sitemap.xml",
) -> list[str]:
    """Запрашивает живой sitemap.xml у Next.js и вытаскивает все валидные пути сайта."""
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(sitemap_url)
            if resp.status_code == 200:
                raw_locs = re.findall(r"<loc>([^<]+)</loc>", resp.text)
                paths = []
                for loc in raw_locs:
                    parsed = urlparse(loc.strip())
                    path = parsed.path or "/"
                    if path not in paths:
                        paths.append(path)
                if paths:
                    return paths
    except Exception as e:
        print(f"  [Sitemap] Не удалось получить sitemap.xml с {sitemap_url}: {e}")
    return []


def build_site_catalog(
    chunks: list[dict[str, Any]],
    sitemap_paths: list[str] | None = None,
) -> dict[str, Any]:
    """Реестр всех валидных ссылок на основе живого sitemap.xml."""
    portfolio_routes: dict[str, str] = {}
    for ch in chunks:
        if ch["category"] == "portfolio":
            portfolio_routes[ch["title"]] = ch["url"]

    base_paths = sitemap_paths if sitemap_paths else ["/", "/services", "/portfolio"]
    valid_urls = sorted(list(set(base_paths + list(portfolio_routes.values()))))

    return {
        "source": "sitemap.xml" if sitemap_paths else "database_fallback",
        "portfolio_projects": portfolio_routes,
        "valid_urls": valid_urls,
    }


async def rebuild_knowledge_base(
    out_dir: str = "knowledge_base",
    output_format: str = "all",
) -> dict[str, Any]:
    """Пересобирает базу знаний (услуги и портфолио из БД, ссылки из sitemap.xml)."""
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

        # Вытаскиваем ссылки напрямую из sitemap.xml
        sitemap_paths = await fetch_sitemap_urls()
        catalog_file = out_path / "site_catalog.json"
        with open(catalog_file, "w", encoding="utf-8") as f:
            json.dump(
                build_site_catalog(chunks, sitemap_paths),
                f,
                ensure_ascii=False,
                indent=2,
            )

    if output_format in ("all", "md"):
        md_file = out_path / "knowledge_base.md"
        md_content = build_markdown_document(chunks)
        with open(md_file, "w", encoding="utf-8") as f:
            f.write(md_content)

    # Принудительно инвалидируем кэш в сервисе ИИ, чтобы он сразу подхватил новые чанки без перезапуска
    try:
        from app.services.ai_chat import ai_chat_service
        ai_chat_service.reload_kb()
    except Exception as e:
        print(f"  [AI] Не удалось сбросить in-memory кэш ai_chat_service: {e}")

    return {
        "services_count": len(data["services"]),
        "projects_count": len(data["projects"]),
        "faqs_count": len(data.get("faqs", [])),
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
    print("🚀 Сборка базы знаний ИИ (БД + sitemap.xml)...")
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
