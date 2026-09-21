from abc import ABC, abstractmethod

from PIL import Image


class ScreenshotRepository(ABC):

    @abstractmethod
    def get_screenshots(self) -> list[Image.Image]:
        ...