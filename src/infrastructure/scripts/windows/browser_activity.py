import psutil
import asyncio
import win32gui
import win32process

from datetime import datetime
from urllib.parse import urlparse

from pywinauto import Desktop

from src.domain.entities.browser_activity import BrowserActivity
from src.domain.repositories.browser_activity_repo import (
    BrowserActivityRepository,
)
from src.application.use_cases.browser_activity_use_case import BrowserActivityUseCase


class WindowsBrowserActivityRepository(
    BrowserActivityRepository,
):

    BROWSERS = {
        "chrome.exe": "Chrome",
        "msedge.exe": "Edge",
        "firefox.exe": "Firefox",
    }

    def get_current(self) -> BrowserActivity | None:
        hwnd = win32gui.GetForegroundWindow()

        if not hwnd:
            return None

        _, pid = win32process.GetWindowThreadProcessId(
            hwnd
        )

        try:
            process = psutil.Process(pid)
            process_name = process.name().lower()

        except (
            psutil.NoSuchProcess,
            psutil.AccessDenied,
        ):
            return None

        browser = self.BROWSERS.get(process_name)

        if browser is None:
            return None

        domain = self._get_domain_from_window(hwnd)

        if domain is None:
            return None

        now = datetime.now()

        return BrowserActivity(
            browser=browser,
            domain=domain,
            started_at=now,
            last_seen_at=now,
            duration_seconds=0,
        )

    def _get_domain_from_window(
        self,
        hwnd: int,
    ) -> str | None:

        try:
            window = Desktop(
                backend="uia",
            ).window(
                handle=hwnd,
            )

            for edit in window.descendants(
                control_type="Edit",
            ):
                try:
                    value = edit.get_value()

                    if not value:
                        continue

                    domain = self._parse_domain(value)

                    if domain:
                        return domain

                except Exception:
                    continue

        except Exception:
            return None

        return None

    @staticmethod
    def _parse_domain(
        value: str,
    ) -> str | None:

        value = value.strip()

        if "." not in value:
            return None

        if not value.startswith(
            ("http://", "https://")
        ):
            value = "https://" + value

        try:
            domain = urlparse(value).hostname

            if domain is None:
                return None

            if domain.startswith("www."):
                domain = domain[4:]

            return domain

        except ValueError:
            return None


async def browser_monitor_loop(
    use_case: BrowserActivityUseCase,
) -> None:

    while True:
        use_case.tick()
        
        await asyncio.sleep(1)