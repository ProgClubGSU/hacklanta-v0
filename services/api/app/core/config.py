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

    # Tally
    tally_signing_secret: str = ""

    # CORS — comma-separated or JSON array string
    cors_origins: str = "http://localhost:4321"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse cors_origins into a list for CORSMiddleware."""
        raw = self.cors_origins.strip()
        if raw.startswith("["):
            import json

            return json.loads(raw)
        return [s.strip() for s in raw.split(",")]

    # Debug (enables /docs in development; disabled in production)
    debug: bool = False

    # Sentry
    sentry_dsn: str = ""

    # Axiom
    axiom_token: str = ""
    axiom_dataset: str = "hacklanta-api"


settings = Settings()
