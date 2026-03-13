from __future__ import annotations

from fastapi import APIRouter

from ...services.snapshot_service import build_snapshot

router = APIRouter(prefix='/alerts')


@router.get('')
def get_alerts() -> dict[str, object]:
    bundle = build_snapshot()
    return {
        'generated_at': bundle.generated_at.isoformat(),
        'alerts': [alert.model_dump() for alert in bundle.alerts],
    }


@router.get('/summary')
def get_alert_summary() -> dict[str, object]:
    bundle = build_snapshot()
    return bundle.summary.model_dump()
