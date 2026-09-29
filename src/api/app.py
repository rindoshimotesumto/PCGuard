from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.router import (
    EthernetTrafficRouter,
    ScreenshotsRouter,
    SystemServiceRouter
)

app = FastAPI(
    title="FleentUz",
    version="0.1.0"
)

app.include_router(EthernetTrafficRouter)
app.include_router(ScreenshotsRouter)
app.include_router(SystemServiceRouter)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def ping():
    return {"status": "Пашу уже"}