"""Tally webhook endpoint for processing form submissions into applications."""

import hashlib
import hmac
import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.domains.applicants.models import Application
from app.domains.users.repository import get_user_by_email

logger = logging.getLogger(__name__)

router = APIRouter(tags=["webhooks"])

# ---------------------------------------------------------------------------
# Tally field-label → Application model-field mapping
#
# Keys are *lowercased* substrings matched against each Tally field label.
# Order matters — first match wins, so put more specific patterns first.
#
# Actual Tally form fields (q4dzZO):
#   Page 1: First Name, Last Name, School email address (.edu),
#           Personal email address, Phone number, T-Shirt Size,
#           Dietary Restrictions
#   Page 2: School/University, Major(s), Year of Study,
#           Graduation Date (Expected or Actual)
#   Page 3: What's your level of hackathon experience?,
#           How would you rate your programming abilities/experience…?,
#           Resume (file), GitHub Profile, LinkedIn Profile,
#           Personal Site/Portfolio, What's your favorite AI tool…?,
#           What's been your favorite class…?, What excites you?,
#           How did you hear about Hacklanta?, Anything else…?
# ---------------------------------------------------------------------------
FIELD_MAP: list[tuple[str, str]] = [
    # ── Contact (Page 1) ──────────────────────────────────────────────
    ("first name", "_first_name"),  # virtual — for user lookup
    ("last name", "_last_name"),  # virtual — for user lookup
    ("school email", "email"),  # "School email address (.edu)" → primary email
    (
        "personal email",
        "_personal_email",
    ),  # "Personal email address" → virtual, used for user lookup fallback
    ("phone", "phone_number"),  # "Phone number"
    # ── Logistics (Page 1) ────────────────────────────────────────────
    ("t-shirt", "tshirt_size"),  # "T-Shirt Size"
    ("dietary", "dietary_restrictions"),  # "Dietary Restrictions"
    # ── Academic (Page 2) — "school/university" must come AFTER "school email"
    ("school/university", "university"),  # "School/University"
    ("major", "major"),  # "Major(s)"
    ("year of study", "year_of_study"),  # "Year of Study"
    ("graduation", "graduation_date"),  # "Graduation Date (Expected or Actual)"
    # ── Candidate Profile (Page 3) ────────────────────────────────────
    ("hackathon experience", "experience_level"),  # "What's your level of hackathon experience?"
    # "How would you rate your programming abilities…" → no model column, skipped
    ("resume", "resume_url"),  # "Resume" (file upload — Tally sends a URL)
    ("github", "github_url"),  # "GitHub Profile"
    ("linkedin", "linkedin_url"),  # "LinkedIn Profile"
    # "Personal Site/Portfolio" → no model column, skipped
    # "What's your favorite AI tool…" → no model column, skipped
    # "What's been your favorite class…" → no model column, skipped
    ("what excites you", "why_attend"),  # "What excites you?" → closest to why_attend
    ("hear about", "how_did_you_hear"),  # "How did you hear about Hacklanta?"
    # "Anything else you'd like us to know?" → no model column, skipped
]


