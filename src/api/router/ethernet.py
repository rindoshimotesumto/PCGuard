from fastapi import APIRouter

from src.metrics.ethernet import EthernetTrafficByUrl, EthernetTrafficStats
from src.scripts.ethernet import EthernetTrafficService


router = APIRouter(
    prefix="/eth-traffic",
    tags=["Ethernet Traffic"]
)

eth_taffic_service = EthernetTrafficService()


@router.get("/run-scan")
def start_scana() -> dict:
    eth_taffic_service._run_scan()
    return {"status": "запустиль сканер бро"}


@router.get("/stop-scan")
def stop_scana() -> dict:
    eth_taffic_service._stop_scan()
    return {"status": "отрубил бро"}


@router.get("/get-by-url")
def get_traffic_by_url(url: str) -> EthernetTrafficByUrl:
    return eth_taffic_service.get_traffic_by_url(url.lower())


@router.get("/show-traffic")
def get_traffic() -> EthernetTrafficStats:
    return eth_taffic_service.get_traffic()