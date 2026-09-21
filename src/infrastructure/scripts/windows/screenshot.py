import mss
from PIL import Image


class WindowsScreenshotsService:
    def get_screenshots(self) -> list[Image.Image]:
            images: list[Image.Image] = []

            with mss.mss() as sct:
                for monitor in sct.monitors[1:]:
                    shot = sct.grab(monitor)

                    image = Image.frombytes(
                        "RGB",
                        shot.size,
                        shot.rgb,
                    )

                    images.append(image)

            return images