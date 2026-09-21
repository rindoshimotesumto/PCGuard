from domain.entities.process import Process
from domain.repositories.process_repo import ProcessRepository


class ProcessesUseCase:

    def __init__(self, repo: ProcessRepository) -> None:
        self.repo = repo

    def get_all(self) -> list[Process]:
        return self.repo.get_all()

    def get_by_pid(self, pid: int) -> Process | None:
        return self.repo.get_by_pid(pid)

    def is_running(self, name: str) -> bool:
        return self.repo.is_running(name)