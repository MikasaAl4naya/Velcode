from __future__ import annotations

import difflib
import json
import logging
import math
import os
import re
from collections import Counter
from dataclasses import dataclass, field
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


RUSSIAN_STOP_WORDS = {
    "и", "в", "во", "не", "что", "он", "на", "я", "с", "со", "как", "а", "то", "все",
    "она", "так", "его", "но", "да", "ты", "к", "у", "же", "вы", "за", "бы", "по",
    "только", "ее", "мне", "было", "вот", "от", "меня", "еще", "нет", "о", "из", "ему",
    "теперь", "когда", "даже", "ну", "вдруг", "ли", "если", "уже", "или", "ни", "быть",
    "был", "него", "до", "вас", "нибудь", "опять", "уж", "вам", "ведь", "там", "потом",
    "себя", "ничего", "ей", "может", "они", "тут", "где", "есть", "надо", "ней", "для",
    "мы", "тебя", "их", "чем", "была", "сам", "чтоб", "без", "будто", "чего", "раз",
    "тоже", "себе", "под", "будет", "ж", "тогда", "кто", "этот", "того", "потому", "этого",
    "какой", "совсем", "ним", "здесь", "этом", "один", "почти", "мой", "тем", "чтобы",
    "нее", "сейчас", "были", "куда", "зачем", "всех", "никогда", "можно", "при", "наконец",
    "два", "об", "другой", "хоть", "после", "над", "больше", "тот", "через", "эти", "нас",
    "про", "всего", "них", "какая", "много", "разве", "три", "эту", "впрочем",
    "свою", "этой", "перед", "иногда", "лучше", "чуть", "том", "нельзя", "дела"
}


DEFAULT_FAST_RESPONSES = [
    {
        "id": "rule_greeting",
        "title": "Приветствие",
        "triggers": [
            "привет", "здравствуйте", "добрый день", "добрый вечер", "доброе утро",
            "приветствую", "хай", "салам", "хей", "ку", "йоу", "hello", "hi"
        ],
        "response": (
            "Здравствуйте! Чем можем вам помочь? Мы создаем современные сайты под ключ, "
            "разрабатываем чат-ботов и автоматизируем бизнес. Подсказать по услугам или рассчитать проект?"
        ),
        "is_active": True,
    },
    {
        "id": "rule_gratitude",
        "title": "Благодарность",
        "triggers": [
            "спасибо", "благодарю", "спасибо большое", "от души", "огромное спасибо",
            "сяп", "спс", "спасибочки", "благодарен", "благодарна", "thanks", "thank you"
        ],
        "response": "Пожалуйста! Если появятся вопросы или захотите обсудить проект — мы всегда на связи.",
        "is_active": True,
    },
    {
        "id": "rule_confirmation",
        "title": "Согласие / Договорились",
        "triggers": [
            "отлично", "супер", "хорошо", "понял", "понятно", "договорились",
            "ясненько", "ладно", "ок", "добро", "принято", "круто"
        ],
        "response": "Договорились! Если потребуется расчёт или возникнут вопросы — напишите, я помогу сориентироваться.",
        "is_active": True,
    },
    {
        "id": "rule_farewell",
        "title": "Прощание",
        "triggers": [
            "пока", "до свидания", "до скорого", "прощай", "всего хорошего",
            "всего доброго", "счастливо", "бай", "пока пока", "увидимся",
            "спокойной ночи", "bye", "goodbye"
        ],
        "response": "Всего доброго! Будем рады сотрудничеству. Если возникнут вопросы или потребуется проект — мы всегда на связи!",
        "is_active": True,
    },
]


@dataclass
class FastResponseRule:
    id: str
    title: str
    triggers: list[str]
    response: str
    is_active: bool = True


@dataclass
class CachedAiSettings:
    is_active: bool = True
    model: str = "gpt-4o-mini"
    temperature: float = 0.4
    max_tokens: int = 450
    base_url: str | None = None
    rag_threshold: float = 0.5
    rag_top_k: int = 2
    faq_threshold: float = 0.9
    custom_stop_words: set[str] = field(default_factory=set)
    system_prompt: str = ""
    fast_responses: list[FastResponseRule] = field(default_factory=list)
    minute_limit: int = 15


