import time
import psutil

from src.domain.entities.network_metrics import NetworkMetrics


class WindowsNetworkService:

    def get_usage(
        self,
        interval: float = 1.0,
    ) -> NetworkMetrics:

        before = psutil.net_io_counters()

        time.sleep(interval)

        after = psutil.net_io_counters()

        sent_delta = (
            after.bytes_sent
            - before.bytes_sent
        )

        recv_delta = (
            after.bytes_recv
            - before.bytes_recv
        )

        return NetworkMetrics(
            bytes_sent=after.bytes_sent,
            bytes_recv=after.bytes_recv,

            upload_bytes_sec=round(
                sent_delta / interval,
                2,
            ),

            download_bytes_sec=round(
                recv_delta / interval,
                2,
            ),
        )