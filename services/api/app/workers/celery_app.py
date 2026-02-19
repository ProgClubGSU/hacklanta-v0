from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "hacklanta",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/New_York",
    enable_utc=True,
    broker_transport_options={"socket_timeout": 5, "socket_connect_timeout": 5},
)

celery_app.autodiscover_tasks(["app.workers"])
