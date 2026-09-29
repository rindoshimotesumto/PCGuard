from dataclasses import dataclass


@dataclass(kw_only=True)
class CPU:
    model: str
    usage_percent: float


@dataclass(kw_only=True)
class GPU:
    model: str
    usage_percent: float | None


@dataclass(kw_only=True)
class RAM:
    total_gb: float
    generation: str | None
    speed_mhz: int | None
    usage_percent: float


@dataclass(kw_only=True)
class Disk:
    name: str
    total_gb: float
    usage_percent: float


@dataclass(kw_only=True)
class Monitor:
    name: str
    width: int
    height: int


@dataclass(kw_only=True)
class Printer:
    name: str


@dataclass(kw_only=True)
class SystemInfo:
    username: str
    device_name: str

    os: str
    architecture: str

    cpu: CPU
    gpu: GPU | None
    ram: RAM

    ip_address: str

    disks: list[Disk]
    monitors: list[Monitor]
    printers: list[Printer]