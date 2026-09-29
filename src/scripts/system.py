import json
import platform
import socket
import subprocess
import getpass
import shutil
import threading
import time

import psutil
from screeninfo import get_monitors

from src.metrics.system import (
    CPU,
    GPU,
    RAM,
    Disk,
    Monitor,
    Printer,
    SystemInfo,
)


class SystemInfoService:

    RAM_TYPES = {
        20: "DDR",
        21: "DDR2",
        24: "DDR3",
        26: "DDR4",
        34: "DDR5",
    }

    def __init__(self) -> None:
        self._static_info = self._load_static_info()

        self._cpu_usage = 0.0
        self._ram_usage = 0.0
        self._gpu_usage = 0.0
        self._disk_usage: dict[str, float] = {}

        self._running = True

        self._thread = threading.Thread(
            target=self._update_usage_loop,
            daemon=True,
        )
        self._thread.start()

    def get_current(self) -> SystemInfo:
        static = self._static_info

        return SystemInfo(
            username=static["username"],
            device_name=static["device_name"],
            os=static["os"],
            architecture=static["architecture"],

            cpu=CPU(
                model=static["cpu_model"],
                usage_percent=self._cpu_usage,
            ),

            gpu=GPU(
                model=static["gpu_model"],
                usage_percent=self._gpu_usage,
            ) if static["gpu_model"] else None,

            ram=RAM(
                total_gb=static["ram_total_gb"],
                generation=static["ram_generation"],
                speed_mhz=static["ram_speed_mhz"],
                usage_percent=self._ram_usage,
            ),

            ip_address=static["ip_address"],

            disks=[
                Disk(
                    name=d["name"],
                    total_gb=d["total_gb"],
                    usage_percent=self._disk_usage.get(
                        d["name"],
                        0.0,
                    ),
                )
                for d in static["disks"]
            ],

            monitors=static["monitors"],
            printers=static["printers"],
        )

    def _load_static_info(self) -> dict:
        cpu = self._get_cpu_static()
        ram = self._get_ram_static()

        return {
            "username": getpass.getuser(),
            "device_name": socket.gethostname(),
            "os": f"{platform.system()} {platform.release()}",
            "architecture": platform.machine(),

            "cpu_model": cpu,
            "gpu_model": self._get_gpu_model(),

            "ram_total_gb": ram["total_gb"],
            "ram_generation": ram["generation"],
            "ram_speed_mhz": ram["speed_mhz"],

            "ip_address": self._get_ip(),

            "disks": self._get_disks_static(),
            "monitors": self._get_monitors_static(),
            "printers": self._get_printers_static(),
        }

    def _update_usage_loop(self) -> None:
        while self._running:
            try:
                self._cpu_usage = psutil.cpu_percent(interval=None)

                self._ram_usage = (
                    psutil.virtual_memory().percent
                )

                self._gpu_usage = self._get_gpu_usage()

                for partition in psutil.disk_partitions(
                    all=False
                ):
                    try:
                        usage = psutil.disk_usage(
                            partition.mountpoint
                        )

                        name = partition.device.rstrip("\\")

                        self._disk_usage[name] = (
                            usage.percent
                        )

                    except Exception:
                        pass

            except Exception:
                pass

            time.sleep(1)

    def _get_cpu_static(self) -> str:
        try:
            output = self._powershell(
                """
                (Get-CimInstance Win32_Processor |
                Select-Object -First 1 -ExpandProperty Name)
                """
            )

            return output.strip()

        except Exception:
            return platform.processor()

    def _get_ram_static(self) -> dict:
        memory = psutil.virtual_memory()

        generation = None
        speed = None

        try:
            output = self._powershell(
                """
                Get-CimInstance Win32_PhysicalMemory |
                Select-Object -First 1 `
                    SMBIOSMemoryType,
                    ConfiguredClockSpeed |
                ConvertTo-Json -Compress
                """
            )

            data = json.loads(output)

            ram_type = data.get(
                "SMBIOSMemoryType"
            )

            if ram_type is not None:
                generation = self.RAM_TYPES.get(
                    int(ram_type)
                )

            configured_speed = data.get(
                "ConfiguredClockSpeed"
            )

            if configured_speed is not None:
                speed = int(configured_speed)

        except Exception:
            pass

        return {
            "total_gb": round(
                memory.total / 1024 ** 3,
                1,
            ),
            "generation": generation,
            "speed_mhz": speed,
        }

    def _get_gpu_model(self) -> str | None:
        nvidia_smi = shutil.which("nvidia-smi")

        if not nvidia_smi:
            return None

        try:
            result = subprocess.run(
                [
                    nvidia_smi,
                    "--query-gpu=name",
                    "--format=csv,noheader",
                ],
                capture_output=True,
                text=True,
                timeout=2,
            )

            if result.returncode != 0:
                return None

            return result.stdout.strip().splitlines()[0]

        except Exception:
            return None

    def _get_gpu_usage(self) -> float:
        nvidia_smi = shutil.which("nvidia-smi")

        if not nvidia_smi:
            return 0.0

        try:
            result = subprocess.run(
                [
                    nvidia_smi,
                    "--query-gpu=utilization.gpu",
                    "--format=csv,noheader,nounits",
                ],
                capture_output=True,
                text=True,
                timeout=1,
            )

            if result.returncode != 0:
                return 0.0

            return float(
                result.stdout.strip().splitlines()[0]
            )

        except Exception:
            return 0.0

    def _get_disks_static(self) -> list[dict]:
        result = []

        for partition in psutil.disk_partitions(
            all=False
        ):
            try:
                usage = psutil.disk_usage(
                    partition.mountpoint
                )

                result.append({
                    "name": partition.device.rstrip("\\"),
                    "total_gb": round(
                        usage.total / 1024 ** 3,
                        1,
                    ),
                })

            except Exception:
                pass

        return result

    def _get_monitors_static(
        self,
    ) -> list[Monitor]:
        return [
            Monitor(
                name=m.name or f"Monitor {i}",
                width=m.width,
                height=m.height,
            )
            for i, m in enumerate(
                get_monitors(),
                start=1,
            )
        ]

    def _get_printers_static(
        self,
    ) -> list[Printer]:
        try:
            output = self._powershell(
                """
                Get-Printer |
                Select-Object Name |
                ConvertTo-Json -Compress
                """
            )

            if not output:
                return []

            data = json.loads(output)

            if isinstance(data, dict):
                data = [data]

            return [
                Printer(name=x["Name"])
                for x in data
                if x.get("Name")
            ]

        except Exception:
            return []

    def _get_ip(self) -> str:
        try:
            with socket.socket(
                socket.AF_INET,
                socket.SOCK_DGRAM,
            ) as sock:
                sock.connect(("8.8.8.8", 80))
                return sock.getsockname()[0]

        except Exception:
            return "Unknown"

    @staticmethod
    def _powershell(
        command: str,
    ) -> str:
        result = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                command,
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore",
            timeout=3,
        )

        if result.returncode != 0:
            raise RuntimeError(
                result.stderr.strip()
            )

        return result.stdout.strip()