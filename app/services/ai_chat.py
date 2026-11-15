from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any

import httpx

from app.config import settings
from app.schemas import ChatAction, ChatMessage, ChatPrefill, ChatResponse

logger = logging.getLogger(__name__)


def _truncate_words(text: str, max_words: int = 3) -> str:
    words = text.strip().split()
    if len(words) <= max_words:
        return text.strip()
    return " ".join(words[:max_words])


def _extract_phone(text: str) -> str | None:
    # 1. Формат +7 (999) 123-45-67, 8-999-123-45-67 или 8 999 123 45 67
    m = re.search(r'(?:\+?7|8)[\s\-\(]*(\d{3})[\s\-\)]*(\d{3})[\s\-]*(\d{2})[\s\-]*(\d{2})', text)
    if m:
        raw = re.sub(r'\D', '', m.group(0))
        if len(raw) == 11:
            return '7' + raw[1:] if raw[0] in ('7', '8') else raw
        elif len(raw) == 10:
            return '7' + raw

    # 2. Непрерывные 10-11 цифр (например 89996864155 или 9996864155)
    digits_matches = re.findall(r'\b(?:\+?7|8)?(\d{10})\b', text)
    if digits_matches:
        raw = re.sub(r'\D', '', digits_matches[0])
        return '7' + raw[-10:]
    return None


def _format_russian_phone(phone_digits: str) -> str:
    digits = re.sub(r'\D', '', phone_digits)
    if len(digits) == 10:
        digits = '7' + digits
    elif len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    if len(digits) == 11:
        return f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"
    return phone_digits


def _extract_name(text: str) -> str | None:
    stop_words = {
        'мой', 'мое', 'моё', 'телефон', 'номер', 'номером', 'заявку', 'заявка', 'заявки',
        'оставь', 'оставьте', 'отправь', 'отправьте', 'заполни', 'заполните',
        'привет', 'здравствуйте', 'добрый', 'день', 'вечер', 'тут', 'здесь',
        'просто', 'свяжитесь', 'напишите', 'позвоните', 'перезвоните', 'набери', 'наберите',
        'жду', 'звонка', 'связь', 'связи', 'для', 'вот', 'это', 'давай', 'хочу',
        'клиент', 'пользователь', 'человек', 'заказчик', 'нет', 'да', 'ок', 'ага',
        'пожалуйста', 'спасибо', 'согласен', 'согласна', 'знаю', 'знает', 'знать', 'помню', 'думаю'
    }

    # 1. Шаблоны с явным представлением
    explicit = re.search(r'(?:меня\s+зовут|мое\s+имя|моё\s+имя|имя[:\s]+)\s*([А-ЯЁа-яёA-Za-z]+(?:\s+[А-ЯЁа-яёA-Za-z]+)?)', text, re.IGNORECASE)
    if explicit:
        candidate = explicit.group(1).strip()
        words = [w.capitalize() for w in candidate.split() if w.lower() not in stop_words and len(w) >= 2 and w.isalpha()]
        if words:
            return ' '.join(words[:2])

    # 2. Выделение имени при наличии телефона
    clean = re.sub(r'(?:\+?7|8)[\s\-\(]*\d{3}[\s\-\)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}|\b(?:\+?7|8)?\d{10}\b', ' ', text)
    clean = re.sub(r'[^\w\s]', ' ', clean)
    words = clean.split()

    potential_names = []
    for w in words:
        w_low = w.lower()
        if w_low not in stop_words and len(w) >= 2 and w.isalpha():
            potential_names.append(w.capitalize())

    if 1 <= len(potential_names) <= 2:
        return ' '.join(potential_names)
    return None


