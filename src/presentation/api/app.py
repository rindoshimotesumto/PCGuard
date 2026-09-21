import asyncio

from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.presentation.api.router.windows import router as windows

from src.application.use_cases.browser_activity_use_case import (
    BrowserActivityUseCase,
)

from src.infrastructure.scripts.windows.browser_activity import (
    WindowsBrowserActivityRepository, browser_monitor_loop
)

browser_use_case = BrowserActivityUseCase(
    repository=WindowsBrowserActivityRepository(),
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    task = asyncio.create_task(
        browser_monitor_loop(
            browser_use_case
        )
    )

    yield

    task.cancel()


app = FastAPI(lifespan=lifespan,)

app.include_router(windows)

@app.get("/")
def read_root():
    return {"работаю блэт": 200}