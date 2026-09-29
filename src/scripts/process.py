import subprocess
from datetime import datetime

import psutil

from src.metrics.process import ProcessInfo


class ProcessesService:

    def get_all(self) -> list[ProcessInfo]:
        gpu_usage = self._get_gpu_usage_by_pid()

        processes: list[ProcessInfo] = []

        # Первый вызов cpu_percent нужен для инициализации
        for proc in psutil.process_iter():
            try:
                proc.cpu_percent(interval=None)
            except Exception:
                pass

        # Небольшая задержка нужна только если хочешь более точный CPU %
        # Если скорость важнее — не ставь sleep.

        for proc in psutil.process_iter(
            attrs=[
                "pid",
                "name",
                "exe",
                "status",
                "create_time",
                "memory_percent",
            ]
        ):
            try:
                info = proc.info

                started_at = None

                if info["create_time"]:
                    started_at = datetime.fromtimestamp(
                        info["create_time"]
                    )

                processes.append(
                    ProcessInfo(
                        pid=info["pid"],
                        name=info["name"] or "Unknown",
                        path=info["exe"],

                        cpu_percent=round(
                            proc.cpu_percent(interval=None),
                            2,
                        ),

                        memory_percent=round(
                            info["memory_percent"] or 0,
                            2,
                        ),

                        gpu_percent=gpu_usage.get(
                            info["pid"]
                        ),

                        status=info["status"] or "unknown",

                        started_at=started_at,
                    )
                )

            except (
                psutil.NoSuchProcess,
                psutil.AccessDenied,
                psutil.ZombieProcess,
            ):
                continue

        return sorted(
            processes,
            key=lambda x: (
                x.cpu_percent,
                x.memory_percent,
            ),
            reverse=True,
        )

    def _get_gpu_usage_by_pid(
        self,
    ) -> dict[int, float]:
        """
        Возвращает:
        {
            pid: gpu_percent
        }

        Для NVIDIA.
        """

        result: dict[int, float] = {}

        try:
            process = subprocess.run(
                [
                    "nvidia-smi",
                    "pmon",
                    "-c",
                    "1",
                ],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="ignore",
                timeout=2,
            )

            if process.returncode != 0:
                return result

            for line in process.stdout.splitlines():
                line = line.strip()

                if not line or line.startswith("#"):
                    continue

                parts = line.split()

                if len(parts) < 4:
                    continue

                try:
                    pid = int(parts[1])

                    # sm = GPU utilization %
                    gpu = parts[3]

                    if gpu == "-":
                        continue

                    gpu_percent = float(gpu)

                    result[pid] = gpu_percent

                except (
                    ValueError,
                    IndexError,
                ):
                    continue

        except Exception:
            pass

        return result