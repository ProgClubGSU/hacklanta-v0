from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from svix.webhooks import Webhook, WebhookVerificationError

from app.core.config import settings
from app.core.database import get_session
from app.domains.users.repository import upsert_user

router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/clerk", status_code=status.HTTP_200_OK)
async def clerk_webhook(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
    svix_id: Annotated[str | None, Header()] = None,
    svix_timestamp: Annotated[str | None, Header()] = None,
    svix_signature: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    """Handle Clerk webhook events (user.created, user.updated)."""
    body = await request.body()

    if not all([svix_id, svix_timestamp, svix_signature]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing svix headers",
        )

    wh = Webhook(settings.clerk_webhook_secret)
    try:
        payload = wh.verify(
            body,
            {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            },
        )
    except WebhookVerificationError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        ) from err

    event_type = payload.get("type")
    data = payload.get("data", {})

    if event_type in ("user.created", "user.updated"):
        email = ""
        for addr in data.get("email_addresses", []):
            if addr.get("id") == data.get("primary_email_address_id"):
                email = addr.get("email_address", "")
                break

        await upsert_user(
            session,
            clerk_id=data["id"],
            email=email,
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            avatar_url=data.get("image_url"),
        )

    return {"status": "ok"}
