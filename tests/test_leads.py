import pytest


@pytest.mark.asyncio
async def test_create_lead_with_valid_data(client):
    payload = {
        "name": "Иван",
        "phone": "+7 999 111-22-33",
        "question": "Сколько стоит лендинг?",
        "consent": True,
    }
    response = await client.post("/api/leads", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Иван"
    assert body["phone"] == "+7 999 111-22-33"
    assert body["id"] is not None


@pytest.mark.asyncio
async def test_create_lead_without_name_fails(client):
    payload = {"name": "  ", "phone": "+79991112233", "consent": True}
    response = await client.post("/api/leads", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_lead_with_short_phone_fails(client):
    payload = {"name": "Иван", "phone": "12345", "consent": True}
    response = await client.post("/api/leads", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_lead_without_consent_fails(client):
    payload = {"name": "Иван", "phone": "+79991112233", "consent": False}
    response = await client.post("/api/leads", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_lead_not_created_on_validation_error(client, db_session):
    payload = {"name": "", "phone": "123", "consent": False}
    await client.post("/api/leads", json=payload)

    from sqlalchemy import select
    from app.models import Lead

    async with db_session() as session:
        result = await session.execute(select(Lead))
        assert result.scalars().all() == []
