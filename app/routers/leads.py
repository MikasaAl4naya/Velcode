from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Lead
from app.notifications import notify_new_lead
from app.schemas import LeadCreate, LeadOut

router = APIRouter(prefix="/api/v1/leads", tags=["leads"])


@router.post("", response_model=LeadOut, status_code=201)
async def create_lead(payload: LeadCreate, db: AsyncSession = Depends(get_db)) -> Lead:
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
