from dataclasses import dataclass
from datetime import datetime


@dataclass(kw_only=True)
class Process:
    pid: int
    name: str
    path: str | None
    status: str

    cpu_percent: float

    memory_percent: float
    memory_mb: float

    gpu_percent: float

    started_at: datetime