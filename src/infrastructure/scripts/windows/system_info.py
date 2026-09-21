from dataclasses import replace

import GPUtil
import psutil
import pythoncom
import wmi

from src.domain.entities.system_info import (
    SystemInfo,
    System,
    CPU,
    GPU,
    RAM,
)


class WindowsSystemInfoRepository:

    RAM_TYPES = {
        20: "DDR",
        21: "DDR2",
        24: "DDR3",
        26: "DDR4",
        34: "DDR5",
    }

    def __init__(self) -> None:
        self._cpu: CPU | None = None
        self._ram: RAM | None = None
        self._system: System | None = None

        self._load_static_info()

    def _load_static_info(self) -> None:
        pythoncom.CoInitialize()

        try:
            client = wmi.WMI(namespace=r"root\cimv2")

            processor = client.Win32_Processor()[0]

            self._cpu = CPU(
                model=processor.Name.strip(),
                manufacturer=processor.Manufacturer.strip(),
                cores_physical=int(processor.NumberOfCores),
                cores_logical=int(processor.NumberOfLogicalProcessors),
                base_clock_ghz=round(
                    int(processor.MaxClockSpeed) / 1000,
                    2,
                ),
                usage_percent=0.0,
                temperature_celsius=None,
            )

            modules = client.Win32_PhysicalMemory()

            total_bytes = sum(
                int(module.Capacity)
                for module in modules
                if module.Capacity
            )

            first_module = modules[0]

            speed_mhz = int(
                first_module.ConfiguredClockSpeed
                or first_module.Speed
                or 0
            )

            memory_type = int(
                first_module.SMBIOSMemoryType or 0
            )

            self._ram = RAM(
                total_bytes=total_bytes,
                ram_type=self.RAM_TYPES.get(
                    memory_type,
                    "Unknown",
                ),
                speed_mhz=speed_mhz,
                usage_percent=0.0,
                temperature_celsius=None,
            )

            os_info = client.Win32_OperatingSystem()[0]

            self._system = System(
                name="Windows",
                edition=os_info.Caption.strip(),
                version=os_info.Version,
                architecture=os_info.OSArchitecture,
            )

        finally:
            pythoncom.CoUninitialize()

    def get_current_info(self) -> SystemInfo:
        return SystemInfo(
            cpu=self._get_cpu(),
            gpu=self._get_gpu(),
            ram=self._get_ram(),
            system=self._system,
        )

    def _get_cpu(self) -> CPU:
        return replace(
            self._cpu,
            usage_percent=psutil.cpu_percent(interval=None),
        )

    def _get_ram(self) -> RAM:
        return replace(
            self._ram,
            usage_percent=psutil.virtual_memory().percent,
        )

    def _get_gpu(self) -> GPU | None:
        gpus = GPUtil.getGPUs()

        if not gpus:
            return None

        gpu = gpus[0]

        return GPU(
            model=gpu.name,
            manufacturer=self._detect_gpu_manufacturer(gpu.name),
            vram_total_mb=int(gpu.memoryTotal),
            usage_percent=round(gpu.load * 100, 2),
            temperature_celsius=float(gpu.temperature),
        )

    @staticmethod
    def _detect_gpu_manufacturer(model: str) -> str:
        model = model.lower()

        if "nvidia" in model:
            return "NVIDIA"

        if "amd" in model or "radeon" in model:
            return "AMD"

        if "intel" in model:
            return "Intel"

        return "Unknown"