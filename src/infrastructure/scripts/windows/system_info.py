import wmi
import psutil
import GPUtil

from src.domain.entities.system_info import (
    SystemInfo,
    System,
    CPU, GPU, RAM
)

from src.domain.repositories.system_info_repo import SystemInfoRepositories


class WindowsSystemInfoRepository(SystemInfoRepositories):

    RAM_TYPES = {
        20: "DDR",
        21: "DDR2",
        24: "DDR3",
        26: "DDR4",
        34: "DDR5",
    }


    def __init__(self) -> None:
        self._wmi = wmi.WMI()

    def get_current_info(self) -> SystemInfo:
        _cpu=self._get_cpu()
        _gpu=self._get_gpu()
        _ram=self._get_ram()
        _system=self._get_system()

        return SystemInfo(
            cpu=_cpu,
            gpu=_gpu,
            ram=_ram,
            system=_system
        )

    def _get_cpu(self) -> CPU:
        processor = self._wmi.Win32_Processor()[0]

        return CPU(
            model=processor.Name.strip(),
            manufacturer=processor.Manufacturer.strip(),
            cores_physical=int(processor.NumberOfCores),
            cores_logical=int(processor.NumberOfLogicalProcessors),
            base_clock_ghz=round(
                int(processor.MaxClockSpeed) / 1000,
                2
            ),
            usage_percent=psutil.cpu_percent(interval=0.5),
            temperature_celsius=None,
        )

    def _get_gpu(self) -> GPU | None:
        gpus = GPUtil.getGPUs()

        if gpus:
            gpu = gpus[0]

            return GPU(
                model=gpu.name,
                manufacturer="NVIDIA",
                vram_total_mb=int(gpu.memoryTotal),
                usage_percent=round(gpu.load * 100, 2),
                temperature_celsius=float(gpu.temperature),
            )

        # Fallback для AMD / Intel
        controllers = self._wmi.Win32_VideoController()

        if not controllers:
            return None

        gpu = controllers[0]
        model = gpu.Name.strip()
        manufacturer = self._detect_gpu_manufacturer(model)

        vram = int(gpu.AdapterRAM or 0)

        return GPU(
            model=model,
            manufacturer=manufacturer,
            vram_total_mb=vram // (1024 * 1024),
            usage_percent=0.0,
            temperature_celsius=None,
        )

    def _get_ram(self) -> RAM:
        modules = self._wmi.Win32_PhysicalMemory()

        total_bytes = sum(
            int(module.Capacity)
            for module in modules
            if module.Capacity
        )

        speed_mhz = 0
        ram_type = "Unknown"

        if modules:
            first_module = modules[0]

            speed_mhz = int(
                first_module.ConfiguredClockSpeed
                or first_module.Speed
                or 0
            )

            memory_type = int(
                first_module.SMBIOSMemoryType or 0
            )

            ram_type = self.RAM_TYPES.get(
                memory_type,
                "Unknown",
            )

        return RAM(
            total_bytes=total_bytes,
            ram_type=ram_type,
            speed_mhz=speed_mhz,
            usage_percent=psutil.virtual_memory().percent,
            temperature_celsius=None,
        )

    def _get_system(self) -> System:
        os_info = self._wmi.Win32_OperatingSystem()[0]

        return System(
            name="Windows",
            edition=os_info.Caption.strip(),
            version=os_info.Version,
            architecture=os_info.OSArchitecture,
        )

    @staticmethod
    def _detect_gpu_manufacturer(model: str) -> str:
        model_lower = model.lower()

        if "nvidia" in model_lower:
            return "NVIDIA"

        if "amd" in model_lower or "radeon" in model_lower:
            return "AMD"

        if "intel" in model_lower:
            return "Intel"

        return "Unknown"