def _is_vague_query(text: str) -> bool:
    q = text.strip().lower()
    q_clean = re.sub(r'[^\w\s]', '', q).strip()
    vague_phrases = {
        'нет', 'не', 'неа', 'ноу', 'no',
        'хз', 'не знаю', 'не уверена', 'не уверен', 'без понятия',
        'ок', 'ладно', 'ясно', 'понял', 'понятно', 'ага', 'угу', 'ну', 'хм', 'эм', 'мм',
        'ну ок', 'да нет', 'да не', 'не знаю даже', 'ничего', 'ниче',
        'что', 'че', 'чё', 'и', 'и что', 'и че', 'а'
    }
    if q_clean in vague_phrases or (len(q_clean) <= 2 and not q_clean.isdigit()):
        return True
    return False


def _is_152_fz_query(text: str) -> bool:
    q = text.lower()
    patterns = [
        "сам не можешь", "почему сам", "зачем галк", "зачем нажимать",
        "зачем подтвержд", "отправь сам", "сам заполни", "сам отправь",
        "почему я должен", "не хочу нажимать", "зачем соглас", "зачем галочк",
        "зачем подтверждать", "почему не можешь сам", "че сам не можешь",
        "зачем галочка", "сам не умеешь", "почему бот сам не"
    ]
    return any(p in q for p in patterns)


def _detect_topic(text: str, current_topic: str | None = None) -> str:
    q = text.lower()

    # 1. Если тема уже есть — проверяем дополнения и уточнения
    if current_topic and current_topic != "Консультация по услугам":
        t_low = current_topic.lower()
        if any(w in q for w in ["со своим дизайн", "свой дизайн", "своим макет", "готовый дизайн", "свой макет"]):
            if "дизайн" not in t_low:
                return f"{current_topic} со своим дизайном"
        if any(w in q for w in ["1с", "1c"]) and "1с" not in t_low:
            return f"{current_topic} с 1С"
        if any(w in q for w in ["битрикс", "bitrix"]) and "битрикс" not in t_low:
            return f"{current_topic} с Битрикс24"
        if any(w in q for w in ["каталог", "товары", "корзин"]) and "каталог" not in t_low and "магазин" not in t_low:
            return f"{current_topic} с каталогом"
        if any(w in q for w in ["срочно", "быстро"]) and "срочно" not in t_low:
            return f"{current_topic} (срочно)"
        # Сохраняем уже выработанную тему диалога от случайного перезатирания
        return current_topic

    # 2. Первичное определение темы по ключевым словам
    if any(w in q for w in ["магазин", "каталог", "корзин", "товар", "e-commerce"]):
        if any(w in q for w in ["1с", "1c"]):
            return "Интернет-магазин с интеграцией 1С"
        if any(w in q for w in ["со своим дизайн", "свой дизайн"]):
            return "Интернет-магазин со своим дизайном"
        return "Разработка интернет-магазина"
    if any(w in q for w in ["лендинг", "одностранич"]):
        if any(w in q for w in ["со своим дизайн", "свой дизайн"]):
            return "Лендинг со своим дизайном"
        return "Разработка лендинга"
    if any(w in q for w in ["корпоратив", "визитк"]):
        return "Корпоративный сайт"
    if any(w in q for w in ["битрикс", "bitrix"]):
        if any(w in q for w in ["1с", "1c"]):
            return "Интеграция Битрикс24 и 1С"
        return "Внедрение Битрикс24"
    if any(w in q for w in ["1с", "1c"]):
        return "Интеграция с 1С"
    if bool(re.search(r'\b(?:чат-)?бот[а-я]*\b', q)) or any(w in q for w in ["телеграм", "telegram"]):
        return "Разработка чат-бота"
    if any(w in q for w in ["seo", "продвижен", "оптимизац"]):
        return "SEO-продвижение"
    if any(w in q for w in ["реклам", "директ", "трафик"]):
        return "Контекстная реклама"
    if any(w in q for w in ["дизайн", "редизайн", "ui", "ux"]):
        return "Дизайн и UI/UX"
    if any(w in q for w in ["c#", "микросервис", "склад", "архитектур", "самописн"]):
        return "Кастомная веб-разработка и интеграции"
    if any(w in q for w in ["гарант", "договор"]):
        return "Вопрос по договору и гарантиям"
    if any(w in q for w in ["стоим", "цен", "сколько", "расчет", "прайс", "под ключ"]):
        if any(w in q for w in ["со своим дизайн", "свой дизайн"]):
            return "Разработка под ключ со своим дизайном"
        return "Разработка сайта под ключ"

    return current_topic or "Консультация по услугам"


