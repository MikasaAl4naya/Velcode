import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas import ChatResponse
from app.services.ai_chat import ai_chat_service


@pytest.mark.asyncio
async def test_fast_path_greetings():
    """Тест: приветствия перехватываются мгновенно без вызова нейросети."""
    for greeting in ["Привет", "Здравствуйте!", "Добрый день", "Приветствую", "hello"]:
        resp = await ai_chat_service.ask(message=greeting)
        assert isinstance(resp, ChatResponse)
        assert "Здравствуйте!" in resp.text
        assert resp.topic == "Консультация"
        assert resp.show_lead_form is False
        assert len(resp.actions or []) > 0
        assert resp.actions[0].actionKey == "show_lead_form"


@pytest.mark.asyncio
async def test_fast_path_gratitude():
    """Тест: благодарности перехватываются мгновенно без вызова нейросети."""
    for thanks in ["Спасибо", "Благодарю!", "спасибо большое", "спс"]:
        resp = await ai_chat_service.ask(message=thanks)
        assert isinstance(resp, ChatResponse)
        assert "Пожалуйста!" in resp.text
        assert resp.topic == "Консультация"


@pytest.mark.asyncio
async def test_fast_path_confirmations():
    """Тест: подтверждения и согласие («хорошо», «отлично») перехватываются мгновенно."""
    for confirm in ["Хорошо", "Отлично!", "Договорились", "супер", "понятно"]:
        resp = await ai_chat_service.ask(message=confirm)
        assert isinstance(resp, ChatResponse)
        assert "Договорились!" in resp.text
        assert resp.topic == "Консультация"


@pytest.mark.asyncio
async def test_fast_path_exact_faq():
    """Тест: вопросы из базы знаний FAQ возвращают готовый проверенный ответ из БД."""
    resp = await ai_chat_service.ask(message="Сколько стоит разработка под ключ?")
    assert isinstance(resp, ChatResponse)
    assert "Стоимость разработки под ключ рассчитывается индивидуально" in resp.text
    assert resp.topic == "Сколько стоит разработка под ключ"
    assert resp.show_lead_form is False


@pytest.mark.asyncio
async def test_adaptive_rag_saves_tokens_on_conversational_queries():
    """Тест: адаптивный RAG экономит токены и не раздувает промпт базой знаний при простых фразах."""
    # Для разговорных запросов не должны подмешиваться тяжелые чанки (экономия 500+ токенов)
    kb_simple = ai_chat_service._retrieve_relevant_kb("Привет, как дела?")
    assert "### Справочная информация по вопросу:" not in kb_simple
    assert "Digital-агентство Велкод" in kb_simple
    assert len(kb_simple) < 150  # Очень компактный промпт (до 25 токенов вместо 600)

    # Для целевых вопросов по разработке релевантная база подмешивается в полной мере
    kb_service = ai_chat_service._retrieve_relevant_kb("Сколько стоит сайт под ключ и интернет-магазин?")
    assert "### Справочная информация по вопросу:" in kb_service
    assert len(kb_service) > 200


@pytest.mark.asyncio
async def test_chat_api_endpoint_via_http():
    """Тест: HTTP эндпоинт /api/chat возвращает валидный ответ и статус 200."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/chat", json={"message": "Добрый день"})
        assert res.status_code == 200
        data = res.json()
        assert "text" in data
        assert "Здравствуйте!" in data["text"]
        assert data["topic"] == "Консультация"


@pytest.mark.asyncio
async def test_ai_settings_custom_fast_path():
    """Тест: изменение текста быстрого ответа в настройках динамически меняет ответ бота."""
    settings_obj = await ai_chat_service.get_settings()
    original_greeting = settings_obj.greeting_fast_path
    try:
        settings_obj.greeting_fast_path = "Кастомное приветствие от администратора Велкод!"
        resp = await ai_chat_service.ask(message="Привет")
        assert "Кастомное приветствие от администратора Велкод!" in resp.text
    finally:
        settings_obj.greeting_fast_path = original_greeting


@pytest.mark.asyncio
async def test_ai_settings_custom_stop_words():
    """Тест: кастомные стоп-слова из админки успешно исключаются при поиске RAG."""
    from app.services.ai_chat import _parse_custom_stop_words, _tokenize

    raw = "кастомное, стопслово тест"
    parsed = _parse_custom_stop_words(raw)
    assert parsed == {"кастомное", "стопслово", "тест"}

    tokens_without = _tokenize("кастомное стопслово сайт")
    assert "кастомн" in tokens_without or "кастомное" in tokens_without

    tokens_with = _tokenize("кастомное стопслово сайт", custom_stops=parsed)
    assert "кастомн" not in tokens_with
    assert "стопслов" not in tokens_with
    assert len(tokens_with) == 1  # остался только "сайт"


@pytest.mark.asyncio
async def test_ai_settings_disabled_switch():
    """Тест: тумблер is_active=False выключает консультанта без ошибок."""
    settings_obj = await ai_chat_service.get_settings()
    original_state = settings_obj.is_active
    try:
        settings_obj.is_active = False
        resp = await ai_chat_service.ask(message="Привет")
        assert "временно отключен" in resp.text
        assert resp.show_lead_form is True
    finally:
        settings_obj.is_active = original_state
