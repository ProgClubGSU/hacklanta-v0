from typing import Annotated

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings

clerk_client = Clerk(bearer_auth=settings.clerk_secret_key)


async def get_current_user(request: Request) -> dict:
    """Verify Clerk JWT and return the token payload.

    Attaches the user's Clerk ID as payload["sub"].
    """
    request_state = clerk_client.authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=settings.clerk_secret_key,
        ),
    )

    if not request_state.is_signed_in:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(request_state.reason) if request_state.reason else "Not authenticated",
        )

    return request_state.payload


async def require_admin(
    user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Require the current user to have the 'admin' role via Clerk metadata."""
    metadata = user.get("metadata", {}) or {}
    public_metadata = user.get("public_metadata", {}) or {}

    role = metadata.get("role") or public_metadata.get("role") or user.get("org_role")

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return user


CurrentUser = Annotated[dict, Depends(get_current_user)]
AdminUser = Annotated[dict, Depends(require_admin)]
