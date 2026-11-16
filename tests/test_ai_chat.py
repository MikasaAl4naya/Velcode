import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas import ChatResponse
from app.services.ai_chat import ai_chat_service


@pytest.mark.asyncio
async def test_fast_path_greetings():
    """Тест: приветствия перехватываются мгновенно без вызова нейросети."""
    for greeting in ["Привет", "Здравствуйте!", "Добрый день"]:
        resp = await ai_chat_service.ask(message=greeting)
        assert isinstance(resp, ChatResponse)
        assert len(resp.text) > 0
        assert resp.show_lead_form is False


@pytest.mark.asyncio
async def test_fast_path_gratitude():
    """Тест: благодарности перехватываются мгновенно без вызова нейросети."""
    for thanks in ["Спасибо", "Благодарю!", "спасибо большое"]:
        resp = await ai_chat_service.ask(message=thanks)
        assert isinstance(resp, ChatResponse)
        assert len(resp.text) > 0
        assert resp.show_lead_form is False


@pytest.mark.asyncio
async def test_auto_format_links_and_velcode_sanitization():
    """Тест: защита от английского написания Velcode и нормализация ссылок."""
    raw = "Я консультант Velcode по разработке сайтов. Пишите на velcode@inbox.ru или в https://velcode.ru/advantages"
    formatted = ai_chat_service._auto_format_links(raw)
    assert "Я консультант Велкод по разработке сайтов." in formatted
    assert "velcode@inbox.ru" in formatted
    assert "[Преимущества](/advantages)" in formatted


@pytest.mark.asyncio
async def test_fast_path_exact_faq():
    """Тест: вопросы из базы знаний FAQ возвращают готовый проверенный ответ из БД."""
    resp = await ai_chat_service.ask(message="Сколько стоит разработка под ключ?")
    assert isinstance(resp, ChatResponse)
    assert "Стоимость разработки под ключ рассчитывается индивидуально" in resp.text
    assert resp.topic.rstrip("?") == "Сколько стоит разработка под ключ"
    assert resp.show_lead_form is False


@pytest.mark.asyncio
async def test_fast_path_faq_similarity_match():
    """Тест: вопрос с вариацией слов находит FAQ по сходству RAG/диффлиб (порог >= 0.9)."""
    # Вариация вопроса с дополнительным словом, дающая сходство > 0.90
    resp = await ai_chat_service.ask(message="Сколько стоит разработка сайта под ключ?")
    assert isinstance(resp, ChatResponse)
    assert "Стоимость разработки под ключ рассчитывается индивидуально" in resp.text
    assert resp.topic.rstrip("?") == "Сколько стоит разработка под ключ"
    assert resp.show_lead_form is False

    # При строгом пороге 0.98 нечеткое совпадение не перехватывает
    faq_match_high = ai_chat_service._find_faq_answer("Сколько стоит разработка сайта под ключ?", threshold=0.98)
    assert faq_match_high is None

    # При стандартном пороге 0.90 — находит
    faq_match_normal = ai_chat_service._find_faq_answer("Сколько стоит разработка сайта под ключ?", threshold=0.90)
    assert faq_match_normal is not None
    assert faq_match_normal[0].rstrip("?") == "Сколько стоит разработка под ключ"


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
        assert len(data["text"]) > 0
        assert data["topic"] in ("Консультация", "Приветствие")


@pytest.mark.asyncio
async def test_ai_settings_custom_fast_path():
    """Тест: изменение текста быстрого ответа в правилах динамически меняет ответ бота."""
    settings_obj = await ai_chat_service.get_settings()
    original_rules = list(settings_obj.fast_responses)
    try:
        from app.services.ai_chat import FastResponseRule
        settings_obj.fast_responses = [
            FastResponseRule(
                id="custom_greeting",
                title="Приветствие",
                triggers=["привет", "здравствуйте"],
                response="Кастомное приветствие от администратора Велкод!",
                is_active=True,
            )
        ]
        resp = await ai_chat_service.ask(message="Привет")
        assert "Кастомное приветствие от администратора Велкод!" in resp.text
    finally:
        settings_obj.fast_responses = original_rules


@pytest.mark.asyncio
async def test_dynamic_fast_path_farewells():
    """Тест: прощание перехватывается динамическим правилом без вызова LLM."""
    for bye in ["До свидания!", "всего доброго"]:
        resp = await ai_chat_service.ask(message=bye)
        assert isinstance(resp, ChatResponse)
        assert len(resp.text) > 0
        assert resp.topic == "Прощание"
        assert resp.show_lead_form is False


@pytest.mark.asyncio
async def test_dynamic_fast_path_add_arbitrary_rule():
    """Тест: создание совершенно нового динамического набора слов (например 'где офис') срабатывает мгновенно."""
    from app.services.ai_chat import FastResponseRule
    settings_obj = await ai_chat_service.get_settings()
    original_rules = list(settings_obj.fast_responses)
    try:
        new_rule = FastResponseRule(
            id="rule_location",
            title="Офис",
            triggers=["где находитесь", "где ваш офис", "ваш адрес"],
            response="Наш центральный офис в Иркутске, работаем онлайн по всей России!",
            is_active=True,
        )
        settings_obj.fast_responses.append(new_rule)
        resp = await ai_chat_service.ask(message="где ваш офис")
        assert "Наш центральный офис в Иркутске" in resp.text
        assert resp.topic == "Офис"
    finally:
        settings_obj.fast_responses = original_rules


def test_rate_limiter_minute_only_no_burst():
    """Тест: 6-секундный burst убран — несколько разных быстрых вопросов в пределах минуты разрешены."""
    from app.services.rate_limiter import ChatRateLimiter
    limiter = ChatRateLimiter(minute_limit=5)
    for i in range(4):
        limiter.check("1.2.3.4", f"Вопрос номер {i}")

    limiter.check("1.2.3.4", "Вопрос номер 5")
    with pytest.raises(Exception) as exc:
        limiter.check("1.2.3.4", "Вопрос номер 6")
    assert "Слишком много запросов в минуту" in str(exc.value)


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
