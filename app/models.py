from __future__ import annotations

import datetime as dt

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Услуга может входить в несколько разделов одновременно (в прайс-листе,
# например, "Разработка сайта под ключ" числится и в разделе 2 "Веб-разработка",
# и в разделе 0 "Под ключ" — служебный раздел-тег "показать во вкладке Все/Под ключ").
# Поэтому связь Service <-> Category — many-to-many, а не ForeignKey.
service_category = Table(
    "service_category",
    Base.metadata,
    Column("service_id", ForeignKey("services.id"), primary_key=True),
    Column("category_id", ForeignKey("categories.id"), primary_key=True),
)


class Category(Base):
    """Раздел услуг (вкладка-фильтр на сайте)."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Порядок отображения вкладки на сайте (по умолчанию — по id, как в прайсе)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    services: Mapped[list["Service"]] = relationship(
        secondary=service_category, back_populates="categories"
    )


class Service(Base):
    """Отдельная услуга (карточка в разделе)."""

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    short_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    price_full: Mapped[int] = mapped_column(Integer, nullable=False)
    price_discount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unit: Mapped[str] = mapped_column(String(32), nullable=False, default="за проект")
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    # Порядок карточки на сайте (колонка "Порядок для сайта" в прайсе)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    categories: Mapped[list["Category"]] = relationship(
        secondary=service_category, back_populates="services"
    )


class Faq(Base):
    """Вопрос-ответ для секции FAQ."""

    __tablename__ = "faq"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question: Mapped[str] = mapped_column(String(500), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


portfolio_tag = Table(
    "portfolio_tag",
    Base.metadata,
    Column("portfolio_id", ForeignKey("portfolio.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)


class Tag(Base):
    """Тег для кейсов портфолио."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    portfolios: Mapped[list["Portfolio"]] = relationship(
        secondary=portfolio_tag, back_populates="tags_list"
    )

    def __str__(self) -> str:
        return self.name


class Portfolio(Base):
    """Кейс/проект для раздела Портфолио."""

    __tablename__ = "portfolio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hero_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    site_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Строка-кэш тегов для API (автозаполняется из tags_list при сохранении в админке)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)
    what_was_done: Mapped[str | None] = mapped_column(Text, nullable=True)
    screenshots: Mapped[str | None] = mapped_column(Text, nullable=True)
    show_on_main: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    tags_list: Mapped[list["Tag"]] = relationship(
        secondary=portfolio_tag, back_populates="portfolios"
    )


class Lead(Base):
    """Заявка с сайта (форма 'Оставить заявку' / 'Получить бесплатный аудит')."""

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    question: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Откуда пришла заявка: hero-кнопка, форма в контактах, карточка услуги и т.п.
    # Полезно, когда на сайте появится несколько разных форм.
    source: Mapped[str] = mapped_column(String(64), default="contact_form")
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=lambda: dt.datetime.now(dt.timezone.utc)
    )


class CompanyContact(Base):
    """Контакты и реквизиты компании для сайта и базы знаний ИИ."""

    __tablename__ = "company_contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="ИП Манилат Виктория Пхетудоновна",
    )
    inn: Mapped[str] = mapped_column(String(32), nullable=False, default="381914585931")
    ogrnip: Mapped[str] = mapped_column(String(32), nullable=False, default="326385000117097")
    phone: Mapped[str] = mapped_column(String(64), nullable=False, default="+7 (924) 534 51 82")
    email: Mapped[str] = mapped_column(String(255), nullable=False, default="velcode@inbox.ru")
    telegram_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        default="https://t.me/VelcodeIRK",
    )
    max_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        default="https://max.ru/u/f9LHodD0cOIXsNCHlykOi9hpG3Q_0_ZRaXPmYzt9Yz_UgBRgZXjmEQBJXWg",
    )


class AiSettings(Base):
    """Глобальные настройки ИИ-консультанта, языковой модели и RAG."""

    __tablename__ = "ai_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Параметры LLM
    model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini")
    temperature: Mapped[float] = mapped_column(Float, default=0.4)
    max_tokens: Mapped[int] = mapped_column(Integer, default=450)
    base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # RAG и поиск по базе знаний
    rag_threshold: Mapped[float] = mapped_column(Float, default=0.5)
    rag_top_k: Mapped[int] = mapped_column(Integer, default=2)
    faq_threshold: Mapped[float] = mapped_column(Float, default=0.9)
    custom_stop_words: Mapped[str | None] = mapped_column(Text, nullable=True, default="")

    # Системный промпт
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Динамические правила быстрых ответов (наборы фраз и реакция в JSON)
    fast_responses_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")

    # Шаблоны быстрых ответов (fast-path без вызова LLM, совместимость)
    greeting_fast_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Здравствуйте! Чем можем вам помочь? Мы создаем современные сайты под ключ, разрабатываем чат-ботов и автоматизируем бизнес. Подсказать по услугам или рассчитать проект?",
    )
    gratitude_fast_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Пожалуйста! Если появятся вопросы или захотите обсудить проект — мы всегда на связи.",
    )
    confirmation_fast_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Договорились! Если потребуется расчёт или возникнут вопросы — напишите, я помогу сориентироваться.",
    )

    # Защита от спама (лимиты на IP)
    burst_limit: Mapped[int] = mapped_column(Integer, default=4)
    minute_limit: Mapped[int] = mapped_column(Integer, default=15)
    hourly_limit: Mapped[int] = mapped_column(Integer, default=60)


# ---------------------------------------------------------------------------
# Автоматический триггер пересборки базы знаний ИИ при любых изменениях в БД
# ---------------------------------------------------------------------------
from sqlalchemy import event


def _trigger_kb_rebuild(mapper, connection, target):
    try:
        from scripts.build_knowledge_base import trigger_knowledge_base_rebuild
        trigger_knowledge_base_rebuild()
    except Exception as e:
        print(f"[DB Trigger] Ошибка автообновления базы знаний: {e}")


def _trigger_ai_settings_reload(mapper, connection, target):
    try:
        from app.services.ai_chat import ai_chat_service
        ai_chat_service.invalidate_settings_cache()
    except Exception as e:
        print(f"[DB Trigger] Ошибка сброса кэша настроек ИИ: {e}")


for _model in (Service, Portfolio, Tag, Faq, CompanyContact):
    event.listen(_model, "after_insert", _trigger_kb_rebuild)
    event.listen(_model, "after_update", _trigger_kb_rebuild)
    event.listen(_model, "after_delete", _trigger_kb_rebuild)

event.listen(AiSettings, "after_update", _trigger_ai_settings_reload)
event.listen(AiSettings, "after_insert", _trigger_ai_settings_reload)
