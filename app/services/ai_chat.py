from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any

import httpx

from app.config import settings
from app.schemas import ChatAction, ChatMessage, ChatResponse

logger = logging.getLogger(__name__)


def _truncate_words(text: str, max_words: int = 3) -> str:
    words = text.strip().split()
    if len(words) <= max_words:
        return text.strip()
    return " ".join(words[:max_words])


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
            "Формат ответа: JSON {\"text\": \"...\", \"action\": {\"label\": \"...\", \"actionKey\": \"show_lead_form\"}}."
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

    def _local_smart_response(self, query: str) -> ChatResponse:
        """Интеллектуальный локальный ответ на случай отсутствия токена или ошибки сети."""
        q = query.strip().lower()

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
                actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
                show_lead_form=False,
            )

        # 6. Заявка и контакты
        if any(k in q for k in ["заявк", "связат", "консульт", "телефон", "позвон", "почт", "email"]):
            return ChatResponse(
                text=(
                    "С удовольствием проконсультируем вас! Заполните, пожалуйста, форму ниже — "
                    "специалист перезвонит вам в течение 15 минут в рабочее время (Пн-Пт с 10:00 до 18:00):"
                ),
                actions=[],
                show_lead_form=True,
            )

        # 7. Базовый ответ
        return ChatResponse(
            text=(
                "Спасибо за вопрос! Я умный ассистент Велкод. Могу рассказать о стоимости разработки, "
                "наших услугах, гарантиях, показать [кейсы в портфолио](/portfolio) или помочь оставить заявку."
            ),
            actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
            show_lead_form=False,
        )

    async def ask(self, message: str, history: list[ChatMessage] | None = None) -> ChatResponse:
        api_key = self._get_api_key()

        # Если токен еще не предоставлен — используем проверенный интеллектуальный движок
        if not api_key:
            return self._local_smart_response(message)

        system_prompt = self._load_system_prompt()
        kb_summary = self._load_knowledge_base_summary()

        full_system_prompt = (
            f"{system_prompt}\n\n"
            f"--- ДАННЫЕ БАЗЫ ЗНАНИЙ КОМПАНИИ ВЕЛКОД ---\n"
            f"{kb_summary}\n"
            f"-----------------------------------------\n"
            f"ВАЖНЫЕ ПРАВИЛА:\n"
            f"1. Если задача клиента сложная или нестандартная — не фантазируй. Напиши, что задача требует "
            f"оценки технического специалиста, и добавь кнопку [ACTION:Обсудить проект].\n"
            f"2. Всегда отвечай строго в формате JSON: {{\"text\": \"...\", \"action\": {{\"label\": \"...\", \"actionKey\": \"show_lead_form\"}}}}.\n"
            f"3. Текст label в action должен содержать МАКСИМУМ 3 слова."
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
                    return self._local_smart_response(message)

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
                    show_lead_form = False

                    if isinstance(action_data, dict) and action_data.get("label"):
                        raw_label = str(action_data["label"]).strip()
                        trimmed_label = _truncate_words(raw_label, 3)
                        actions.append(
                            ChatAction(
                                label=trimmed_label,
                                actionKey=action_data.get("actionKey", "show_lead_form"),
                                primary=True,
                            )
                        )

                    # Проверяем намерение показать форму
                    lower_text = text.lower()
                    if any(k in lower_text for k in ["форму ниже", "укажите имя и телефон", "заполните, пожалуйста, форму"]):
                        show_lead_form = True

                    return ChatResponse(
                        text=text or raw_reply,
                        actions=actions,
                        show_lead_form=show_lead_form,
                    )
                except json.JSONDecodeError:
                    # Если модель ответила простым текстом вместо JSON
                    clean_text = raw_reply
                    actions = []
                    action_match = re.search(r"\[ACTION:([^\]]+)\]", clean_text)
                    if action_match:
                        raw_label = action_match.group(1).strip()
                        clean_text = clean_text.replace(action_match.group(0), "").strip()
                        actions.append(ChatAction(label=_truncate_words(raw_label, 3), actionKey="show_lead_form", primary=True))

                    return ChatResponse(
                        text=clean_text,
                        actions=actions,
                        show_lead_form="форму" in clean_text.lower(),
                    )

        except Exception as e:
            logger.error(f"Ошибка при вызове AI API: {e}")
            return self._local_smart_response(message)


ai_chat_service = AiChatService()
