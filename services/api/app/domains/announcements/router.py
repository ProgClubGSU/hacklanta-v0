from fastapi import APIRouter

router = APIRouter(prefix="/announcements", tags=["announcements"])

# TODO: GET /announcements (SSE stream), POST /announcements
