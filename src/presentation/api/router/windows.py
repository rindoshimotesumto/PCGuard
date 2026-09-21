from fastapi import APIRouter

from src.domain.entities.system_info import SystemInfo
from src.infrastructure.scripts.windows.system_info import WindowsSystemInfoRepository

router = APIRouter(
    prefix="/windows",
    tags=["Windows"]
)

win_repo = WindowsSystemInfoRepository()


@router.get("/current")
def get_current_info() -> SystemInfo:
    return win_repo.get_current_info()