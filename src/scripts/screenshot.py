import mss
import base64

from PIL import Image
from io import BytesIO
from datetime import datetime
from screeninfo import get_monitors

from src.metrics.screenshot import Screenshot


class ScreenshotsService:

    def get_schreenshots(self) -> list[Screenshot]:
        screenshots: list[Screenshot] = []
        monitors = get_monitors()

        with mss.mss() as sct:
            for index, monitor in enumerate(monitors, start=1):

                region = {
                    "left": monitor.x,
                    "top": monitor.y,
                    "width": monitor.width,
                    "height": monitor.height,
                }

                raw = sct.grab(region)

                image = Image.frombytes(
                    "RGB",
                    raw.size,
                    raw.rgb,
                )

                image_bytes = self._to_bytes(image)
                image_base64 = self._to_base64(image_bytes)
                image_size_mb = self._get_size(image_bytes)

                screenshots.append(
                    Screenshot(
                        monitor=index,
                        width=monitor.width,
                        height=monitor.height,

                        image=image_bytes,
                        base64=image_base64,

                        size_mb=image_size_mb,
                        timestamp=datetime.now(),
                    )
                )

        return screenshots

    def _to_bytes(self, image: Image.Image) -> bytes:
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()

    def _to_base64(self, image_bytes: bytes) -> str:
        return base64.b64encode(image_bytes).decode("utf-8")

    def _get_size(self, image_bytes: bytes) -> float:
        return len(image_bytes) / (1024 ** 2)