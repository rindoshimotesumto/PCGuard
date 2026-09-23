import mss
import base64
from PIL import Image
from io import BytesIO
from datetime import datetime

from src.metrics.screenshot import Screenshot


class ScreenshotsService:

    def get_schreenshots(self) -> list[Screenshot]:

        screenshots: list[Screenshot] = []

        with mss.MSS() as sct:
            monitor_id = 0

            for m in sct.monitors[1:]:
                monitor_id += 1

                screenshot = sct.grab(m)

                screenshot_img_type=Image.frombytes(
                    "RGB",
                    screenshot.size,
                    screenshot.rgb
                )

                image_bytes = self._to_bytes(screenshot_img_type)
                image_size_mb = self._get_size(image_bytes)

                screenshots.append(
                    Screenshot(
                        monitor=monitor_id,
                        width=screenshot.width,
                        height=screenshot.height,

                        image=image_bytes,
                        base64=self._to_base64(image_bytes),

                        size_mb=image_size_mb,
                        timestamp=datetime.now()
                    )
                )

        return screenshots


    def _to_bytes(self, image: Image.Image) -> bytes:
        buffer = BytesIO()
        image.save(buffer, format="PNG")

        return buffer.getvalue()


    def _to_base64(self, image_bytes: bytes) -> str:
        return base64.b64encode(image_bytes).decode()


    def _get_size(self, image_bytes: bytes) -> float:
        return len(image_bytes) / (1024**2)
