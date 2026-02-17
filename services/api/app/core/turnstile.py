from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(request: Request) -> dict:
    """Verify a Cloudflare Turnstile token from the X-Turnstile-Token header.

    Skips verification when ``turnstile_secret_key`` is empty (local dev).
    """
    secret = settings.turnstile_secret_key
    if not secret:
        return {"success": True}

    token = request.headers.get("X-Turnstile-Token", "")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bot verification failed",
        )

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            SITEVERIFY_URL,
            data={"secret": secret, "response": token},
        )

    result = resp.json()
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bot verification failed",
        )

    return result


VerifiedTurnstile = Annotated[dict, Depends(verify_turnstile)]
