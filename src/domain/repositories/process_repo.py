from abc import ABC, abstractmethod

from src.domain.entities.process import Process


class ProcessRepository(ABC):

    @abstractmethod
    def get_all(self) -> list[Process]:
        ...

    @abstractmethod
    def get_by_pid(self, pid: int) -> Process | None:
        ...

    @abstractmethod
    def is_running(self, name: str) -> bool:
        ...