def _verify_tally_signature(body: bytes, signature: str) -> bool:
    """Verify the Tally webhook HMAC-SHA256 signature."""
    expected = hmac.new(
        settings.tally_signing_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def _match_field(label: str) -> str | None:
    """Return the Application model field name for a Tally field label."""
    lower = label.lower()
    for pattern, field_name in FIELD_MAP:
        if pattern in lower:
            return field_name
    return None


def _coerce_bool(value: Any) -> bool:
    """Convert a Tally field value to a boolean."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("yes", "true", "1", "on", "i agree", "i accept")
    if isinstance(value, list):
        # Tally checkboxes may send a list of selected option labels
        return len(value) > 0
    return bool(value)


def _extract_value(value: Any) -> str:
    """Flatten a Tally field value to a plain string."""
    if value is None:
        return ""
    if isinstance(value, list):
        # Multiple choice / checkbox group → comma-joined
        # Tally file uploads come as list of dicts with "url" key
        if value and isinstance(value[0], dict) and "url" in value[0]:
            return value[0]["url"]
        labels = []
        for item in value:
            if isinstance(item, dict):
                labels.append(item.get("label", item.get("value", str(item))))
            else:
                labels.append(str(item))
        return ", ".join(labels)
    if isinstance(value, dict):
        # Single file upload
        if "url" in value:
            return value["url"]
        return value.get("label", value.get("value", str(value)))
    return str(value)


def _parse_tally_fields(fields: list[dict]) -> dict[str, Any]:
    """Map Tally webhook fields to Application model column values."""
    app_data: dict[str, Any] = {}
    virtual: dict[str, str] = {}  # non-model fields like first/last name

    for field in fields:
        label = field.get("label", "")
        value = field.get("value")
        model_field = _match_field(label)

        if model_field is None:
            continue

        # Virtual fields (not stored in Application directly)
        if model_field.startswith("_"):
            virtual[model_field] = _extract_value(value)
            continue

        # Boolean fields
        if model_field in (
            "age_confirmed",
            "code_of_conduct_accepted",
            "liability_waiver_accepted",
            "resume_sharing_opt_in",
            "email_opt_in",
            "sms_opt_in",
        ):
            app_data[model_field] = _coerce_bool(value)
            continue

        app_data[model_field] = _extract_value(value)

    return {**app_data, "_virtual": virtual}


async def _get_user_by_email(session: AsyncSession, email: str):
    """Try to find an existing user by email so we can link the application."""
    if not email:
        return None
    return await get_user_by_email(session, email)


@router.post("/webhooks/tally", status_code=status.HTTP_200_OK)
async def tally_webhook(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, str]:
    """Handle Tally form submission webhooks.

    Receives form responses, maps fields to Application columns,
    and stores the application in the database.
    """
    body = await request.body()

    # ── Verify signature ──────────────────────────────────────────────
    signature = request.headers.get("tally-signature", "")
    if settings.tally_signing_secret and signature and not _verify_tally_signature(body, signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    # ── Parse payload ─────────────────────────────────────────────────
    payload = await request.json()
    event_type = payload.get("eventType")

    if event_type != "FORM_RESPONSE":
        # Only process form submissions
        return {"status": "ignored", "reason": f"event type: {event_type}"}

    data = payload.get("data", {})
    response_id = data.get("responseId", "")
    fields = data.get("fields", [])

    if not fields:
        logger.warning("Tally webhook with no fields: %s", response_id)
        return {"status": "ignored", "reason": "no fields"}

    # ── Deduplicate ───────────────────────────────────────────────────
    from sqlalchemy import select

    existing = await session.execute(
        select(Application).where(Application.tally_response_id == response_id)
    )
    if existing.scalar_one_or_none() is not None:
        logger.info("Duplicate Tally submission ignored: %s", response_id)
        return {"status": "duplicate"}

    # ── Map fields ────────────────────────────────────────────────────
    parsed = _parse_tally_fields(fields)
    virtual = parsed.pop("_virtual", {})
    app_data: dict[str, Any] = parsed

    # Try to link to an existing user by email (school email first, then personal)
    user_id = None
    email = app_data.get("email", "")
    personal_email = virtual.get("_personal_email", "")

    for candidate_email in (email, personal_email):
        if candidate_email:
            user = await _get_user_by_email(session, candidate_email)
            if user:
                user_id = user.id
                break

    # ── Create application ────────────────────────────────────────────
    application = Application(
        user_id=user_id,
        tally_response_id=response_id,
        status="pending",
        **{k: v for k, v in app_data.items() if v is not None and v != ""},
    )

    # Ensure required fields have fallback defaults
    if not application.university:
        application.university = "N/A"
    if not application.major:
        application.major = "N/A"
    if not application.year_of_study:
        application.year_of_study = "N/A"

    session.add(application)
    await session.commit()

    logger.info(
        "Tally application created: response_id=%s email=%s user_id=%s",
        response_id,
        email,
        user_id,
    )

    return {"status": "ok", "response_id": response_id}
