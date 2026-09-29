from dataclasses import dataclass
from datetime import datetime


@dataclass(kw_only=True)
class ProcessInfo:
    pid: int
    name: str
    path: str | None

    cpu_percent: float
    memory_percent: float
    gpu_percent: float | None

    status: str
    started_at: datetime | None