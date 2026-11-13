import datetime as dt
import logging
import time

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Lead
from app.notifications import notify_new_lead
from app.schemas import LeadCreate, LeadOut

logger = logging.getLogger("velcode.leads")
router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


def _is_bot(payload: LeadCreate) -> bool:
    """Проверка на спам-бота по методу проекта vangerrf:
    1. Honeypot: скрытое поле website не должно быть заполнено.
    2. JS-токен: фронтенд должен передать 'front_js_passed'.
    3. Тайминг: форма должна быть отправлена не быстрее чем за 3.0 секунды.
    """
    if (payload.website or "").strip():
        return True
    if payload.js_token != "front_js_passed":
        return True
    try:
        if payload.form_opened_at is None:
            return True
        if time.time() - float(payload.form_opened_at) < 3.0:
            return True
    except (ValueError, TypeError):
        return True
    return False


@router.post("", response_model=LeadOut, status_code=201)
async def create_lead(payload: LeadCreate, db: AsyncSession = Depends(get_db)) -> Lead:
    if _is_bot(payload):
        logger.warning(
            "Спам-бот отклонён (anti-bot vangerrf): name=%r phone=%r website=%r form_opened_at=%r js_token=%r",
            payload.name,
            payload.phone,
            payload.website,
            payload.form_opened_at,
            payload.js_token,
        )
        # Возвращаем 201 с id=0, чтобы бот не пытался повторно слать запрос
        return Lead(
            id=0,
            name=payload.name,
            phone=payload.phone,
            question=payload.question,
            source=payload.source,
            created_at=dt.datetime.now(dt.timezone.utc),
        )

    lead = Lead(
        name=payload.name,
        phone=payload.phone,
        question=payload.question,
        source=payload.source,
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    await notify_new_lead(lead)

    return lead
