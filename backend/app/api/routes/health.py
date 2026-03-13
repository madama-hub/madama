from __future__ import annotations

from fastapi import APIRouter

from ...config import get_settings

router = APIRouter()


@router.get('/health')
def health_check() -> dict[str, object]:
    settings = get_settings()
    return {
        'status': 'ok',
        'service': settings.app_name,
        'environment': settings.environment,
        'postgresql_configured': settings.database_url.startswith('postgresql'),
    }
