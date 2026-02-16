import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.utils.email import render_template, send_email
from app.utils.models import EmailLog
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

# Celery tasks are sync, so use a sync engine
sync_engine = create_engine(settings.database_url.replace("+asyncpg", "+psycopg2"))


def _log_email(
    session: Session,
    *,
    recipient: str,
    subject: str,
    template: str,
    status: str = "sent",
    error: str | None = None,
) -> None:
    from sqlalchemy import func

    log = EmailLog(
        recipient_email=recipient,
        subject=subject,
        template=template,
        status=status,
        error=error,
        sent_at=func.now() if status == "sent" else None,
    )
    session.add(log)
    session.commit()


@celery_app.task(name="send_status_email", bind=True, max_retries=3)
def send_status_email(
    self,
    *,
    to: str,
    name: str,
    template_name: str,
) -> dict:
    """Send a status change email (received, accepted, rejected, waitlisted)."""
    try:
        subject, html_body = render_template(template_name, name=name)
        send_email(to=to, subject=subject, html_body=html_body)

        with Session(sync_engine) as session:
            _log_email(session, recipient=to, subject=subject, template=template_name)

        return {"status": "sent", "to": to, "template": template_name}
    except Exception as exc:
        logger.exception("Failed to send %s email to %s", template_name, to)

        with Session(sync_engine) as session:
            _log_email(
                session,
                recipient=to,
                subject=f"[FAILED] {template_name}",
                template=template_name,
                status="failed",
                error=str(exc),
            )

        raise self.retry(exc=exc, countdown=60 * (2**self.request.retries)) from exc


@celery_app.task(name="send_mass_email", bind=True)
def send_mass_email(
    self,
    *,
    recipients: list[dict],
    template_name: str,
) -> dict:
    """Send emails to a list of recipients. Each item: {email, name}."""
    sent = 0
    failed = 0

    for recipient in recipients:
        try:
            subject, html_body = render_template(
                template_name, name=recipient["name"]
            )
            send_email(to=recipient["email"], subject=subject, html_body=html_body)

            with Session(sync_engine) as session:
                _log_email(
                    session,
                    recipient=recipient["email"],
                    subject=subject,
                    template=template_name,
                )
            sent += 1
        except Exception:
            logger.exception("Failed to send to %s", recipient["email"])

            with Session(sync_engine) as session:
                _log_email(
                    session,
                    recipient=recipient["email"],
                    subject=f"[FAILED] {template_name}",
                    template=template_name,
                    status="failed",
                    error="Send failed",
                )
            failed += 1

    return {"sent": sent, "failed": failed, "total": len(recipients)}
