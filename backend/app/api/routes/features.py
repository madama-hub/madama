from __future__ import annotations

from fastapi import APIRouter

from ...services.snapshot_service import build_snapshot

router = APIRouter(prefix='/features')


@router.get('/regions')
def get_region_features() -> dict[str, object]:
    bundle = build_snapshot()
    return {
        'generated_at': bundle.generated_at.isoformat(),
        'regions': [region.model_dump() for region in bundle.features],
    }
