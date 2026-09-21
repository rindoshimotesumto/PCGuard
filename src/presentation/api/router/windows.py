import base64

from io import BytesIO
from fastapi import APIRouter

from src.domain.entities.system_info import SystemInfo
from src.domain.entities.network_metrics import NetworkMetrics
from src.domain.entities.browser_activity import BrowserActivity

from src.infrastructure.scripts.windows.system_info import WindowsSystemInfoRepository
from src.infrastructure.scripts.windows.network import WindowsNetworkService
from src.infrastructure.scripts.windows.screenshot import WindowsScreenshotsService
from src.infrastructure.scripts.windows.process import WindowsProcessesService

from src.application.use_cases.browser_activity_use_case import BrowserActivityUseCase
from src.infrastructure.scripts.windows.browser_activity import WindowsBrowserActivityRepository


router = APIRouter(
    prefix="/windows",
    tags=["Windows"]
)

win_repo = WindowsSystemInfoRepository()
network_service = WindowsNetworkService()
screen_service = WindowsScreenshotsService()
process_service = WindowsProcessesService()
browser_service = BrowserActivityUseCase(
    WindowsBrowserActivityRepository()
)

@router.get("/current-metrics")
async def get_current_info() -> SystemInfo:
    return win_repo.get_current_info()


@router.get("/network-metrics")
async def get_ethernet_info() -> NetworkMetrics:
    return network_service.get_usage()


@router.get("/screenshots")
async def get_screenshots():
    screenshots = screen_service.get_screenshots()

    result = []

    for image in screenshots:
        buffer = BytesIO()

        image.save(
            buffer,
            format="PNG",
        )

        encoded = base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")

        result.append(
            f"data:image/png;base64,{encoded}"
        )

    return result


@router.get("/proccesses")
async def get_processes():
    return process_service.get_all()


@router.get("/browser/current")
def get_current_browser_activity() -> BrowserActivity | None:
    return browser_service.get_current()


@router.get("/browser/history")
def get_browser_history() -> list[BrowserActivity]:
    return browser_service.get_history()