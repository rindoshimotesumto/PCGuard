from PIL import Image
from datetime import datetime
from dataclasses import dataclass


@dataclass
class Screenshot:
    monitor: int

    width: int
    height: int

    image: bytes
    size_mb: float

    timestamp: datetime

    base64: str | None = None