class AiChatService:
    def __init__(self) -> None:
        self._cached_prompt: str | None = None
        self._cached_kb: str | None = None

    def _load_system_prompt(self) -> str:
        prompt_file = Path(settings.ai_system_prompt_path)
        if prompt_file.exists():
            return prompt_file.read_text(encoding="utf-8").strip()
        return (
            "Ты — ИИ-консультант digital-агентства Велкод (velcode.ru). "
            "Отвечай кратко (2-3 предложения), дружелюбно и строго по делу. "
            "Ссылки только в markdown [текст](/url). "
            "Формат ответа: JSON {\"text\": \"...\", \"topic\": \"...\", \"show_lead_form\": false, \"prefill\": {\"phone\": null, \"name\": null}, \"action\": {\"label\": \"...\", \"actionKey\": \"show_lead_form\"}}."
        )

    def _load_knowledge_base_summary(self) -> str:
        kb_file = Path(settings.ai_knowledge_base_path)
        if not kb_file.exists():
            return "Велкод: разработка сайтов под ключ, Битрикс24, 1С, чат-боты, реклама. Телефон: +7 (924) 534 51 82."

        try:
            raw = json.loads(kb_file.read_text(encoding="utf-8"))
            chunks = raw.get("chunks", [])
            lines: list[str] = []
            for ch in chunks:
                title = ch.get("title", "")
                content = ch.get("content", "")
                lines.append(f"### {title}\n{content}\n")
            return "\n".join(lines)
        except Exception as e:
            logger.warning(f"Не удалось загрузить knowledge_base.json: {e}")
            return "Велкод: разработка сайтов под ключ, Битрикс24, 1С, чат-боты."

    def _get_api_key(self) -> str:
        return (
            settings.ai_api_key
            or os.getenv("AI_API_KEY", "")
            or os.getenv("OPENAI_API_KEY", "")
            or os.getenv("GEMINI_API_KEY", "")
        ).strip()

    def _local_smart_response(
        self, query: str, history: list[ChatMessage] | None = None, topic: str | None = None
    ) -> ChatResponse:
        """Интеллектуальный локальный ответ на случай отсутствия токена или ошибки сети."""
        effective_topic = _detect_topic(query, topic)
        q = query.strip().lower()

        # 0. Вопросы про согласие / почему бот сам не отправляет (152-ФЗ)
        if _is_152_fz_query(query):
            phone = _extract_phone(query)
            if not phone and history:
                for h in reversed(history):
                    if h.role == "user":
                        p = _extract_phone(h.text)
                        if p:
                            phone = p
                            break
            formatted_phone = _format_russian_phone(phone) if phone else None
            return ChatResponse(
                text=(
                    "Согласно Федеральному закону № 152-ФЗ «О персональных данных», мы не имеем права "
                    "собирать и отправлять ваши контактные данные без вашего личного прямого согласия. "
                    "Поэтому вам необходимо подтвердить согласие галочкой и нажать кнопку отправки самостоятельно — "
                    "это законное требование для защиты ваших персональных данных."
                ),
                topic=effective_topic,
                actions=[],
                show_lead_form=True,
                prefill=ChatPrefill(phone=formatted_phone) if formatted_phone else None,
            )

        # 0.1 Пользователь передал номер телефона
        phone = _extract_phone(query)
        if phone:
            name = _extract_name(query)
            formatted_phone = _format_russian_phone(phone)
            if name:
                text = (
                    f"Отлично, {name}! Я открыл форму заявки ниже и подставил ваши данные ({formatted_phone}). "
                    f"Пожалуйста, подтвердите согласие на обработку персональных данных и нажмите кнопку «Отправить»."
                )
            else:
                text = (
                    f"Отлично! Я открыл форму заявки ниже и уже заполнил поле с вашим номером ({formatted_phone}). "
                    f"Пожалуйста, укажите ваше имя, подтвердите согласие на обработку персональных данных и нажмите «Отправить»."
                )
            return ChatResponse(
                text=text,
                topic=effective_topic,
                actions=[],
                show_lead_form=True,
                prefill=ChatPrefill(phone=formatted_phone, name=name),
            )

        # 0.2 Короткие / неясные реплики без сути вопроса («нет», «не знаю», «ок», «ага» и т.д.)
        if _is_vague_query(query):
            return ChatResponse(
                text="Не совсем понимаю вас. Хотите оставить заявку и уточнить все детали у нашего менеджера?",
                topic=effective_topic or "Консультация по услугам",
                actions=[ChatAction(label="Связаться с менеджером", actionKey="show_lead_form", primary=True)],
                show_lead_form=False,
                prefill=None,
            )

        # 1. Сложные / нестандартные задачи -> мягкий перевод на специалиста и показ формы
        complex_keywords = [
            "c#", "c++", "java", "микросервис", "кластер", "самописн", "архитектур",
            "erp", "сложн", "высоконагруж", "нагрузк", "нестандарт", "блокчейн",
            "парсинг", "парсер", "кастомн", "свое решен", "индивидуальн интеграц"
        ]
        if any(k in q for k in complex_keywords):
            return ChatResponse(
                text=(
                    "Данная задача нестандартная и требует оценки технического специалиста. "
                    "Оставьте ваше имя и номер телефона — наш ведущий разработчик свяжется с вами, "
                    "уточнив детали интеграции и архитектуры, и подготовит детальный расчет."
                ),
                topic=effective_topic,
                actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
                show_lead_form=True,
            )

        # 2. Вопрос стоимости / цен
        if any(k in q for k in ["стоим", "цен", "сколько", "расчет", "прайс", "тариф", "бюджет", "под ключ"]):
            return ChatResponse(
                text=(
                    "Стоимость разработки под ключ рассчитывается индивидуально: "
                    "лендинги — от 30 000 ₽, корпоративные сайты — от 50 000 ₽, "
                    "интернет-магазины и веб-сервисы — от 90 000 ₽. "
                    "В стоимость входят аналитика, дизайн, вёрстка, интеграции и базовая оптимизация. "
                    "Смета и сроки фиксируются в договоре."
                ),
                topic=effective_topic,
                actions=[ChatAction(label="Оставить заявку", actionKey="show_lead_form", primary=True)],
                show_lead_form=False,
            )

        # 3. Гарантии и договор
        if any(k in q for k in ["гарант", "договор", "надежн", "правк", "ответственност"]):
            return ChatResponse(
                text=(
                    "Мы работаем строго по официальному договору (ИП Манилат В. П.), где четко "
                    "зафиксированы смета, этапы и сроки. Предоставляем 60 дней бесплатной гарантийной поддержки "
                    "на весь разработанный код после сдачи. Подробнее — в [разделе преимуществ](/advantages)."
                ),
                topic=effective_topic,
                actions=[ChatAction(label="Оставить заявку", actionKey="show_lead_form", primary=True)],
                show_lead_form=False,
            )

        # 4. Услуги и направления
        if any(k in q for k in ["услуг", "стек", "технолог", "что делаете", "предоставля", "направлен"]):
            return ChatResponse(
                text=(
                    "Велкод предоставляет комплексную разработку: создание сайтов и веб-сервисов "
                    "(Next.js, React, FastAPI), внедрение Битрикс24 и 1С, разработку ИИ-ассистентов и чат-ботов, "
                    "а также рекламу и продвижение. Все направления описаны на [странице услуг](/services)."
                ),
                topic=effective_topic,
                actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
                show_lead_form=False,
            )

        # 5. Портфолио и кейсы
        if any(k in q for k in ["кейс", "портфолио", "пример", "выполнен", "покаж", "посмотр", "работы"]):
            return ChatResponse(
                text=(
                    "Вот несколько реализованных проектов Велкод:\n\n"
                    "— [«Спорт-Товары»](/portfolio/sport-shop) — интернет-магазин с каталогом, корзиной и 1С-интеграцией.\n\n"
                    "— [«Trattoria Pomodoro»](/portfolio/trattoria) — сайт-визитка рестобара с меню и бронированием.\n\n"
                    "— [«Битрикс24 & 1С»](/portfolio/bitrix-1c) — двусторонняя интеграция CRM и 1С:Предприятие.\n\n"
                    "Все работы доступны в [портфолио](/portfolio)."
                ),
                topic=effective_topic,
                actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
                show_lead_form=False,
            )

        # 6. Заявка и контакты (без номера телефона)
        if any(k in q for k in ["заявк", "связат", "консульт", "телефон", "позвон", "почт", "email"]):
            return ChatResponse(
                text=(
                    "С удовольствием проконсультируем вас! Заполните, пожалуйста, форму ниже — "
                    "специалист перезвонит вам в течение 15 минут в рабочее время (Пн-Пт с 10:00 до 18:00):"
                ),
                topic=effective_topic,
                actions=[],
                show_lead_form=True,
            )

        # 7. Базовый ответ
        return ChatResponse(
            text=(
                "Спасибо за вопрос! Я умный ассистент Велкод. Могу рассказать о стоимости разработки, "
                "наших услугах, гарантиях, показать [кейсы в портфолио](/portfolio) или помочь оставить заявку."
            ),
            topic=effective_topic,
            actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
            show_lead_form=False,
        )

    async def ask(
        self, message: str, history: list[ChatMessage] | None = None, topic: str | None = None
    ) -> ChatResponse:
        effective_topic = _detect_topic(message, topic)

        # 1. Запрос по 152-ФЗ / почему бот сам не отправляет
        if _is_152_fz_query(message):
            phone = _extract_phone(message)
            if not phone and history:
                for h in reversed(history):
                    if h.role == "user":
                        p = _extract_phone(h.text)
                        if p:
                            phone = p
                            break
            formatted_phone = _format_russian_phone(phone) if phone else None
            return ChatResponse(
                text=(
                    "Согласно Федеральному закону № 152-ФЗ «О персональных данных», мы не имеем права "
                    "собирать и отправлять ваши контактные данные без вашего личного прямого согласия. "
                    "Поэтому вам необходимо подтвердить согласие галочкой и нажать кнопку отправки самостоятельно — "
                    "это требование закона для защиты ваших персональных данных."
                ),
                topic=effective_topic,
                actions=[],
                show_lead_form=True,
                prefill=ChatPrefill(phone=formatted_phone) if formatted_phone else None,
            )

        # 2. Если в сообщении есть телефон — формируем мгновенный гарантированный ответ с открытием формы
        extracted_phone = _extract_phone(message)
        extracted_name = _extract_name(message)
        if extracted_phone:
            formatted_phone = _format_russian_phone(extracted_phone)
            if extracted_name:
                text = (
                    f"Отлично, {extracted_name}! Я открыл форму заявки ниже и уже заполнил ваши данные ({formatted_phone}). "
                    f"Пожалуйста, подтвердите согласие на обработку персональных данных и нажмите кнопку «Отправить»."
                )
            else:
                text = (
                    f"Отлично! Я открыл форму заявки ниже и уже заполнил поле с вашим номером ({formatted_phone}). "
                    f"Пожалуйста, укажите ваше имя, подтвердите согласие на обработку персональных данных и нажмите «Отправить»."
                )
            return ChatResponse(
                text=text,
                topic=effective_topic,
                actions=[],
                show_lead_form=True,
                prefill=ChatPrefill(phone=formatted_phone, name=extracted_name),
            )

        # 3. Короткие / неясные реплики без сути вопроса («нет», «не знаю», «ок», «ага» и т.д.)
        if _is_vague_query(message):
            return ChatResponse(
                text="Не совсем понимаю вас. Хотите оставить заявку и уточнить все детали у нашего менеджера?",
                topic=effective_topic or "Консультация по услугам",
                actions=[ChatAction(label="Связаться с менеджером", actionKey="show_lead_form", primary=True)],
                show_lead_form=False,
                prefill=None,
            )

        api_key = self._get_api_key()

        # Если токен не задан — используем локальный движок
        if not api_key:
            return self._local_smart_response(message, history, topic)

        system_prompt = self._load_system_prompt()
        kb_summary = self._load_knowledge_base_summary()

        topic_context = f"\nТЕКУЩАЯ ТЕМА ДИАЛОГА: {effective_topic}\n" if effective_topic else ""
        full_system_prompt = (
            f"{system_prompt}\n\n"
            f"--- ДАННЫЕ БАЗЫ ЗНАНИЙ КОМПАНИИ ВЕЛКОД ---\n"
            f"{kb_summary}\n"
            f"-----------------------------------------\n"
            f"{topic_context}"
            f"ВАЖНЫЕ ПРАВИЛА:\n"
            f"1. Ты НЕ можешь сам отправлять заявки от имени пользователя! НИКОГДА не говори «Заявка принята» или «Я передал контакты».\n"
            f"2. Если клиент передал номер телефона или просит оставить заявку: всегда отвечай с show_lead_form: true, prefill с телефоном/именем, и action: null. Если указано имя (например «вика 8999...», «меня зовут Олег») — обязательно укажи его в prefill.name. Напиши, что форма открыта ниже и телефон подставлен, осталось указать имя, согласиться с ПД и нажать Отправить.\n"
            f"3. Если клиент спрашивает, почему бот сам не отправит заявку или зачем нажимать галочку согласия — сошлись на Федеральный закон № 152-ФЗ «О персональных данных».\n"
            f"4. В поле \"topic\" формулируй точную суть задачи с учётом деталей и уточнений клиента (2-6 слов, например «Разработка сайта под ключ со своим дизайном», «Интернет-магазин с каталогом и 1С»).\n"
            f"5. Всегда отвечай строго в формате JSON: {{\"text\": \"...\", \"topic\": \"...\", \"show_lead_form\": false, \"prefill\": {{\"phone\": null, \"name\": null}}, \"action\": {{\"label\": \"...\", \"actionKey\": \"show_lead_form\"}}}}.\n"
            f"6. Текст label в action должен содержать МАКСИМУМ 3 слова. Если show_lead_form: true, то action должен быть null.\n"
            f"7. Если сообщение пользователя не содержит сути или конкретного вопроса (например «нет», «не знаю», «ок», «ага»): вежливо ответь: «Не совсем понимаю вас. Хотите оставить заявку и уточнить все детали у нашего менеджера?», show_lead_form: false, action: {{\"label\": \"Связаться с менеджером\", \"actionKey\": \"show_lead_form\"}}."
        )

        # Скользящее окно: берем последние 4 сообщения для экономии контекста
        recent_history = history[-4:] if history else []
        payload_messages = [{"role": "system", "content": full_system_prompt}]
        for m in recent_history:
            role = "user" if m.role == "user" else "assistant"
            payload_messages.append({"role": role, "content": m.text})
        payload_messages.append({"role": "user", "content": message})

        base_url = settings.ai_base_url.rstrip("/")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        body: dict[str, Any] = {
            "model": settings.ai_model,
            "messages": payload_messages,
            "temperature": 0.3,
            "max_tokens": 400,
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json=body,
                )
                if res.status_code != 200:
                    logger.warning(f"AI API returned {res.status_code}: {res.text[:200]}")
                    return self._local_smart_response(message, history, topic)

                data = res.json()
                raw_reply = data["choices"][0]["message"]["content"].strip()

                # Извлекаем JSON из ответа
                clean_json_str = raw_reply
                if "```json" in clean_json_str:
                    clean_json_str = clean_json_str.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json_str:
                    clean_json_str = clean_json_str.split("```")[1].split("```")[0].strip()

                try:
                    parsed = json.loads(clean_json_str)
                    text = str(parsed.get("text", "")).strip()
                    action_data = parsed.get("action")
                    actions: list[ChatAction] = []
                    show_lead_form = bool(parsed.get("show_lead_form", False))

                    base_topic = topic or effective_topic
                    if parsed.get("topic"):
                        llm_topic = str(parsed["topic"]).strip()
                        # Если модель вернула общий раздел вместо конкретики темы, сохраняем уточненную базу
                        if llm_topic.lower() in ["дизайн и ui/ux", "дизайн", "ui/ux", "услуги", "консультация"] and base_topic and base_topic != "Консультация по услугам":
                            effective_topic = _detect_topic(message, base_topic)
                        elif 3 < len(llm_topic) <= 70 and llm_topic.lower() != "консультация по услугам":
                            effective_topic = _detect_topic(message, llm_topic)
                        else:
                            effective_topic = _detect_topic(message, base_topic)
                    else:
                        effective_topic = _detect_topic(message, base_topic)

                    prefill_data = parsed.get("prefill")
                    prefill: ChatPrefill | None = None
                    if isinstance(prefill_data, dict) and (prefill_data.get("phone") or prefill_data.get("name")):
                        p_phone = prefill_data.get("phone")
                        if p_phone:
                            p_phone = _format_russian_phone(str(p_phone))
                        p_name = str(prefill_data.get("name") or "").strip() or None
                        if not p_name and extracted_name:
                            p_name = extracted_name
                        if not p_phone and extracted_phone:
                            p_phone = _format_russian_phone(extracted_phone)
                        prefill = ChatPrefill(
                            phone=p_phone,
                            name=p_name,
                        )
                    elif extracted_phone or extracted_name:
                        prefill = ChatPrefill(
                            phone=_format_russian_phone(extracted_phone) if extracted_phone else None,
                            name=extracted_name,
                        )

                    # Проверяем намерение показать форму из текста
                    lower_text = text.lower()
                    if any(k in lower_text for k in ["форму ниже", "укажите имя и телефон", "заполните, пожалуйста, форму", "открыл форму"]):
                        show_lead_form = True

                    # Защита от галлюцинаций "заявка принята"
                    hallucination_phrases = ["заявка принята", "мы приняли заявку", "приняли вашу заявку", "заявка отправлена"]
                    if any(hp in lower_text for hp in hallucination_phrases):
                        show_lead_form = True
                        text = "Для отправки заявки, пожалуйста, заполните форму ниже, подтвердите согласие на обработку данных и нажмите «Отправить»."

                    if show_lead_form:
                        # Когда форма открыта — убираем дублирующую кнопку действия
                        actions = []
                    elif isinstance(action_data, dict) and action_data.get("label"):
                        raw_label = str(action_data["label"]).strip()
                        trimmed_label = _truncate_words(raw_label, 3)
                        actions.append(
                            ChatAction(
                                label=trimmed_label,
                                actionKey=action_data.get("actionKey", "show_lead_form"),
                                primary=True,
                            )
                        )

                    return ChatResponse(
                        text=text or raw_reply,
                        topic=effective_topic,
                        actions=actions,
                        show_lead_form=show_lead_form,
                        prefill=prefill,
                    )
                except json.JSONDecodeError:
                    clean_text = raw_reply
                    actions = []
                    action_match = re.search(r"\[ACTION:([^\]]+)\]", clean_text)
                    if action_match:
                        raw_label = action_match.group(1).strip()
                        clean_text = clean_text.replace(action_match.group(0), "").strip()
                        actions.append(ChatAction(label=_truncate_words(raw_label, 3), actionKey="show_lead_form", primary=True))

                    show_lead = "форму" in clean_text.lower()
                    if show_lead:
                        actions = []

                    return ChatResponse(
                        text=clean_text,
                        topic=effective_topic,
                        actions=actions,
                        show_lead_form=show_lead,
                    )

        except Exception as e:
            logger.error(f"Ошибка при вызове AI API: {e}")
            return self._local_smart_response(message, history, topic)


ai_chat_service = AiChatService()
