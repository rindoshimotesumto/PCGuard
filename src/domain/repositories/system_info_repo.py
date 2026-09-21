from abc import ABC, abstractmethod

from src.domain.entities.system_info import (
    SystemInfo,
    System,
    CPU,
    GPU,
    RAM
)


class SystemInfoRepositories(ABC):
    """
    Получение информации о системе.
    """
    
    @abstractmethod
    def get_current_info(self) -> SystemInfo:
        ...

    @abstractmethod
    def _get_cpu(self) -> CPU:
        ...

    @abstractmethod
    def _get_gpu(self) -> GPU | None:
        ...

    @abstractmethod
    def _get_ram(self) -> RAM:
        ...

    @abstractmethod
    def _get_system(self) -> System:
        ...