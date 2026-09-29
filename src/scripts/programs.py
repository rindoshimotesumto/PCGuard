import winreg
from datetime import datetime

from src.metrics.programs import InstalledProgram


class InstalledProgramsService:

    REG_PATHS = (
        (
            winreg.HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        ),
        (
            winreg.HKEY_LOCAL_MACHINE,
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
        ),
        (
            winreg.HKEY_CURRENT_USER,
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        ),
    )

    def get_all(self) -> list[InstalledProgram]:
        programs: dict[str, InstalledProgram] = {}

        for root, path in self.REG_PATHS:
            self._read_registry_path(
                root=root,
                path=path,
                programs=programs,
            )

        return sorted(
            programs.values(),
            key=lambda x: x.name.lower(),
        )

    def _read_registry_path(
        self,
        root,
        path: str,
        programs: dict[str, InstalledProgram],
    ) -> None:
        try:
            with winreg.OpenKey(root, path) as key:
                count = winreg.QueryInfoKey(key)[0]

                for i in range(count):
                    try:
                        subkey_name = winreg.EnumKey(key, i)

                        with winreg.OpenKey(key, subkey_name) as subkey:
                            name = self._get_value(
                                subkey,
                                "DisplayName",
                            )

                            if not name:
                                continue

                            version = self._get_value(
                                subkey,
                                "DisplayVersion",
                            )

                            publisher = self._get_value(
                                subkey,
                                "Publisher",
                            )

                            install_date_raw = self._get_value(
                                subkey,
                                "InstallDate",
                            )

                            installed_at = self._parse_install_date(
                                install_date_raw
                            )

                            unique_key = (
                                f"{name}|{version or ''}"
                            ).lower()

                            programs[unique_key] = InstalledProgram(
                                name=name,
                                version=version,
                                publisher=publisher,
                                installed_at=installed_at,
                            )

                    except OSError:
                        continue

        except OSError:
            pass

    @staticmethod
    def _get_value(
        key,
        name: str,
    ) -> str | None:
        try:
            value, _ = winreg.QueryValueEx(key, name)

            if isinstance(value, str):
                value = value.strip()

            return value or None

        except OSError:
            return None

    @staticmethod
    def _parse_install_date(
        value: str | None,
    ):
        if not value:
            return None

        formats = (
            "%Y%m%d",
            "%Y-%m-%d",
            "%d.%m.%Y",
        )

        for fmt in formats:
            try:
                return datetime.strptime(
                    value,
                    fmt,
                ).date()
            except ValueError:
                pass

        return None