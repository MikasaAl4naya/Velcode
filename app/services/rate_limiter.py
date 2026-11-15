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
    """Многоуровневый rate-лимитер для защиты чата с ИИ от спама и исчерпания квоты."""

    def __init__(
        self,
        burst_limit: int = 4,
        burst_window: float = 6.0,
        minute_limit: int = 15,
        minute_window: float = 60.0,
        hourly_limit: int = 60,
        hourly_window: float = 3600.0,
    ):
        self.burst_limit = burst_limit
        self.burst_window = burst_window
        self.minute_limit = minute_limit
        self.minute_window = minute_window
        self.hourly_limit = hourly_limit
        self.hourly_window = hourly_window

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
            # 1. Защита от дублей: то же самое сообщение чаще раза в 4 секунды
            last_text, last_time = self._last_message.get(ip, ("", 0.0))
            if normalized_msg == last_text and (now - last_time) < 4.0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Вы уже отправили этот вопрос. Пожалуйста, подождите несколько секунд.",
                )

            # Очистка устаревших отметок времени старше 1 часа
            timestamps = self._history[ip]
            cutoff = now - self.hourly_window
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            # 2. Часовой лимит (максимум 60 обращений в час на 1 IP)
            if len(timestamps) >= self.hourly_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Превышен часовой лимит обращений к ИИ-консультанту. Пожалуйста, свяжитесь с нами напрямую по контактам на сайте.",
                )

            # 3. Минутный лимит (максимум 15 обращений в минуту на 1 IP)
            minute_cutoff = now - self.minute_window
            minute_count = sum(1 for t in timestamps if t >= minute_cutoff)
            if minute_count >= self.minute_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Слишком много запросов. Пожалуйста, подождите минуту перед следующим вопросом.",
                )

            # 4. Burst лимит (максимум 4 обращения за 6 секунд — от кликеров и скриптов)
            burst_cutoff = now - self.burst_window
            burst_count = sum(1 for t in timestamps if t >= burst_cutoff)
            if burst_count >= self.burst_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Вы отправляете вопросы слишком быстро. Подождите пару секунд.",
                )

            # Фиксируем запрос
            timestamps.append(now)
            self._last_message[ip] = (normalized_msg, now)

            # Периодическая очистка словаря от неактивных IP
            if len(self._history) > 2000:
                self._prune_stale(now)

    def _prune_stale(self, now: float) -> None:
        cutoff = now - self.hourly_window
        stale_ips = [ip for ip, q in self._history.items() if not q or q[-1] < cutoff]
        for ip in stale_ips:
            self._history.pop(ip, None)
            self._last_message.pop(ip, None)


chat_rate_limiter = ChatRateLimiter()
