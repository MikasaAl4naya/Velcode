import pytest

from app.models import Category, Service


@pytest.mark.asyncio
async def test_service_can_belong_to_multiple_categories(client, db_session):
    async with db_session() as session:
        cat_pod_kluch = Category(name="Под ключ", sort_order=0)
        cat_web = Category(name="Веб-разработка и сервисы", sort_order=2)
        service = Service(
            title="Разработка сайта под ключ",
            description="",
            price_full=36000,
            price_discount=30000,
            unit="проект",
            sort_order=1,
        )
        service.categories = [cat_web, cat_pod_kluch]
        session.add_all([cat_pod_kluch, cat_web, service])
        await session.commit()

    response = await client.get("/api/services")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert {c["name"] for c in body[0]["categories"]} == {
        "Под ключ",
        "Веб-разработка и сервисы",
    }


@pytest.mark.asyncio
async def test_filter_services_by_category(client, db_session):
    async with db_session() as session:
        cat_a = Category(name="A", sort_order=1)
        cat_b = Category(name="B", sort_order=2)
        s1 = Service(title="S1", price_full=1000, unit="час", sort_order=1)
        s1.categories = [cat_a]
        s2 = Service(title="S2", price_full=2000, unit="час", sort_order=2)
        s2.categories = [cat_b]
        session.add_all([cat_a, cat_b, s1, s2])
        await session.commit()
        cat_a_id = cat_a.id

    response = await client.get(f"/api/services?category_id={cat_a_id}")
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "S1"
