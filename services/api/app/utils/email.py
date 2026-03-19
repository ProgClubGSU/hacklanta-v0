# ruff: noqa: E501
import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Resend with the API key from settings
resend.api_key = settings.resend_api_key


def send_email(*, to: str, subject: str, html_body: str) -> dict:
    """Send an email via Resend. Returns the Resend response or raises on failure."""
    try:
        params: resend.Emails.SendParams = {
            "from": settings.aws_ses_from_email,  # reuses existing "from" address setting
            "to": [to],
            "subject": subject,
            "html": html_body,
        }
        response = resend.Emails.send(params)
        logger.info("Email sent to %s via Resend, id=%s", to, response.get("id"))
        return response
    except Exception as err:
        logger.error("Failed to send email to %s: %s", to, err)
        raise


TEMPLATES: dict[str, tuple[str, str]] = {
    "application_received": (
        "Hacklanta — Application Received",
        """
        <div style="background:#0a0a0a;color:#f5f5f5;font-family:'Courier New',monospace;padding:40px;max-width:600px;margin:0 auto;">
            <div style="border:1px solid #2a2a2a;padding:30px;">
                <h1 style="color:#00ff88;font-size:24px;margin:0 0 10px;">HACKLANTA</h1>
                <p style="color:#666;font-size:12px;margin:0 0 30px;">// application received</p>
                <p style="font-size:14px;line-height:1.6;">
                    Hey <strong style="color:#ffd700;">{name}</strong>,
                </p>
                <p style="font-size:14px;line-height:1.6;">
                    Your application to Hacklanta has been received. We'll review it and get back to you soon.
                </p>
                <p style="font-size:14px;line-height:1.6;">
                    Sit tight — the house is reviewing your hand.
                </p>
                <div style="margin-top:30px;border-top:1px solid #2a2a2a;padding-top:20px;">
                    <p style="color:#666;font-size:11px;">&#9824; &#9830; &#9827; &#9829; — Hacklanta by progsu</p>
                </div>
            </div>
        </div>
        """,
    ),
    "application_accepted": (
        "Hacklanta — You're In!",
        """
        <div style="background:#0a0a0a;color:#f5f5f5;font-family:'Courier New',monospace;padding:40px;max-width:600px;margin:0 auto;">
            <div style="border:1px solid #00ff88;padding:30px;">
                <h1 style="color:#00ff88;font-size:24px;margin:0 0 10px;">HACKLANTA</h1>
                <p style="color:#00ff88;font-size:12px;margin:0 0 30px;">// STATUS: ACCEPTED</p>
                <p style="font-size:14px;line-height:1.6;">
                    Hey <strong style="color:#ffd700;">{name}</strong>,
                </p>
                <p style="font-size:14px;line-height:1.6;">
                    You've been <strong style="color:#00ff88;">ACCEPTED</strong> to Hacklanta! You're in the game.
                </p>
                <p style="font-size:14px;line-height:1.6;">
                    Head to your dashboard to find a team and check the schedule. See you there.
                </p>
                <div style="margin-top:30px;border-top:1px solid #2a2a2a;padding-top:20px;">
                    <p style="color:#666;font-size:11px;">&#9824; &#9830; &#9827; &#9829; — Hacklanta by progsu</p>
                </div>
            </div>
        </div>
        """,
    ),
    "application_rejected": (
        "Hacklanta — Application Update",
        """
        <div style="background:#0a0a0a;color:#f5f5f5;font-family:'Courier New',monospace;padding:40px;max-width:600px;margin:0 auto;">
            <div style="border:1px solid #2a2a2a;padding:30px;">
                <h1 style="color:#00ff88;font-size:24px;margin:0 0 10px;">HACKLANTA</h1>
                <p style="color:#e63946;font-size:12px;margin:0 0 30px;">// STATUS: NOT SELECTED</p>
                <p style="font-size:14px;line-height:1.6;">
                    Hey <strong style="color:#ffd700;">{name}</strong>,
                </p>
                <p style="font-size:14px;line-height:1.6;">
                    Unfortunately, we weren't able to offer you a spot at Hacklanta this time. We had a ton of applications and limited seats.
                </p>
                <p style="font-size:14px;line-height:1.6;">
                    Keep building — we hope to see you at future progsu events.
                </p>
                <div style="margin-top:30px;border-top:1px solid #2a2a2a;padding-top:20px;">
                    <p style="color:#666;font-size:11px;">&#9824; &#9830; &#9827; &#9829; — Hacklanta by progsu</p>
                </div>
            </div>
        </div>
        """,
    ),
    "application_waitlisted": (
        "Hacklanta — You're on the Waitlist",
        """
        <div style="background:#0a0a0a;color:#f5f5f5;font-family:'Courier New',monospace;padding:40px;max-width:600px;margin:0 auto;">
            <div style="border:1px solid #00e5ff;padding:30px;">
                <h1 style="color:#00ff88;font-size:24px;margin:0 0 10px;">HACKLANTA</h1>
                <p style="color:#00e5ff;font-size:12px;margin:0 0 30px;">// STATUS: WAITLISTED</p>
                <p style="font-size:14px;line-height:1.6;">
                    Hey <strong style="color:#ffd700;">{name}</strong>,
                </p>
                <p style="font-size:14px;line-height:1.6;">
                    You've been placed on the <strong style="color:#00e5ff;">waitlist</strong> for Hacklanta. If a spot opens up, we'll let you know.
                </p>
                <p style="font-size:14px;line-height:1.6;">
                    Keep your cards close — you might still get dealt in.
                </p>
                <div style="margin-top:30px;border-top:1px solid #2a2a2a;padding-top:20px;">
                    <p style="color:#666;font-size:11px;">&#9824; &#9830; &#9827; &#9829; — Hacklanta by progsu</p>
                </div>
            </div>
        </div>
        """,
    ),
}


def render_template(template_name: str, **kwargs: str) -> tuple[str, str]:
    """Render an email template. Returns (subject, html_body)."""
    if template_name not in TEMPLATES:
        raise ValueError(f"Unknown email template: {template_name}")

    subject, body = TEMPLATES[template_name]
    return subject, body.format(**kwargs)
