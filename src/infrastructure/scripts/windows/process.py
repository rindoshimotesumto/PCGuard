import re
import wmi
import psutil
import pythoncom

from datetime import datetime

from src.domain.entities.process import Process
from src.domain.repositories.process_repo import ProcessRepository


class WindowsProcessesService(ProcessRepository):

    def get_all(self) -> list[Process]:
        result: list[Process] = []

        gpu_usage = self._get_gpu_usage()

        for proc in psutil.process_iter(
            [
                "pid",
                "name",
                "exe",
                "status",
                "cpu_percent",
                "memory_percent",
                "memory_info",
                "create_time",
            ]
        ):
            try:
                info = proc.info

                memory_info = info["memory_info"]

                memory_mb = (
                    round(memory_info.rss / 1024 / 1024, 2)
                    if memory_info
                    else 0.0
                )

                result.append(
                    Process(
                        pid=info["pid"],
                        name=info["name"] or "Unknown",
                        path=info["exe"],
                        status=info["status"],

                        cpu_percent=round(
                            info["cpu_percent"] or 0.0,
                            2,
                        ),

                        memory_percent=round(
                            info["memory_percent"] or 0.0,
                            2,
                        ),

                        memory_mb=memory_mb,

                        gpu_percent=gpu_usage.get(
                            info["pid"],
                            0.0,
                        ),

                        started_at=datetime.fromtimestamp(
                            info["create_time"]
                        ),
                    )
                )

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
                psutil.ZombieProcess,
            ):
                continue

        return result

    def get_by_pid(self, pid: int) -> Process | None:
        try:
            proc = psutil.Process(pid)

            memory = proc.memory_info()

            gpu_usage = self._get_gpu_usage()

            return Process(
                pid=proc.pid,
                name=proc.name(),
                path=proc.exe(),
                status=proc.status(),

                cpu_percent=round(
                    proc.cpu_percent(interval=0.1),
                    2,
                ),

                memory_percent=round(
                    proc.memory_percent(),
                    2,
                ),

                memory_mb=round(
                    memory.rss / 1024 / 1024,
                    2,
                ),

                gpu_percent=gpu_usage.get(
                    pid,
                    0.0,
                ),

                started_at=datetime.fromtimestamp(
                    proc.create_time()
                ),
            )

        except (
            psutil.NoSuchProcess,
            psutil.AccessDenied,
            psutil.ZombieProcess,
        ):
            return None

    def is_running(self, name: str) -> bool:
        target = name.lower()

        for proc in psutil.process_iter(["name"]):
            try:
                process_name = proc.info["name"]

                if (
                    process_name
                    and process_name.lower() == target
                ):
                    return True

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
            ):
                continue

        return False

    def _get_gpu_usage(self) -> dict[int, float]:
        """
        Возвращает GPU usage по PID.

        WMI создаётся локально в текущем потоке,
        чтобы корректно работать с FastAPI threadpool.
        """

        result: dict[int, float] = {}

        pythoncom.CoInitialize()

        try:
            wmi_client = wmi.WMI(namespace=r"root\cimv2")

            engines = wmi_client.query(
                """
                SELECT Name, UtilizationPercentage
                FROM Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine
                """
            )

            for engine in engines:
                name = str(engine.Name)

                match = re.search(
                    r"pid_(\d+)",
                    name,
                    re.IGNORECASE,
                )

                if not match:
                    continue

                pid = int(match.group(1))

                usage = float(
                    engine.UtilizationPercentage or 0
                )

                current = result.get(pid, 0.0)

                result[pid] = max(
                    current,
                    usage,
                )

        except Exception:
            return {}

        finally:
            pythoncom.CoUninitialize()

        return result
