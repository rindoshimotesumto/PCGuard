from dataclasses import dataclass


@dataclass(kw_only=True)
class NetworkMetrics:
    bytes_sent: int
    bytes_recv: int

    upload_bytes_sec: float
    download_bytes_sec: float