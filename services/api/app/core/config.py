from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    # Database
    database_url: str = "postgresql+asyncpg://dev:dev@localhost:5432/hackathon"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Clerk
    clerk_secret_key: str = ""
    clerk_webhook_secret: str = ""

    # AWS
    aws_region: str = "us-east-1"
    aws_ses_from_email: str = "noreply@hacklanta.com"
    s3_bucket_name: str = "hacklanta-uploads"

    # Cloudflare Turnstile
    turnstile_secret_key: str = ""

    # CORS — comma-separated string or JSON list, e.g. "https://hacklanta.com,https://www.hacklanta.com"
    cors_origins: str | list[str] = "http://localhost:4321"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> str:
        if isinstance(v, list):
            return ",".join(v)
        return str(v)

    # Sentry
    sentry_dsn: str = ""

    # Axiom
    axiom_token: str = ""
    axiom_dataset: str = "hacklanta-api"


settings = Settings()
