from dataclasses import dataclass
from datetime import datetime


@dataclass
class ScreenshotSchema:
    monitor: int

    width: int
    height: int

    size_mb: float

    timestamp: datetime
    base64: str | None = None