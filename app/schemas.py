from __future__ import annotations

import datetime as dt
import re

from pydantic import BaseModel, ConfigDict, field_validator


# ---------- Категории и услуги (только на чтение — правим через таблицу/сид) ----------

class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: str | None = None
    sort_order: int


class ServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    price_full: int
    price_discount: int | None = None
    unit: str
    image_url: str | None = None
    is_featured: bool = False
    sort_order: int
    categories: list[CategoryOut] = []


class FaqOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question: str
    answer: str
    sort_order: int


class PortfolioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str | None = None
    title: str
    description: str
    image_url: str | None = None
    hero_image_url: str | None = None
    site_url: str | None = None
    tags: str | None = None
    what_was_done: str | None = None
    show_on_main: bool = False
    sort_order: int


# ---------- Заявки ----------

class LeadCreate(BaseModel):
    name: str
    phone: str
    question: str | None = None
    source: str = "contact_form"
    # Согласие с политикой обработки персональных данных — обязательный чекбокс на фронте
    consent: bool

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Укажите имя")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10:
            raise ValueError("Укажите корректный номер телефона")
        return v.strip()

    @field_validator("consent")
    @classmethod
    def consent_required(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Нужно согласие на обработку персональных данных")
        return v


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    question: str | None
    source: str
    created_at: dt.datetime
