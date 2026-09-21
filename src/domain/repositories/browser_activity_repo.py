from abc import ABC, abstractmethod

from src.domain.entities.browser_activity import BrowserActivity


class BrowserActivityRepository(ABC):

    @abstractmethod
    def get_current(self) -> BrowserActivity | None:
        ...