def _parse_fast_responses(raw_json: str | None) -> list[FastResponseRule]:
    if not raw_json:
        return [FastResponseRule(**r) for r in DEFAULT_FAST_RESPONSES]
    try:
        items = json.loads(raw_json)
        if not isinstance(items, list) or not items:
            return [FastResponseRule(**r) for r in DEFAULT_FAST_RESPONSES]
        rules = []
        for i, item in enumerate(items):
            rule_id = str(item.get("id", f"rule_{i+1}"))
            title = str(item.get("title", f"Правило {i+1}"))
            raw_trigs = item.get("triggers", [])
            if isinstance(raw_trigs, str):
                triggers = [t.strip() for t in re.split(r"[,\n]+", raw_trigs) if t.strip()]
            elif isinstance(raw_trigs, list):
                triggers = [str(t).strip() for t in raw_trigs if str(t).strip()]
            else:
                triggers = []
            response = str(item.get("response", ""))
            is_active = bool(item.get("is_active", True))
            rules.append(FastResponseRule(
                id=rule_id,
                title=title,
                triggers=triggers,
                response=response,
                is_active=is_active,
            ))
        return rules
    except Exception as e:
        logger.warning(f"Ошибка парсинга fast_responses: {e}")
        return [FastResponseRule(**r) for r in DEFAULT_FAST_RESPONSES]


def _parse_custom_stop_words(raw: str | None) -> set[str]:
    if not raw:
        return set()
    items = re.split(r"[,\s\n]+", raw)
    return {w.strip().lower() for w in items if w.strip()}


def _tokenize(text: str, custom_stops: set[str] | None = None) -> list[str]:
    stops = RUSSIAN_STOP_WORDS if not custom_stops else (RUSSIAN_STOP_WORDS | custom_stops)
    words = re.findall(r"[a-zA-Zа-яА-Я0-9]+", text.lower())
    return [_stem_word(w) for w in words if w not in stops and len(w) >= 3]


GREETINGS = {
    "привет", "здравствуйте", "добрый день", "добрый вечер", "доброе утро",
    "приветствую", "хай", "салам", "хей", "ку", "йоу", "hello", "hi"
}

GRATITUDES = {
    "спасибо", "благодарю", "спасибо большое", "от души", "огромное спасибо",
    "сяп", "спс", "спасибочки", "благодарен", "благодарна", "thanks", "thank you"
}

CONFIRMATIONS = {
    "отлично", "супер", "хорошо", "понял", "понятно", "договорились",
    "ясненько", "ладно", "ок", "добро", "принято", "круто"
}


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


        return None


def _calculate_faq_similarity(query: str, faq_title: str) -> float:
    """Вычисляет сходство вопроса пользователя с вопросом FAQ от 0.0 до 1.0."""
    clean_q = re.sub(r"[?!.,;:«»\"'()~`\-_/\\]", " ", query).strip().lower()
    clean_f = re.sub(r"[?!.,;:«»\"'()~`\-_/\\]", " ", faq_title).strip().lower()
    if not clean_q or not clean_f:
        return 0.0

    clean_q_compact = " ".join(clean_q.split())
    clean_f_compact = " ".join(clean_f.split())

    if clean_q_compact == clean_f_compact:
        return 1.0

    q_tokens = set(_tokenize(clean_q_compact))
    f_tokens = set(_tokenize(clean_f_compact))
    if not q_tokens or not f_tokens:
        return 0.0

    intersection = q_tokens & f_tokens
    if not intersection:
        return 0.0

    containment = len(intersection) / len(f_tokens)
    jaccard = len(intersection) / len(q_tokens | f_tokens)
    seq_ratio = difflib.SequenceMatcher(None, clean_q_compact, clean_f_compact).ratio()

    # Взвешенная оценка сходства
    score = (containment * 0.5) + (jaccard * 0.3) + (seq_ratio * 0.2)
    return round(score, 3)


