from __future__ import annotations

import json
import logging
import math
import os
import re
from collections import Counter
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


def _stem_word(word: str) -> str:
    word = word.lower().replace("ё", "е")
    if len(word) <= 3:
        return word
    word = re.sub(
        r"(?:ов|ев|ей|ям|ам|ами|ями|ом|ем|их|ых|ую|юю|ой|ей|ая|яя|ое|ее|ые|ие|ть|ти|л|ла|ли|ло|ся|сь)$",
        "",
        word,
    )
    word = re.sub(r"(?:[аеиоуыэюя]{1,2})$", "", word)
    return word


def _tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Zа-яА-Я0-9]+", text.lower())
    return [_stem_word(w) for w in words if len(w) >= 2]


class SimpleBM25:
    """Компактный и быстрый ретривер BM25 для базы знаний без сторонних зависимостей."""

    def __init__(self, corpus: list[list[str]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus = corpus
        self.corpus_size = len(corpus)
        self.avgdl = sum(len(doc) for doc in corpus) / (self.corpus_size or 1)
        self.doc_freqs: list[Counter[str]] = []
        self.idf: dict[str, float] = {}
        self.doc_lens = [len(doc) for doc in corpus]

        df: Counter[str] = Counter()
        for doc in corpus:
            for word in set(doc):
                df[word] += 1
            self.doc_freqs.append(Counter(doc))

        for word, freq in df.items():
            self.idf[word] = math.log(1 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

    def get_scores(self, query_tokens: list[str]) -> list[float]:
        scores = [0.0] * self.corpus_size
        for word in query_tokens:
            if word not in self.idf:
                continue
            idf = self.idf[word]
            for i, doc_freq in enumerate(self.doc_freqs):
                freq = doc_freq.get(word, 0)
                if freq == 0:
                    continue
                num = freq * (self.k1 + 1)
                den = freq + self.k1 * (1 - self.b + self.b * (self.doc_lens[i] / self.avgdl))
                scores[i] += idf * (num / den)
        return scores


class AiChatService:
    def __init__(self) -> None:
        self._cached_prompt: str | None = None
        self._chunks: list[dict[str, Any]] = []
        self._bm25: SimpleBM25 | None = None
        self._core_summary: str = ""

    def _build_core_summary(self) -> str:
        service_lines: list[str] = []
        for c in self._chunks:
            if c.get("category") == "service":
                title = c.get("title", "")
                url = c.get("url", "/services")
                meta = c.get("metadata", {})
                price = meta.get("price")
                unit = meta.get("unit", "за проект")
                price_str = f" от {price:,} ₽ {unit}".replace(",", " ") if price else ""
                content = c.get("content", "")
                desc = ""
                for line in content.splitlines():
                    if line.startswith("Описание: "):
                        desc = line.replace("Описание: ", "").strip()
                        break
                service_lines.append(f"- {title} ([Услуги]({url})){f':{price_str}' if price_str else ''}. {desc}")

        contacts_chunk = next((c for c in self._chunks if c.get("category") == "contacts"), None)
        contacts_str = contacts_chunk.get("content", "") if contacts_chunk else ""

        parts = ["### Основные направления услуг:"]
        parts.extend(service_lines)
        if contacts_str:
            parts.append("### Контакты:\n" + contacts_str)
        return "\n".join(parts)

    def reload_kb(self) -> None:
        """Сбрасывает кэш и принудительно перечитывает базу знаний с диска."""
        self._bm25 = None
        self._chunks = []
        self._core_summary = ""
        self._cached_prompt = None
        self._ensure_kb_index()

    def _ensure_kb_index(self) -> None:
        if self._bm25 is not None and self._chunks:
            return

        kb_file = Path(settings.ai_knowledge_base_path)
        if not kb_file.exists():
            return

        try:
            raw = json.loads(kb_file.read_text(encoding="utf-8"))
            self._chunks = raw.get("chunks", [])
            doc_tokens: list[list[str]] = []
            for c in self._chunks:
                text = f"{c.get('title', '')} {c.get('category', '')} {c.get('content', '')}"
                doc_tokens.append(_tokenize(text))
            self._bm25 = SimpleBM25(doc_tokens)
            self._core_summary = self._build_core_summary()
        except Exception as e:
            logger.warning(f"Не удалось инициализировать RAG индекс базы знаний: {e}")

    def _retrieve_relevant_kb(self, query: str, top_k: int = 2) -> str:
        self._ensure_kb_index()
        if not self._bm25 or not self._chunks:
            return self._core_summary

        scores = self._bm25.get_scores(_tokenize(query))
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        selected = [self._chunks[i] for i in top_indices if scores[i] > 0.1]
        if not selected and top_indices:
            selected = [self._chunks[top_indices[0]]]

        parts = [self._core_summary]
        if selected:
            parts.append("\n### Справочная информация по вопросу:")
            for ch in selected:
                parts.append(f"#### {ch.get('title', '')}\n{ch.get('content', '')}\n")
        return "\n".join(parts)

    def _load_system_prompt(self) -> str:
        prompt_file = Path(settings.ai_system_prompt_path)
        if prompt_file.exists():
            return prompt_file.read_text(encoding="utf-8").strip()
        return "Ты — официальный ИИ-консультант digital-агентства Велкод (velcode.ru)."

    def _get_api_key(self) -> str:
        return (
            settings.ai_api_key
            or os.getenv("AI_API_KEY", "")
            or os.getenv("OPENAI_API_KEY", "")
            or os.getenv("GEMINI_API_KEY", "")
        ).strip()

    @staticmethod
    def _auto_format_links(text: str) -> str:
        # Убираем случайный markdown жирный шрифт/курсив от модели (** или __), но сохраняем ссылки
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)
        # Превращаем любые случайные голые ссылки в валидные markdown-ссылки
        text = re.sub(r'(?<!\()(?<!\[)(/portfolio/[a-zA-Z0-9_-]+)', r'[Кейс в портфолио](\1)', text)
        text = re.sub(r'(?<!\()(?<!\[)(/contacts)(?![a-zA-Z0-9_/-])', r'[Контакты](/contacts)', text)
        text = re.sub(r'(?<!\()(?<!\[)(/portfolio)(?![a-zA-Z0-9_/-])', r'[Портфолио](/portfolio)', text)
        text = re.sub(r'(?<!\()(?<!\[)(/services)(?![a-zA-Z0-9_/-])', r'[Услуги](/services)', text)
        return text

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
        self,
        message: str,
        history: list[ChatMessage] | None = None,
        topic: str | None = None,
        existing_prefill: ChatPrefill | None = None,
    ) -> ChatResponse:
        api_key = self._get_api_key()
        if not api_key:
            return self._fallback_response(topic)

        system_prompt = self._load_system_prompt()
        search_query = f"{topic or ''} {message}".strip()
        kb_summary = self._retrieve_relevant_kb(search_query, top_k=2)

        topic_context = f"\nТЕКУЩАЯ ТЕМА ДИАЛОГА: {topic}\n" if topic else ""
        client_context = []
        if existing_prefill:
            if existing_prefill.name:
                client_context.append(f"Имя клиента: {existing_prefill.name}")
            if existing_prefill.phone:
                client_context.append(f"Телефон клиента: {existing_prefill.phone}")
        client_context_str = f"\nИЗВЕСТНЫЕ ДАННЫЕ КЛИЕНТА: {', '.join(client_context)}\n" if client_context else ""

        full_system_prompt = (
            f"{system_prompt}\n\n"
            f"--- БАЗА ЗНАНИЙ КОМПАНИИ ВЕЛКОД ---\n"
            f"{kb_summary}\n"
            f"-----------------------------------\n"
            f"{topic_context}"
            f"{client_context_str}"
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
            "response_format": {"type": "json_object"},
            "temperature": 0.4,
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

                start_idx = clean_json_str.find('{')
                end_idx = clean_json_str.rfind('}')
                if start_idx != -1 and end_idx > start_idx:
                    clean_json_str = clean_json_str[start_idx:end_idx + 1]

                try:
                    parsed = json.loads(clean_json_str)
                    text = str(parsed.get("text", "")).strip()
                    text = self._auto_format_links(text)
                    show_lead_form = bool(parsed.get("show_lead_form", False))
                    effective_topic = str(parsed.get("topic") or topic or "Консультация по услугам").strip()

                    generic_topics = {"оставить заявку", "отправка заявки", "заявка", "консультация", "приветствие", "консультация по услугам"}
                    if effective_topic.lower() in generic_topics and topic and topic.lower() not in generic_topics:
                        effective_topic = topic

                    prefill_data = parsed.get("prefill")
                    prefill: ChatPrefill | None = None
                    if isinstance(prefill_data, dict):
                        p_phone = prefill_data.get("phone")
                        p_name = prefill_data.get("name")
                        clean_phone = (
                            str(p_phone).strip()
                            if p_phone and str(p_phone).strip().lower() not in ("null", "none", "")
                            else None
                        )
                        clean_name = (
                            str(p_name).strip()
                            if p_name and str(p_name).strip().lower() not in ("null", "none", "")
                            else None
                        )
                        if clean_name:
                            clean_name = clean_name[:1].upper() + clean_name[1:]
                        formatted_phone = _format_russian_phone(clean_phone) if clean_phone else None
                        if formatted_phone or clean_name:
                            prefill = ChatPrefill(phone=formatted_phone, name=clean_name)

                    if existing_prefill:
                        if not prefill:
                            prefill = existing_prefill
                        else:
                            prefill = ChatPrefill(
                                name=prefill.name or existing_prefill.name,
                                phone=prefill.phone or existing_prefill.phone,
                            )

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
