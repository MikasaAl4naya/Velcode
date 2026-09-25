from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Настройки приложения. Всё берётся из переменных окружения (.env),
    со значениями по умолчанию для локальной разработки.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # По умолчанию — файловая SQLite, для прод можно подставить
    # postgresql+asyncpg://user:pass@host/dbname через переменную окружения DATABASE_URL
    database_url: str = "sqlite+aiosqlite:///./velcode.db"

    # SMTP для уведомлений (inbox.ru → smtp.mail.ru:465)
    smtp_host: str = "smtp.mail.ru"
    smtp_port: int = 465
    smtp_user: str = ""
    smtp_password: str = ""
    notify_email: str = ""  # куда слать письмо

    # Битрикс24: входящий вебхук для crm.lead.add
    bitrix_webhook_url: str = ""

    cors_origins: list[str] = ["http://localhost:3000", "https://velcode.ru"]


settings = Settings()