class AiChatService:
    def __init__(self) -> None:
        self._cached_prompt: str | None = None
        self._chunks: list[dict[str, Any]] = []
        self._bm25: SimpleBM25 | None = None
        self._core_summary: str = ""
        self._settings: CachedAiSettings | None = None

    def invalidate_settings_cache(self) -> None:
        """Сбрасывает кэш настроек ИИ для немедленного перечитывания из БД."""
        self._settings = None

    async def reload_settings(self) -> CachedAiSettings:
        """Принудительно перезагружает настройки ИИ из базы данных."""
        self._settings = None
        return await self.get_settings()

    async def get_settings(self) -> CachedAiSettings:
        if self._settings is not None:
            return self._settings

        self._settings = await self._load_settings_from_db()

        # Синхронизируем параметры rate-лимитера (минутный лимит)
        try:
            from app.services.rate_limiter import chat_rate_limiter
            chat_rate_limiter.minute_limit = self._settings.minute_limit
        except Exception as e:
            logger.warning(f"Не удалось обновить параметры rate-лимитера: {e}")

        return self._settings

    async def _load_settings_from_db(self) -> CachedAiSettings:
        try:
            from app.database import AsyncSessionLocal
            from app.models import AiSettings
            from sqlalchemy import select

            async with AsyncSessionLocal() as session:
                res = await session.execute(select(AiSettings).limit(1))
                row = res.scalars().first()
                if not row:
                    default_prompt = self._load_system_prompt()
                    row = AiSettings(
                        is_active=True,
                        model=settings.ai_model,
                        temperature=0.4,
                        max_tokens=450,
                        base_url=None,
                        rag_threshold=0.5,
                        rag_top_k=2,
                        custom_stop_words="",
                        system_prompt=default_prompt,
                        fast_responses_json=json.dumps(DEFAULT_FAST_RESPONSES, ensure_ascii=False),
                        minute_limit=15,
                    )
                    session.add(row)
                    await session.commit()
                    await session.refresh(row)

                fast_resp_raw = getattr(row, "fast_responses_json", None)
                parsed_rules = _parse_fast_responses(fast_resp_raw)
                if not fast_resp_raw or fast_resp_raw == "[]":
                    row.fast_responses_json = json.dumps([
                        {"id": r.id, "title": r.title, "triggers": r.triggers, "response": r.response, "is_active": r.is_active}
                        for r in parsed_rules
                    ], ensure_ascii=False)
                    session.add(row)
                    await session.commit()

                return CachedAiSettings(
                    is_active=row.is_active,
                    model=row.model or settings.ai_model,
                    temperature=row.temperature,
                    max_tokens=row.max_tokens,
                    base_url=row.base_url,
                    rag_threshold=row.rag_threshold,
                    rag_top_k=row.rag_top_k,
                    faq_threshold=row.faq_threshold if hasattr(row, "faq_threshold") else 0.9,
                    custom_stop_words=_parse_custom_stop_words(row.custom_stop_words),
                    system_prompt=row.system_prompt or self._load_system_prompt(),
                    fast_responses=parsed_rules,
                    minute_limit=row.minute_limit if hasattr(row, "minute_limit") else 15,
                )
        except Exception as e:
            logger.warning(f"Не удалось прочитать AiSettings из БД, используются значения по умолчанию: {e}")
            return CachedAiSettings(
                system_prompt=self._load_system_prompt(),
                model=settings.ai_model,
                fast_responses=[FastResponseRule(**r) for r in DEFAULT_FAST_RESPONSES],
                faq_threshold=0.9,
            )

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

    def _ensure_kb_index(self, custom_stops: set[str] | None = None) -> None:
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
                doc_tokens.append(_tokenize(text, custom_stops=custom_stops))
            self._bm25 = SimpleBM25(doc_tokens)
            self._core_summary = self._build_core_summary()
        except Exception as e:
            logger.warning(f"Не удалось инициализировать RAG индекс базы знаний: {e}")

    def _retrieve_relevant_kb(
        self,
        query: str,
        top_k: int = 2,
        threshold: float = 0.5,
        custom_stops: set[str] | None = None,
    ) -> str:
        self._ensure_kb_index(custom_stops=custom_stops)
        if not self._bm25 or not self._chunks:
            return self._core_summary

        tokens = _tokenize(query, custom_stops=custom_stops)
        if not tokens:
            return "Digital-агентство Велкод: разработка сайтов под ключ, чат-ботов и автоматизация бизнеса."

        scores = self._bm25.get_scores(tokens)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

        # Адаптивный RAG: отбираем только чанки с достаточной уверенностью (score >= threshold)
        selected = [self._chunks[i] for i in top_indices if scores[i] >= threshold]
        if not selected:
            # Для общих и коммуникационных фраз экономим токены — не раздуваем контекст полной базой
            return "Digital-агентство Велкод: разработка сайтов под ключ, чат-ботов и автоматизация бизнеса."

        parts = [self._core_summary, "\n### Справочная информация по вопросу:"]
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

    def _match_conversational_fast_path(
        self,
        message: str,
        topic: str | None = None,
        existing_prefill: ChatPrefill | None = None,
        cfg: CachedAiSettings | None = None,
    ) -> ChatResponse | None:
        """Быстрый ответ без вызова LLM на основе динамических наборов слов (правил)."""
        clean = re.sub(r"[?!.,;:«»\"'()~`\-_/\\]", " ", message).strip().lower()
        clean_compact = " ".join(clean.split())
        if not clean_compact:
            return None

        rules = cfg.fast_responses if (cfg and cfg.fast_responses) else [
            FastResponseRule(**r) for r in DEFAULT_FAST_RESPONSES
        ]

        clean_words = set(clean_compact.split())

        for rule in rules:
            if not rule.is_active:
                continue

            for raw_trig in rule.triggers:
                clean_trig = re.sub(r"[?!.,;:«»\"'()~`\-_/\\]", " ", raw_trig).strip().lower()
                clean_trig = " ".join(clean_trig.split())
                if not clean_trig:
                    continue

                matched = False
                # 1. Точное совпадение всей фразы сообщения (например, «до свидания», «привет»)
                if clean_compact == clean_trig:
                    matched = True
                # 2. Если фраза триггера многословная (например «до скорого») и целиком содержится в коротком сообщении
                elif len(clean_trig.split()) > 1 and clean_trig in clean_compact and len(clean_compact.split()) <= len(clean_trig.split()) + 1:
                    matched = True
                # 3. Если сообщение состоит из 1-2 вводных слов и ключевого слова (например, «ну пока», «да спасибо»)
                elif len(clean_compact.split()) <= 2 and clean_trig in clean_words:
                    matched = True

                if matched:
                    rule_topic = "Консультация" if rule.id in ("rule_greeting", "rule_gratitude", "rule_confirmation", "greeting", "gratitude", "confirmation", "custom_greeting") else rule.title
                    return ChatResponse(
                        text=rule.response,
                        topic=topic or rule_topic,
                        actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
                        show_lead_form=False,
                        prefill=existing_prefill,
                    )

        return None

    def _find_faq_answer(self, query: str, threshold: float = 0.9) -> tuple[str, str] | None:
        """Ищет совпадение с вопросом FAQ по порогу сходства (по умолчанию >= 0.9)."""
        self._ensure_kb_index()
        best_title = None
        best_answer = None
        best_score = 0.0

        for chunk in self._chunks:
            if chunk.get("category") == "faq":
                title = chunk.get("title", "")
                score = _calculate_faq_similarity(query, title)
                if score > best_score:
                    best_score = score
                    content = chunk.get("content", "")
                    match = re.search(r"Ответ:\s*(.+)", content, re.DOTALL)
                    best_answer = match.group(1).strip() if match else content
                    best_title = title

        if best_score >= threshold and best_title and best_answer:
            return best_title, best_answer
        return None

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
        cfg = await self.get_settings()
        if not cfg.is_active:
            return ChatResponse(
                text="ИИ-консультант временно отключен. Вы можете оставить заявку через форму ниже или связаться с нами напрямую по контактам на сайте.",
                topic=topic or "Консультация",
                actions=[ChatAction(label="Оставить заявку", actionKey="show_lead_form", primary=True)],
                show_lead_form=True,
                prefill=existing_prefill,
            )

        # 1. Быстрый ответ на типовые реплики (приветствия, благодарности, подтверждения) без вызова LLM
        fast_conv = self._match_conversational_fast_path(message, topic, existing_prefill, cfg=cfg)
        if fast_conv:
            return fast_conv

        # 2. Поиск ответа в FAQ по порогу сходства (по умолчанию >= 0.9) без вызова LLM
        faq_match = self._find_faq_answer(message, threshold=cfg.faq_threshold)
        if faq_match:
            faq_title, faq_answer = faq_match
            return ChatResponse(
                text=self._auto_format_links(faq_answer),
                topic=topic or faq_title,
                actions=[ChatAction(label="Обсудить проект", actionKey="show_lead_form", primary=True)],
                show_lead_form=False,
                prefill=existing_prefill,
            )

        api_key = self._get_api_key()
        if not api_key:
            return self._fallback_response(topic)

        system_prompt = cfg.system_prompt or self._load_system_prompt()
        search_query = f"{topic or ''} {message}".strip()
        kb_summary = self._retrieve_relevant_kb(
            search_query,
            top_k=cfg.rag_top_k,
            threshold=cfg.rag_threshold,
            custom_stops=cfg.custom_stop_words,
        )

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

        base_url = (cfg.base_url or settings.ai_base_url).rstrip("/")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        body: dict[str, Any] = {
            "model": cfg.model,
            "messages": payload_messages,
            "response_format": {"type": "json_object"},
            "temperature": cfg.temperature,
            "max_tokens": cfg.max_tokens,
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
