from __future__ import annotations

from fastapi import APIRouter

from ...services.snapshot_service import build_snapshot

router = APIRouter(prefix='/model')


@router.get('/metrics')
def get_model_metrics() -> dict[str, object]:
    bundle = build_snapshot()
    return bundle.metrics.model_dump()
