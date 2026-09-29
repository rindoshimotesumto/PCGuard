import re
import subprocess


TSHARK_PATH = r"C:\Program Files\Wireshark\tshark.exe"


def _powershell(command: str) -> str:
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
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())

    return result.stdout.strip()


def get_active_interface_index() -> int:
    result = _powershell(
        """
        $route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' |
            Where-Object {$_.State -eq 'Alive'} |
            Sort-Object RouteMetric, InterfaceMetric |
            Select-Object -First 1

        $route.InterfaceIndex
        """
    )

    if not result:
        raise RuntimeError("Active interface not found")

    return int(result)


def get_adapter_guid(interface_index: int) -> str:
    result = _powershell(
        f"""
        (Get-NetAdapter -InterfaceIndex {interface_index}).InterfaceGuid
        """
    )

    if not result:
        raise RuntimeError("Adapter GUID not found")

    return result.strip("{}").lower()


def get_active_ipv4(interface_index: int | None = None) -> str:
    if interface_index is None:
        interface_index = get_active_interface_index()

    result = _powershell(
        f"""
        Get-NetIPAddress `
            -InterfaceIndex {interface_index} `
            -AddressFamily IPv4 |
        Where-Object {{
            -not $_.IPAddress.StartsWith('169.254')
        }} |
        Select-Object -First 1 -ExpandProperty IPAddress
        """
    )

    if not result:
        raise RuntimeError(
            f"IPv4 not found for interface {interface_index}"
        )

    return result


def get_tshark_interface_number() -> str:
    interface_index = get_active_interface_index()
    adapter_guid = get_adapter_guid(interface_index)

    result = subprocess.run(
        [TSHARK_PATH, "-D"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )

    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())

    for line in result.stdout.splitlines():
        # сравниваем GUID, а НЕ слово Ethernet
        if adapter_guid in line.lower():
            match = re.match(r"^\s*(\d+)\.", line)

            if match:
                return match.group(1)

    raise RuntimeError(
        f"TShark interface not found for GUID: {adapter_guid}"
    )