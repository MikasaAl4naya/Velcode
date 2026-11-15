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


def _format_russian_phone(phone_str: str) -> str:
    digits = re.sub(r'\D', '', phone_str)
    if len(digits) == 10:
        digits = '7' + digits
    elif len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    if len(digits) == 11:
        return f"+7 ({digits[1:4]}) {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"
    return phone_str.strip()


class AiChatService:
    def __init__(self) -> None:
        self._cached_prompt: str | None = None
        self._cached_kb: str | None = None

    def _load_system_prompt(self) -> str:
        prompt_file = Path(settings.ai_system_prompt_path)
        if prompt_file.exists():
            return prompt_file.read_text(encoding="utf-8").strip()
        return "Ты — официальный ИИ-консультант digital-агентства Велкод (velcode.ru)."

    def _load_knowledge_base_summary(self) -> str:
        kb_file = Path(settings.ai_knowledge_base_path)
        if not kb_file.exists():
            return "Велкод: веб-разработка, Битрикс24, 1С, ИИ-ассистенты, реклама. Телефон: +7 (924) 534 51 82."

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
            return "Велкод: веб-разработка, Битрикс24, 1С, чат-боты, реклама."

    def _get_api_key(self) -> str:
        return (
            settings.ai_api_key
            or os.getenv("AI_API_KEY", "")
            or os.getenv("OPENAI_API_KEY", "")
            or os.getenv("GEMINI_API_KEY", "")
        ).strip()

    def _fallback_response(self, topic: str | None = None) -> ChatResponse:
        """Резервный ответ на случай сетевого сбоя или временной недоступности модели."""
        return ChatResponse(
            text=(
                "Извините, сервис онлайн-ответов временно недоступен. "
                "Вы можете оставить заявку в форме ниже или связаться с нами напрямую по телефону "
                "+7 (924) 534 51 82 или в Telegram @VelcodeIRK — наш специалист свяжется с вами в течение 15 минут."
            ),
            topic=topic or "Консультация по услугам",
            actions=[],
            show_lead_form=True,
            prefill=None,
        )

    async def ask(
        self, message: str, history: list[ChatMessage] | None = None, topic: str | None = None
    ) -> ChatResponse:
        api_key = self._get_api_key()
        if not api_key:
            return self._fallback_response(topic)

        system_prompt = self._load_system_prompt()
        kb_summary = self._load_knowledge_base_summary()

        topic_context = f"\nТЕКУЩАЯ ТЕМА ДИАЛОГА: {topic}\n" if topic else ""
        session_context = []
        if history:
            all_hist_text = " ".join(m.text for m in history)
            phone_find = re.search(r'(?:\+?7|8)[\s\-\(]*(\d{3})[\s\-\)]*(\d{3})[\s\-]*(\d{2})[\s\-]*(\d{2})|\b(?:\+?7|8)?(\d{10})\b', all_hist_text)
            if phone_find:
                session_context.append(f"Телефон клиента: {_format_russian_phone(phone_find.group(0))}")
        session_context_str = f"\nКОНТЕКСТ ДИАЛОГА: {', '.join(session_context)}\n" if session_context else ""

        full_system_prompt = (
            f"{system_prompt}\n\n"
            f"--- БАЗА ЗНАНИЙ КОМПАНИИ ВЕЛКОД ---\n"
            f"{kb_summary}\n"
            f"-----------------------------------\n"
            f"{topic_context}"
            f"{session_context_str}"
        )

        recent_history = history[-6:] if history else []
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
            "max_tokens": 450,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json=body,
                )
                if res.status_code != 200:
                    logger.warning(f"AI API returned {res.status_code}: {res.text[:200]}")
                    return self._fallback_response(topic)

                data = res.json()
                raw_reply = data["choices"][0]["message"]["content"].strip()

                clean_json_str = raw_reply
                if "```json" in clean_json_str:
                    clean_json_str = clean_json_str.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json_str:
                    clean_json_str = clean_json_str.split("```")[1].split("```")[0].strip()

                try:
                    parsed = json.loads(clean_json_str)
                    text = str(parsed.get("text", "")).strip()
                    show_lead_form = bool(parsed.get("show_lead_form", False))
                    effective_topic = str(parsed.get("topic") or topic or "Консультация по услугам").strip()

                    prefill_data = parsed.get("prefill")
                    prefill: ChatPrefill | None = None
                    if isinstance(prefill_data, dict):
                        p_phone = prefill_data.get("phone")
                        p_name = prefill_data.get("name")
                        formatted_phone = _format_russian_phone(str(p_phone)) if p_phone else None
                        clean_name = str(p_name).strip() if p_name else None
                        if formatted_phone or clean_name:
                            prefill = ChatPrefill(phone=formatted_phone, name=clean_name)

                    lower_text = text.lower()
                    if any(k in lower_text for k in ["форму ниже", "форма открыта", "форма заявки открыта"]):
                        show_lead_form = True

                    actions: list[ChatAction] = []
                    if show_lead_form:
                        actions = []
                    else:
                        action_data = parsed.get("action")
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

                    return ChatResponse(
                        text=text or raw_reply,
                        topic=effective_topic,
                        actions=actions,
                        show_lead_form=show_lead_form,
                        prefill=prefill,
                    )
                except json.JSONDecodeError:
                    return ChatResponse(
                        text=raw_reply,
                        topic=topic or "Консультация по услугам",
                        actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
                        show_lead_form=False,
                    )

        except Exception as e:
            logger.error(f"Ошибка при вызове AI API: {e}")
            return self._fallback_response(topic)


ai_chat_service = AiChatService()
