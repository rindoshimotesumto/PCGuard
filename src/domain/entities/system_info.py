
from dataclasses import dataclass


@dataclass(kw_only=True)
class Metrics:
    usage_percent: float
    temperature_celsius: float | None = None


@dataclass(kw_only=True)
class CPU(Metrics):
    """
    CPU - процессор
    """

    model: str
    manufacturer: str
    cores_physical: int| None
    cores_logical: int| None
    base_clock_ghz: float


@dataclass(kw_only=True)
class GPU(Metrics):
    """
    GPU - видеокарта
    """
    model: str
    manufacturer: str
    vram_total_mb: int


@dataclass(kw_only=True)
class RAM(Metrics):
    """
    RAM - оперативная память
    """
    total_bytes: int
    ram_type: str
    speed_mhz: int


@dataclass(kw_only=True)
class System:
    """
    System - система
    """
    name: str
    edition: str
    version: str
    architecture: str


@dataclass(kw_only=True)
class SystemInfo:
    """
    SystemInfo - системаная информация
    """
    cpu: CPU
    gpu: GPU | None
    ram: RAM
    system: System