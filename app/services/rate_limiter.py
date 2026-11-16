import time
from collections import defaultdict, deque
from threading import Lock
from starlette.requests import Request
from fastapi import HTTPException, status


def get_client_ip(request: Request) -> str:
    """Извлекает реальный IP-адрес клиента с учётом Nginx reverse proxy."""
    # Заголовок X-Real-IP от Nginx
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    # Заголовок X-Forwarded-For
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # Прямой адрес клиента
    if request.client and request.client.host:
        return request.client.host.strip()

    return "unknown"


class ChatRateLimiter:
    """Rate-лимитер с защитой от спама в минуту и защитой от повторных кликов (дублей)."""

    def __init__(
        self,
        minute_limit: int = 15,
        minute_window: float = 60.0,
    ):
        self.minute_limit = minute_limit
        self.minute_window = minute_window

        self._history: dict[str, deque[float]] = defaultdict(deque)
        self._last_message: dict[str, tuple[str, float]] = {}
        self._lock = Lock()

    def check(self, ip: str, message: str) -> None:
        if ip == "127.0.0.1" or not ip:
            # Не блокируем внутренние системные вызовы
            return

        now = time.monotonic()
        normalized_msg = message.strip().lower()

        with self._lock:
            # 1. Защита от дублей: то же самое сообщение чаще раза в 3 секунды
            last_text, last_time = self._last_message.get(ip, ("", 0.0))
            if normalized_msg == last_text and (now - last_time) < 3.0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Вы уже отправили этот вопрос. Пожалуйста, подождите пару секунд.",
                )

            # Очистка устаревших отметок времени старше 1 минуты
            timestamps = self._history[ip]
            cutoff = now - self.minute_window
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            # 2. Минутный лимит (по умолчанию до 15 обращений в минуту на 1 IP)
            if len(timestamps) >= self.minute_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Слишком много запросов в минуту. Пожалуйста, подождите немного перед следующим вопросом.",
                )

            # Фиксируем запрос
            timestamps.append(now)
            self._last_message[ip] = (normalized_msg, now)

            # Периодическая очистка словаря от неактивных IP
            if len(self._history) > 2000:
                self._prune_stale(now)

    def _prune_stale(self, now: float) -> None:
        cutoff = now - self.minute_window
        stale_ips = [ip for ip, q in self._history.items() if not q or q[-1] < cutoff]
        for ip in stale_ips:
            self._history.pop(ip, None)
            self._last_message.pop(ip, None)


chat_rate_limiter = ChatRateLimiter()
