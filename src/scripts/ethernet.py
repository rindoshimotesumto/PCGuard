import asyncio
import threading

from datetime import date, datetime

import pyshark
import tldextract

from pydantic import validate_call

from src.metrics.ethernet import (
    EthernetTrafficStats,
    EthernetTrafficByUrl,
)

from src.scripts.get_interface_number import (
    get_active_interface_index,
    get_tshark_interface_number,
    get_active_ipv4,
    TSHARK_PATH
)


class EthernetTrafficService:

    DOMAIN_ALIASES = {
        # YouTube
        "googlevideo.com": "youtube.com",
        "ytimg.com": "youtube.com",
        "ggpht.com": "youtube.com",

        # Pinterest
        "pinimg.com": "pinterest.com",

        # Instagram
        "cdninstagram.com": "instagram.com",

        # Facebook
        "fbcdn.net": "facebook.com",

        # TikTok
        "tiktokcdn.com": "tiktok.com",
        "tiktokv.com": "tiktok.com",
        "byteoversea.com": "tiktok.com",

        # ChatGPT
        "oaiusercontent.com": "chatgpt.com",
        "openai.com": "chatgpt.com",
    }

    def __init__(self) -> None:
        self.is_start = False

        self.thread: threading.Thread | None = None
        self.capture = None

        self.interface: str | None = None
        self.local_ip: str | None = None

        # remote IP -> normalized domain
        self.ip_domains: dict[str, str] = {}

        # normalized domain -> traffic statistics
        self.traffic: dict[str, EthernetTrafficByUrl] = {}

    # ---------------------------------------------------------

    def get_traffic(self) -> EthernetTrafficStats:
        return EthernetTrafficStats(
            from_date=datetime.now().date(),
            to_date=datetime.now().date(),

            total_upload_mb=sum(
                item.total_upload_mb
                for item in self.traffic.values()
            ),

            total_download_mb=sum(
                item.total_download_mb
                for item in self.traffic.values()
            ),

            by_url=list(self.traffic.values()),
        )

    # ---------------------------------------------------------

    @validate_call
    def get_traffic_by_url(
        self,
        url: str,
    ) -> EthernetTrafficByUrl:

        domain = self._normalize_domain(url)

        if not domain:
            raise ValueError(f"Invalid URL: {url}")

        traffic = self.traffic.get(domain)

        if traffic is None:
            raise ValueError(
                f"Traffic not found: {domain}"
            )

        return traffic

    # ---------------------------------------------------------

    @validate_call
    def get_traffic_by_date(
        self,
        from_date: date,
        to_date: date,
    ) -> EthernetTrafficStats:

        # Сейчас данные находятся только в памяти.
        # Для нормальной фильтрации по датам потребуется БД.
        return self.get_traffic()

    # ---------------------------------------------------------

    def scan(self) -> None:
        if self.is_start:
            return

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            self.interface = (
                get_tshark_interface_number()
            )

            interface_index = get_active_interface_index()
            self.interface = get_tshark_interface_number()
            self.local_ip = get_active_ipv4(interface_index)

            print(f"Windows InterfaceIndex: {interface_index}")
            print(f"TShark interface: {self.interface}")
            print(f"Local IPv4: {self.local_ip}")

            self.capture = pyshark.LiveCapture(
                interface=self.interface,
                tshark_path=TSHARK_PATH,
            )

            self.is_start = True

            for packet in (
                self.capture.sniff_continuously()
            ):

                if not self.is_start:
                    break

                self._handle_dns(packet)
                self._handle_tls(packet)

                self._count_packet(packet)

        except Exception as e:
            print(
                f"Ethernet scanner error: {e}"
            )

        finally:
            self.is_start = False

            if self.capture:
                try:
                    self.capture.close()
                except Exception:
                    pass

            loop.close()

    # ---------------------------------------------------------

    def _count_packet(
        self,
        packet,
    ) -> None:

        if not self.local_ip:
            return

        if not hasattr(packet, "ip"):
            return

        src_ip = str(packet.ip.src)
        dst_ip = str(packet.ip.dst)

        # Не наш компьютер
        if (
            src_ip != self.local_ip
            and dst_ip != self.local_ip
        ):
            return

        if src_ip == self.local_ip:
            remote_ip = dst_ip
            direction = "upload"

        else:
            remote_ip = src_ip
            direction = "download"

        domain = self.ip_domains.get(
            remote_ip
        )

        # Мы считаем только трафик,
        # которому удалось определить domain
        if not domain:
            return

        try:
            size_bytes = int(
                packet.length
            )
        except Exception:
            return

        size_mb = (
            size_bytes / 1024 / 1024
        )

        traffic = self.traffic.get(
            domain
        )

        if traffic is None:
            traffic = EthernetTrafficByUrl(
                url=domain,

                total_upload_mb=0,
                total_download_mb=0,

                traffic_packet_count=0,

                first_seen_at=datetime.now(),
                last_seen_at=datetime.now(),
            )

            self.traffic[domain] = traffic

        if direction == "upload":
            traffic.total_upload_mb += (
                size_mb
            )

        else:
            traffic.total_download_mb += (
                size_mb
            )

        traffic.traffic_packet_count += 1

        traffic.last_seen_at = (
            datetime.now()
        )

    # ---------------------------------------------------------

    def _handle_dns(
        self,
        packet,
    ) -> None:

        if not hasattr(packet, "dns"):
            return

        try:
            hostname = str(
                packet.dns.qry_name
            )

            domain = (
                self._normalize_domain(
                    hostname
                )
            )

            if not domain:
                return

            # IPv4 DNS answer
            if hasattr(packet.dns, "a"):

                ips = str(
                    packet.dns.a
                ).split(",")

                for ip in ips:
                    ip = ip.strip()

                    if ip:
                        self.ip_domains[ip] = (
                            domain
                        )

        except Exception:
            pass

    # ---------------------------------------------------------

    def _handle_tls(
        self,
        packet,
    ) -> None:

        if not hasattr(packet, "tls"):
            return

        if not hasattr(packet, "ip"):
            return

        if not self.local_ip:
            return

        try:
            hostname = str(
                packet.tls
                .handshake_extensions_server_name
            )

        except AttributeError:
            return

        domain = self._normalize_domain(
            hostname
        )

        if not domain:
            return

        src_ip = str(packet.ip.src)
        dst_ip = str(packet.ip.dst)

        if src_ip == self.local_ip:
            remote_ip = dst_ip

        elif dst_ip == self.local_ip:
            remote_ip = src_ip

        else:
            return

        self.ip_domains[remote_ip] = (
            domain
        )

    # ---------------------------------------------------------

    def _normalize_domain(
        self,
        hostname: str,
    ) -> str | None:

        if not hostname:
            return None

        hostname = (
            hostname
            .lower()
            .strip()
            .rstrip(".")
        )

        extracted = (
            tldextract.extract(
                hostname
            )
        )

        if (
            not extracted.domain
            or not extracted.suffix
        ):
            return None

        domain = (
            f"{extracted.domain}."
            f"{extracted.suffix}"
        )

        return self.DOMAIN_ALIASES.get(
            domain,
            domain,
        )

    # ---------------------------------------------------------

    def _run_scan(self) -> None:

        if self.is_start:
            return

        if (
            self.thread
            and self.thread.is_alive()
        ):
            return

        self.thread = threading.Thread(
            target=self.scan,
            daemon=True,
        )

        self.thread.start()

    # ---------------------------------------------------------

    def _stop_scan(self) -> None:
        self.is_start = False