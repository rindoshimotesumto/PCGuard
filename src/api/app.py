from fastapi import FastAPI

from src.api.router import (
    EthernetTrafficRouter,
    ScreenshotsRouter
)

app = FastAPI(
    title="FleentUz",
    version="0.1.0"
)

app.include_router(EthernetTrafficRouter)
app.include_router(ScreenshotsRouter)

@app.get("/")
def ping():
    return {"status": "Пашу уже"}