from fastapi import APIRouter

from src.metrics.system import SystemInfo
from src.scripts.system import SystemInfoService

from src.metrics.process import ProcessInfo
from src.scripts.process import ProcessesService

from src.metrics.programs import InstalledProgram
from src.scripts.programs import InstalledProgramsService


router = APIRouter(
    prefix="/system",
    tags=["System Info"],
)

syservice = SystemInfoService()
programs = InstalledProgramsService()
process = ProcessesService()


@router.get("/current")
def get_current_system_info() -> SystemInfo:
    return syservice.get_current()



@router.get("/installed-programs")
def get_installed_programs() -> list[InstalledProgram]:
    return programs.get_all()



@router.get("/running-programs")
def get_running_processes() -> list[ProcessInfo]:
    return process.get_all()