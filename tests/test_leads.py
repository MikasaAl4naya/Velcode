import time
import pytest
from sqlalchemy import select
from app.models import Lead


@pytest.mark.asyncio
async def test_create_lead_with_valid_data(client, db_session):
    payload = {
        "name": "Иван",
        "phone": "+7 999 111-22-33",
        "question": "Сколько стоит лендинг?",
        "consent": True,
        "website": "",
        "js_token": "front_js_passed",
        "form_opened_at": time.time() - 5.0,
    }
    response = await client.post("/api/v1/leads", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Иван"
    assert body["phone"] == "+7 999 111-22-33"
    assert body["id"] > 0

    async with db_session() as session:
        result = await session.execute(select(Lead).where(Lead.id == body["id"]))
        lead = result.scalar_one_or_none()
        assert lead is not None
        assert lead.name == "Иван"


@pytest.mark.asyncio
async def test_bot_with_website_honeypot_silently_dropped(client, db_session):
    """Бот заполнил скрытое поле website -> возвращаем 201 с id=0, в БД не пишем."""
    payload = {
        "name": "SpamBot",
        "phone": "+7 999 111-22-33",
        "question": "Купите ссылки",
        "consent": True,
        "website": "http://spam-link.com",
        "js_token": "front_js_passed",
        "form_opened_at": time.time() - 5.0,
    }
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 0

    async with db_session() as session:
        result = await session.execute(select(Lead).where(Lead.name == "SpamBot"))
        assert result.scalars().all() == []


@pytest.mark.asyncio
async def test_bot_without_js_token_silently_dropped(client, db_session):
    """Бот шлёт POST напрямую без фронтового js_token -> возвращаем 201, в БД не пишем."""
    payload = {
        "name": "DirectCurlBot",
        "phone": "+7 999 111-22-33",
        "question": "Спам",
        "consent": True,
    }
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 0

    async with db_session() as session:
        result = await session.execute(select(Lead).where(Lead.name == "DirectCurlBot"))
        assert result.scalars().all() == []


@pytest.mark.asyncio
async def test_bot_submitted_too_fast_silently_dropped(client, db_session):
    """Бот отправил форму моментально (< 3 сек) -> возвращаем 201, в БД не пишем."""
    payload = {
        "name": "FastBot",
        "phone": "+7 999 111-22-33",
        "consent": True,
        "website": "",
        "js_token": "front_js_passed",
        "form_opened_at": time.time() - 0.5,
    }
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 0

    async with db_session() as session:
        result = await session.execute(select(Lead).where(Lead.name == "FastBot"))
        assert result.scalars().all() == []


@pytest.mark.asyncio
async def test_create_lead_without_name_fails(client):
    payload = {"name": "  ", "phone": "+79991112233", "consent": True}
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_lead_with_short_phone_fails(client):
    payload = {"name": "Иван", "phone": "12345", "consent": True}
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_lead_without_consent_fails(client):
    payload = {"name": "Иван", "phone": "+79991112233", "consent": False}
    response = await client.post("/api/v1/leads", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_lead_not_created_on_validation_error(client, db_session):
    payload = {"name": "", "phone": "123", "consent": False}
    await client.post("/api/v1/leads", json=payload)

    async with db_session() as session:
        result = await session.execute(select(Lead))
        assert result.scalars().all() == []
