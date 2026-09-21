from src.domain.entities.system_info import (
    SystemInfo,
    System,
    CPU,
    GPU,
    RAM
)

from src.domain.repositories.system_info_repo import SystemInfoRepositories


class SystemInfoUseCase:

    def __init__(self, repo: SystemInfoRepositories) -> None:
        self.repo = repo

    def get_current_info(self) -> SystemInfo:
        return self.repo.get_current_info()

    def _get_cpu(self) -> CPU:
        return self.repo._get_cpu()

    def _get_gpu(self) -> GPU | None:
        return self.repo._get_gpu()

    def _get_ram(self) -> RAM:
        return self.repo._get_ram()

    def _get_system(self) -> System:
        return self.repo._get_system()