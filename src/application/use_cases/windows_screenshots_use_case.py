from PIL import Image

from src.domain.repositories.windows_screenshots_repo import ScreenshotRepository


class ScreenshotUseCase:

    def __init__(
        self,
        repo: ScreenshotRepository,
    ) -> None:
        self.repo = repo

    def get_screenshots(self) -> list[Image.Image]:
        return self.repo.get_screenshots()