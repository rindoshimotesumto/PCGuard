import pyshark
import threading

from datetime import date, datetime
from pydantic import validate_call

from src.metrics.ethernet import EthernetTrafficStats, EthernetTrafficByUrl


class EthernetTrafficService:

    def __init__(self) -> None:
        self.is_start = False
        self.thread: threading.Thread | None = None

        self.interface = "en0"

        self.dns: dict[str, str] = {}
        self.traffic: dict[str, EthernetTrafficByUrl] = {}


    def get_traffic(self) -> EthernetTrafficStats:

        _total_download_mb = sum([x.total_download_mb for x in self.traffic.values()])

        return EthernetTrafficStats(
            from_date=datetime.now().date(),
            to_date=datetime.now().date(),
            total_download_mb=_total_download_mb,
            total_upload_mb=0,
            by_url=[x for x in self.traffic.values()]
        )


    @validate_call
    def get_traffic_by_url(self, url: str) -> EthernetTrafficByUrl:
        """
        Возвращает объект EthernetTrafficByUrl
        """
        try:
            url_traffic = self.traffic.get(url, None)

            if url_traffic is None:
                raise KeyError(f"idk this url: {url}")

            return url_traffic

        except Exception as e:
            raise ValueError(f"error: {e}")


    @validate_call
    def get_traffic_by_date(self, from_date: date, to_date: date) -> EthernetTrafficStats:
        ...


    def _run_scan(self) -> None:
        self.thread = threading.Thread(
            target=self.scan,
            daemon=True
        )

        self.thread.start()


    def _stop_scan(self) -> None:
        self.is_start = False


    def scan(self) -> None:
        """
        Сканировать сеть
        """

        self.capture = pyshark.LiveCapture(
            interface=self.interface
        )

        if self.is_start:
            return

        self.is_start = True

        for packet in self.capture.sniff_continuously():
            if not self.is_start:
                break

            self._handle_dns(packet)
            self.counter(packet)


    def _handle_dns(self, packet) -> None:
        """
        Сохраняет связь IP -> domain
        """

        if not hasattr(packet, "dns"):
            return

        try:
            domain = packet.dns.qry_name

            if not hasattr(packet.dns, "a"):
                return

            ip = packet.dns.a

            self.dns[ip] = domain

        except AttributeError:
            pass


    def counter(self, packet) -> None:
        """
        Считает объем интернет-трафика
        """

        if not hasattr(packet, "ip"):
            return

        src_ip = packet.ip.src
        dst_ip = packet.ip.dst

        domain = (
            self.dns.get(dst_ip)
            or self.dns.get(src_ip)
        )

        if not domain:
            return

        size = int(packet.length)
        size_mb = size / (1024**2)

        if self.traffic.get(domain, None) is None:
            self.traffic[domain] = EthernetTrafficByUrl(
                url=domain,
                total_download_mb=size_mb,
                total_upload_mb=0,
                traffic_packet_count=1,
                first_seen_at=datetime.now(),
                last_seen_at=datetime.now()
            )

        else:
            self.traffic[domain].traffic_packet_count += 1
            self.traffic[domain].total_download_mb += size_mb
            self.traffic[domain].last_seen_at = datetime.now()
