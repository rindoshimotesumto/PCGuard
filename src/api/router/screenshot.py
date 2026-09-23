from fastapi import APIRouter, Response

from src.metrics.screenshot import Screenshot
from src.scripts.screenshot import ScreenshotsService
from src.api.schema.screenshot import ScreenshotSchema


router = APIRouter(
    prefix="/screenshot",
    tags=["Screenshot Service"]
)

screenshot_service = ScreenshotsService()


@router.get("/current")
def get_current_screenshot() -> list[ScreenshotSchema]:
    screenshot = screenshot_service.get_schreenshots()

    return [
        ScreenshotSchema(
            monitor=s.monitor,
            width=s.width,
            height=s.height,
            size_mb=s.size_mb,
            timestamp=s.timestamp,
            base64=s.base64
        )

        for s in screenshot
    ]


@router.get("/current-png")
def get_current_screenshot_png() -> Response:
    screenshots = screenshot_service.get_schreenshots()

    return Response(
        content=screenshots[0].image,
        media_type="image/png"
    )