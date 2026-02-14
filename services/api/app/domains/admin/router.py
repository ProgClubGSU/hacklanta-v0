from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])

# TODO: Admin-only endpoints for applicant review, bulk actions, email
