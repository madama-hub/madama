from __future__ import annotations

from fastapi import APIRouter, Query

from ...services.snapshot_service import build_snapshot

router = APIRouter(prefix='/events')


@router.get('/flights')
def get_flights() -> dict[str, object]:
    bundle = build_snapshot()
    return {
        'generated_at': bundle.generated_at.isoformat(),
        'flights': [flight.model_dump() for flight in bundle.flights],
    }


@router.get('/earthquakes')
def get_earthquakes() -> dict[str, object]:
    bundle = build_snapshot()
    return {
        'generated_at': bundle.generated_at.isoformat(),
        'earthquakes': [quake.model_dump() for quake in bundle.earthquakes],
    }


@router.get('/traffic')
def get_traffic(
    center_lat: float = Query(30.2747),
    center_lng: float = Query(-97.7403),
) -> dict[str, object]:
    bundle = build_snapshot(center_lat=center_lat, center_lng=center_lng)
    return {
        'generated_at': bundle.generated_at.isoformat(),
        'traffic': [particle.model_dump() for particle in bundle.traffic],
    }


@router.get('/ddos')
def get_ddos_events() -> dict[str, object]:
    bundle = build_snapshot()
    return {
        'generated_at': bundle.generated_at.isoformat(),
        'events': [event.model_dump() for event in bundle.ddos_events],
    }
