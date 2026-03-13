from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import alerts, events, features, health, model, predict
from .config import get_settings
from .db import init_db

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(title=settings.app_name, version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health.router, prefix='/api/v1', tags=['health'])
app.include_router(events.router, prefix='/api/v1', tags=['events'])
app.include_router(features.router, prefix='/api/v1', tags=['features'])
app.include_router(alerts.router, prefix='/api/v1', tags=['alerts'])
app.include_router(model.router, prefix='/api/v1', tags=['model'])
app.include_router(predict.router, prefix='/api/v1', tags=['predict'])


@app.on_event('startup')
def on_startup() -> None:
    if not settings.allow_db_bootstrap:
        return
    try:
        init_db()
    except Exception as exc:  # pragma: no cover
        LOGGER.warning('Database bootstrap skipped: %s', exc)


@app.get('/')
def root() -> dict[str, str]:
    return {
        'message': 'MADAMA backend online',
        'docs': '/docs',
    }
