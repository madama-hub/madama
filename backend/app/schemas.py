from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


Severity = Literal['low', 'medium', 'high', 'critical']


class FlightEvent(BaseModel):
    icao24: str
    callsign: str
    lat: float
    lng: float
    alt: float
    heading: float
    velocity: float
    onGround: bool = False


class EarthquakeEvent(BaseModel):
    id: str
    mag: float
    place: str
    lat: float
    lng: float
    depth: float
    time: int


class TrafficEvent(BaseModel):
    id: int
    lat: float
    lng: float
    dLat: float
    dLng: float
    speed: float


class DdosEvent(BaseModel):
    id: str
    ip: str
    source: str
    lat: float
    lng: float
    countryCode: str | None = None
    packetsPerSecond: float | None = None
    bytesPerSecond: float | None = None
    ddosConfidenceScore: int
    severity: Severity
    timestamp: int


class RegionFeatures(BaseModel):
    region_id: str
    center_lat: float
    center_lng: float
    flight_count: int = 0
    earthquake_count: int = 0
    max_magnitude: float = 0.0
    traffic_count: int = 0
    avg_traffic_speed: float = 0.0
    ddos_count: int = 0
    avg_ddos_confidence: float = 0.0
    composite_load: float = 0.0


class Alert(BaseModel):
    region_id: str
    lat: float
    lng: float
    score: float
    severity: Severity
    summary: str
    reasons: list[str] = Field(default_factory=list)


class AlertSummary(BaseModel):
    generated_at: datetime
    risk_score: int
    headline: str
    overview: str
    active_alerts: int
    top_regions: list[Alert]
    monitored_sources: list[str]


class ModelMetrics(BaseModel):
    model_name: str
    evaluation_window: str
    training_samples: int
    validation_samples: int
    precision: float
    recall: float
    f1_score: float
    roc_auc: float


class AnomalyPredictionRequest(BaseModel):
    features: list[RegionFeatures] | None = None


class AnomalyPredictionResponse(BaseModel):
    generated_at: datetime
    alerts: list[Alert]
