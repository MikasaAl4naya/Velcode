import logging
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.config import settings
from app.models import Lead

logger = logging.getLogger("velcode.notifications")


async def notify_new_lead(lead: Lead) -> None:
    """Отправляет уведомление о заявке по всем настроенным каналам."""
    await _send_email(lead)
    await _send_to_bitrix(lead)


async def _send_email(lead: Lead) -> None:
    if not settings.smtp_user or not settings.notify_email:
        return

    body = (
        f"Новая заявка #{lead.id}\n\n"
        f"Имя:     {lead.name}\n"
        f"Телефон: {lead.phone}\n"
    )
    if lead.question:
        body += f"Вопрос:  {lead.question}\n"
    body += f"Источник: {lead.source}\n"

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = f"Новая заявка с velcode.ru — {lead.name}"
    msg["From"] = settings.smtp_user
    msg["To"] = settings.notify_email

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=True,
        )
        logger.info("Email-уведомление отправлено (заявка #%s)", lead.id)
    except Exception:
        logger.exception("Ошибка отправки email (заявка #%s)", lead.id)


async def _send_to_bitrix(lead: Lead) -> None:
    if not settings.bitrix_webhook_url:
        return

    url = settings.bitrix_webhook_url.rstrip("/") + "/crm.lead.add.json"

    comments = lead.question or ""
    if lead.source and lead.source != "contact_form":
        comments = f"[Источник: {lead.source}]\n{comments}".strip()

    payload = {
        "fields": {
            "TITLE": f"Заявка с сайта: {lead.name}",
            "NAME": lead.name,
            "PHONE": [{"VALUE": lead.phone, "VALUE_TYPE": "WORK"}],
            "COMMENTS": comments,
            "SOURCE_ID": "WEB",
            "SOURCE_DESCRIPTION": lead.source,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if data.get("error"):
                logger.error(
                    "Битрикс24 вернул ошибку (заявка #%s): %s",
                    lead.id,
                    data,
                )
            else:
                logger.info(
                    "Лид создан в Битрикс24 (заявка #%s, лид #%s)",
                    lead.id,
                    data.get("result"),
                )
    except Exception:
        logger.exception("Ошибка отправки в Битрикс24 (заявка #%s)", lead.id)
