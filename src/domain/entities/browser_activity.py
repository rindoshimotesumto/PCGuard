from dataclasses import dataclass
from datetime import datetime


@dataclass(kw_only=True)
class BrowserActivity:
    browser: str
    domain: str

    started_at: datetime
    last_seen_at: datetime

    duration_seconds: int