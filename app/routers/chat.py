from fastapi import APIRouter
from app.schemas import ChatRequest, ChatResponse
from app.services.ai_chat import ai_chat_service

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    """Эндпоинт интеллектуального консультанта Velcode."""
    return await ai_chat_service.ask(
        request.message, request.history, request.topic, request.prefill
    )
