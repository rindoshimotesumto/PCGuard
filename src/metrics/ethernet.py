from dataclasses import dataclass
from datetime import date, datetime


@dataclass(kw_only=True)
class EthernetTrafficByUrl:
    url: str

    total_upload_mb: float
    total_download_mb: float

    traffic_packet_count: int

    first_seen_at: datetime
    last_seen_at: datetime

    @property
    def total_mb(self) -> float:
        return self.total_download_mb + self.total_upload_mb


@dataclass(kw_only=True)
class EthernetTrafficStats:
    from_date: date
    to_date: date

    total_upload_mb: float
    total_download_mb: float

    by_url: list[EthernetTrafficByUrl]