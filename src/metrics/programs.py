from dataclasses import dataclass
from datetime import date


@dataclass(kw_only=True)
class InstalledProgram:
    name: str
    version: str | None
    publisher: str | None
    installed_at: date | None