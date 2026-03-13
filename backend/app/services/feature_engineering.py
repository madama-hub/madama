from __future__ import annotations

from collections import defaultdict
from statistics import fmean

from ..schemas import DdosEvent, EarthquakeEvent, FlightEvent, RegionFeatures, TrafficEvent


def region_id_for(lat: float, lng: float, bucket_size: float = 10.0) -> str:
    lat_bucket = round(lat / bucket_size) * bucket_size
    lng_bucket = round(lng / bucket_size) * bucket_size
    return f'{lat_bucket:+05.1f}:{lng_bucket:+06.1f}'


def region_center(region_id: str) -> tuple[float, float]:
    lat_raw, lng_raw = region_id.split(':', maxsplit=1)
    return float(lat_raw), float(lng_raw)


def build_region_features(
    flights: list[FlightEvent],
    earthquakes: list[EarthquakeEvent],
    traffic: list[TrafficEvent],
    ddos_events: list[DdosEvent],
) -> list[RegionFeatures]:
    buckets: dict[str, dict[str, list[float] | int]] = defaultdict(
        lambda: {
            'flight_count': 0,
            'earthquake_count': 0,
            'earthquake_magnitudes': [],
            'traffic_count': 0,
            'traffic_speeds': [],
            'ddos_count': 0,
            'ddos_scores': [],
        }
    )

    for flight in flights:
        bucket = buckets[region_id_for(flight.lat, flight.lng)]
        bucket['flight_count'] = int(bucket['flight_count']) + 1

    for quake in earthquakes:
        bucket = buckets[region_id_for(quake.lat, quake.lng)]
        bucket['earthquake_count'] = int(bucket['earthquake_count']) + 1
        cast_list = bucket['earthquake_magnitudes']
        assert isinstance(cast_list, list)
        cast_list.append(float(quake.mag))

    for particle in traffic:
        bucket = buckets[region_id_for(particle.lat, particle.lng)]
        bucket['traffic_count'] = int(bucket['traffic_count']) + 1
        cast_list = bucket['traffic_speeds']
        assert isinstance(cast_list, list)
        cast_list.append(float(particle.speed))

    for ddos_event in ddos_events:
        bucket = buckets[region_id_for(ddos_event.lat, ddos_event.lng)]
        bucket['ddos_count'] = int(bucket['ddos_count']) + 1
        cast_list = bucket['ddos_scores']
        assert isinstance(cast_list, list)
        cast_list.append(float(ddos_event.ddosConfidenceScore))

    features: list[RegionFeatures] = []
    for bucket_id, values in buckets.items():
        center_lat, center_lng = region_center(bucket_id)
        earthquake_magnitudes = values['earthquake_magnitudes']
        traffic_speeds = values['traffic_speeds']
        ddos_scores = values['ddos_scores']
        assert isinstance(earthquake_magnitudes, list)
        assert isinstance(traffic_speeds, list)
        assert isinstance(ddos_scores, list)

        flight_count = int(values['flight_count'])
        earthquake_count = int(values['earthquake_count'])
        traffic_count = int(values['traffic_count'])
        ddos_count = int(values['ddos_count'])
        max_magnitude = max(earthquake_magnitudes) if earthquake_magnitudes else 0.0
        avg_traffic_speed = fmean(traffic_speeds) if traffic_speeds else 0.0
        avg_ddos_confidence = fmean(ddos_scores) if ddos_scores else 0.0

        composite_load = (
            min(flight_count / 120.0, 2.0)
            + min(earthquake_count * 0.4, 2.0)
            + min(max_magnitude / 4.0, 2.0)
            + min(traffic_count / 90.0, 1.5)
            + min(ddos_count * 0.65, 2.0)
            + min(avg_ddos_confidence / 100.0, 1.0)
        )

        features.append(
            RegionFeatures(
                region_id=bucket_id,
                center_lat=center_lat,
                center_lng=center_lng,
                flight_count=flight_count,
                earthquake_count=earthquake_count,
                max_magnitude=round(max_magnitude, 2),
                traffic_count=traffic_count,
                avg_traffic_speed=round(avg_traffic_speed, 2),
                ddos_count=ddos_count,
                avg_ddos_confidence=round(avg_ddos_confidence, 2),
                composite_load=round(composite_load, 3),
            )
        )

    features.sort(key=lambda item: item.composite_load, reverse=True)
    return features
