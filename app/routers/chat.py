from fastapi import APIRouter, Request
from app.schemas import ChatRequest, ChatResponse
from app.services.ai_chat import ai_chat_service
from app.services.rate_limiter import chat_rate_limiter, get_client_ip

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, request: Request) -> ChatResponse:
    """Эндпоинт интеллектуального консультанта Velcode с защитой от спама."""
    client_ip = get_client_ip(request)
    chat_rate_limiter.check(client_ip, payload.message)

    return await ai_chat_service.ask(
        payload.message, payload.history, payload.topic, payload.prefill
    )
