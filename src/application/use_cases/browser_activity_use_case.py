from datetime import datetime

from src.domain.entities.browser_activity import (
    BrowserActivity,
)
from src.domain.repositories.browser_activity_repo import (
    BrowserActivityRepository,
)


class BrowserActivityUseCase:

    def __init__(
        self,
        repository: BrowserActivityRepository,
    ) -> None:

        self._repository = repository

        self._current: BrowserActivity | None = None

        self._history: list[
            BrowserActivity
        ] = []

    def tick(self) -> None:
        detected = self._repository.get_current()

        now = datetime.now()

        # Браузер сейчас вообще не активен
        if detected is None:
            self._finish_current(now)
            return

        current = self._current
        print("DETECTED:", detected)

        # Первая активность
        if current is None:
            self._current = BrowserActivity(
                browser=detected.browser,
                domain=detected.domain,
                started_at=now,
                last_seen_at=now,
                duration_seconds=0,
            )

            return

        # Всё ещё тот же сайт
        if (
            current.browser == detected.browser
            and current.domain == detected.domain
        ):
            current.last_seen_at = now

            current.duration_seconds = int(
                (
                    current.last_seen_at
                    - current.started_at
                ).total_seconds()
            )

            return

        # Сайт поменялся
        self._finish_current(now)

        self._current = BrowserActivity(
            browser=detected.browser,
            domain=detected.domain,
            started_at=now,
            last_seen_at=now,
            duration_seconds=0,
        )

    def _finish_current(
        self,
        now: datetime,
    ) -> None:

        if self._current is None:
            return

        self._current.last_seen_at = now

        self._current.duration_seconds = int(
            (
                self._current.last_seen_at
                - self._current.started_at
            ).total_seconds()
        )

        self._history.append(
            self._current
        )

        self._current = None

    def get_current(
        self,
    ) -> BrowserActivity | None:

        return self._current

    def get_history(
        self,
    ) -> list[BrowserActivity]:

        return self._history.copy()