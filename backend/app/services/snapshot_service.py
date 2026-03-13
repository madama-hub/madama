from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..config import get_settings
from ..db import session_scope
from ..models import AlertSnapshot, EventRecord, RegionFeatureSnapshot
from ..schemas import Alert, AlertSummary, DdosEvent, EarthquakeEvent, FlightEvent, ModelMetrics, RegionFeatures, TrafficEvent
from .anomaly_service import evaluate_model, generate_alerts, summarize_alerts
from .data_sources import fetch_ddos_events, fetch_earthquakes, fetch_flights, generate_traffic
from .feature_engineering import build_region_features

LOGGER = logging.getLogger(__name__)


@dataclass
class SnapshotBundle:
    generated_at: datetime
    flights: list[FlightEvent]
    earthquakes: list[EarthquakeEvent]
    traffic: list[TrafficEvent]
    ddos_events: list[DdosEvent]
    features: list[RegionFeatures]
    alerts: list[Alert]
    summary: AlertSummary
    metrics: ModelMetrics


_CACHE: dict[str, Any] = {
    'generated_at': 0.0,
    'center': None,
    'bundle': None,
}


def _serialize_model(item: Any) -> dict[str, Any]:
    if hasattr(item, 'model_dump'):
        return item.model_dump()
    if hasattr(item, 'dict'):
        return item.dict()
    if hasattr(item, '__dict__'):
        return dict(item.__dict__)
    return asdict(item)


def _snapshot_path(filename: str) -> Path:
    settings = get_settings()
    settings.snapshot_dir.mkdir(parents=True, exist_ok=True)
    return settings.snapshot_dir / filename


def _history_dir() -> Path:
    history_dir = _snapshot_path('history')
    history_dir.mkdir(parents=True, exist_ok=True)
    return history_dir


def _write_snapshot(bundle: SnapshotBundle) -> Path:
    payload = {
        'generated_at': bundle.generated_at.isoformat(),
        'flights': [_serialize_model(item) for item in bundle.flights],
        'earthquakes': [_serialize_model(item) for item in bundle.earthquakes],
        'traffic': [_serialize_model(item) for item in bundle.traffic],
        'ddos_events': [_serialize_model(item) for item in bundle.ddos_events],
        'features': [_serialize_model(item) for item in bundle.features],
        'alerts': [_serialize_model(item) for item in bundle.alerts],
        'summary': _serialize_model(bundle.summary),
        'metrics': _serialize_model(bundle.metrics),
    }
    _snapshot_path('latest_snapshot.json').write_text(json.dumps(payload, indent=2), encoding='utf-8')
    _snapshot_path('model_metrics.json').write_text(json.dumps(payload['metrics'], indent=2), encoding='utf-8')
    history_path = _history_dir() / f"snapshot-{bundle.generated_at.strftime('%Y%m%dT%H%M%SZ')}.json"
    history_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    return history_path


def _to_naive_utc(value: datetime) -> datetime:
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _event_time_from_millis(timestamp_ms: int | None, fallback: datetime) -> datetime:
    if timestamp_ms is None:
        return fallback
    return datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).replace(tzinfo=None)


def _persist_bundle(bundle: SnapshotBundle) -> None:
    generated_at = _to_naive_utc(bundle.generated_at)

    try:
        with session_scope() as session:
            for flight in bundle.flights:
                session.add(
                    EventRecord(
                        event_id=flight.icao24,
                        event_type='flight',
                        source='opensky',
                        timestamp=generated_at,
                        lat=flight.lat,
                        lng=flight.lng,
                        severity='low',
                        payload=flight.model_dump(),
                    )
                )

            for quake in bundle.earthquakes:
                session.add(
                    EventRecord(
                        event_id=quake.id,
                        event_type='earthquake',
                        source='usgs',
                        timestamp=_event_time_from_millis(quake.time, generated_at),
                        lat=quake.lat,
                        lng=quake.lng,
                        severity='high' if quake.mag >= 5.5 else 'medium' if quake.mag >= 4.0 else 'low',
                        payload=quake.model_dump(),
                    )
                )

            for particle in bundle.traffic:
                session.add(
                    EventRecord(
                        event_id=f"traffic-{generated_at.isoformat()}-{particle.id}",
                        event_type='traffic',
                        source='madama_traffic_model',
                        timestamp=generated_at,
                        lat=particle.lat,
                        lng=particle.lng,
                        severity='low',
                        payload=particle.model_dump(),
                    )
                )

            for ddos_event in bundle.ddos_events:
                session.add(
                    EventRecord(
                        event_id=ddos_event.id,
                        event_type='ddos',
                        source=ddos_event.source,
                        timestamp=_event_time_from_millis(ddos_event.timestamp, generated_at),
                        lat=ddos_event.lat,
                        lng=ddos_event.lng,
                        severity=ddos_event.severity,
                        payload=ddos_event.model_dump(),
                    )
                )

            for region in bundle.features:
                session.add(
                    RegionFeatureSnapshot(
                        generated_at=generated_at,
                        region_id=region.region_id,
                        center_lat=region.center_lat,
                        center_lng=region.center_lng,
                        composite_load=region.composite_load,
                        features=region.model_dump(),
                    )
                )

            for alert in bundle.alerts:
                session.add(
                    AlertSnapshot(
                        generated_at=generated_at,
                        region_id=alert.region_id,
                        score=alert.score,
                        severity=alert.severity,
                        summary=alert.summary,
                        details=alert.model_dump(),
                    )
                )
    except Exception as exc:  # pragma: no cover
        LOGGER.warning('Snapshot persistence skipped: %s', exc)


def build_snapshot(
    *,
    center_lat: float | None = None,
    center_lng: float | None = None,
    force_refresh: bool = False,
) -> SnapshotBundle:
    settings = get_settings()
    center_lat = settings.default_center_lat if center_lat is None else center_lat
    center_lng = settings.default_center_lng if center_lng is None else center_lng
    center_key = (round(center_lat, 4), round(center_lng, 4))

    if not force_refresh and _CACHE['bundle'] is not None and _CACHE['center'] == center_key:
        age_seconds = time.time() - float(_CACHE['generated_at'])
        if age_seconds < settings.snapshot_ttl_seconds:
            return _CACHE['bundle']

    flights = fetch_flights()
    earthquakes = fetch_earthquakes()
    traffic = generate_traffic(center_lat, center_lng)
    ddos_events = fetch_ddos_events()
    features = build_region_features(flights, earthquakes, traffic, ddos_events)
    alerts = generate_alerts(features)
    summary = summarize_alerts(alerts, ['OpenSky', 'USGS', 'MADAMA Traffic Model', 'AbuseIPDB'])
    metrics = evaluate_model(features, alerts)

    bundle = SnapshotBundle(
        generated_at=datetime.now(timezone.utc),
        flights=flights,
        earthquakes=earthquakes,
        traffic=traffic,
        ddos_events=ddos_events,
        features=features,
        alerts=alerts,
        summary=summary,
        metrics=metrics,
    )

    _write_snapshot(bundle)
    _persist_bundle(bundle)
    _CACHE.update({'generated_at': time.time(), 'center': center_key, 'bundle': bundle})
    return bundle
