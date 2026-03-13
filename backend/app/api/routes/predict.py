from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from ...schemas import AnomalyPredictionRequest, AnomalyPredictionResponse
from ...services.anomaly_service import generate_alerts
from ...services.snapshot_service import build_snapshot

router = APIRouter(prefix='/predict')


@router.post('/anomaly', response_model=AnomalyPredictionResponse)
def predict_anomaly(request: AnomalyPredictionRequest) -> AnomalyPredictionResponse:
    if request.features:
        alerts = generate_alerts(request.features)
        return AnomalyPredictionResponse(generated_at=datetime.now(timezone.utc), alerts=alerts)

    bundle = build_snapshot()
    return AnomalyPredictionResponse(generated_at=bundle.generated_at, alerts=bundle.alerts)
