from __future__ import annotations

import datetime as dt

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
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
    description: Mapped[str] = mapped_column(Text, default="")
    price_full: Mapped[int] = mapped_column(Integer, nullable=False)
    price_discount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)  # час / блок / проект
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
    # Теги через запятую, например "Веб-разработка, Битрикс24"
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)
    show_on_main: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


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
