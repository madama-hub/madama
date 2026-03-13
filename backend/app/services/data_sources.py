from __future__ import annotations

import json
import math
import random
import time
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from ..config import get_settings
from ..schemas import DdosEvent, EarthquakeEvent, FlightEvent, TrafficEvent


def _fetch_json(url: str, headers: dict[str, str] | None = None) -> Any:
    request = Request(url, headers=headers or {})
    with urlopen(request, timeout=15) as response:  # noqa: S310
        return json.loads(response.read().decode('utf-8'))


def fetch_flights() -> list[FlightEvent]:
    try:
        data = _fetch_json('https://opensky-network.org/api/states/all')
        states = data.get('states') or []
        flights = [
            FlightEvent(
                icao24=str(state[0]),
                callsign=str(state[1] or '').strip(),
                lng=float(state[5]),
                lat=float(state[6]),
                alt=float(state[7] or 0.0),
                velocity=float(state[9] or 0.0),
                heading=float(state[10] or 0.0),
                onGround=bool(state[8]),
            )
            for state in states[:2000]
            if state[5] is not None and state[6] is not None and not state[8]
        ]
        if flights:
            return flights
    except (URLError, TimeoutError, ValueError, KeyError, IndexError, TypeError):
        pass

    corridors = [
        {'lat': 45.0, 'lng': -30.0, 'spread': 20.0},
        {'lat': 35.0, 'lng': 100.0, 'spread': 25.0},
        {'lat': 40.0, 'lng': 10.0, 'spread': 15.0},
        {'lat': 35.0, 'lng': -90.0, 'spread': 15.0},
        {'lat': -20.0, 'lng': 130.0, 'spread': 15.0},
    ]
    airlines = ['UAL', 'DAL', 'AAL', 'SWA', 'BAW', 'DLH', 'AFR']

    fallback: list[FlightEvent] = []
    for idx in range(500):
        corridor = random.choice(corridors)
        fallback.append(
            FlightEvent(
                icao24=f'SIM{idx:04d}',
                callsign=f"{random.choice(airlines)}{100 + idx}",
                lat=corridor['lat'] + (random.random() - 0.5) * corridor['spread'] * 2,
                lng=corridor['lng'] + (random.random() - 0.5) * corridor['spread'] * 2,
                alt=8000 + random.random() * 4000,
                heading=random.random() * 360,
                velocity=200 + random.random() * 300,
                onGround=False,
            )
        )
    return fallback


def fetch_earthquakes() -> list[EarthquakeEvent]:
    try:
        data = _fetch_json('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson')
        features = data.get('features') or []
        earthquakes = [
            EarthquakeEvent(
                id=str(feature['id']),
                mag=float(feature['properties']['mag'] or 0.0),
                place=str(feature['properties']['place'] or 'Unknown region'),
                lat=float(feature['geometry']['coordinates'][1]),
                lng=float(feature['geometry']['coordinates'][0]),
                depth=float(feature['geometry']['coordinates'][2]),
                time=int(feature['properties']['time'] or int(time.time() * 1000)),
            )
            for feature in features
        ]
        if earthquakes:
            return earthquakes
    except (URLError, TimeoutError, ValueError, KeyError, IndexError, TypeError):
        pass

    zones = [
        {'lat': 35.0, 'lng': 139.0, 'name': 'Japan'},
        {'lat': -33.0, 'lng': -71.0, 'name': 'Chile'},
        {'lat': 37.0, 'lng': -122.0, 'name': 'California'},
        {'lat': 28.0, 'lng': 84.0, 'name': 'Nepal'},
        {'lat': -6.0, 'lng': 106.0, 'name': 'Indonesia'},
    ]
    earthquakes: list[EarthquakeEvent] = []
    for zone_index, zone in enumerate(zones):
        for index in range(5):
            earthquakes.append(
                EarthquakeEvent(
                    id=f'SIM-{zone_index}-{index}',
                    mag=2.5 + random.random() * 4,
                    place=f"{random.randint(10, 120)}km from {zone['name']}",
                    lat=zone['lat'] + (random.random() - 0.5) * 5,
                    lng=zone['lng'] + (random.random() - 0.5) * 5,
                    depth=random.random() * 100,
                    time=int(time.time() * 1000 - random.random() * 86_400_000),
                )
            )
    return earthquakes


def generate_traffic(center_lat: float, center_lng: float, count: int = 80) -> list[TrafficEvent]:
    particles: list[TrafficEvent] = []
    for idx in range(count):
        angle = random.random() * math.pi * 2
        dist = random.random() * 0.015
        particles.append(
            TrafficEvent(
                id=idx,
                lat=center_lat + math.cos(angle) * dist,
                lng=center_lng + math.sin(angle) * dist,
                dLat=(random.random() - 0.5) * 0.00003,
                dLng=(random.random() - 0.5) * 0.00003,
                speed=0.5 + random.random() * 1.5,
            )
        )
    return particles


def _classify_ddos_severity(score: int) -> str:
    if score >= 90:
        return 'critical'
    if score >= 75:
        return 'high'
    if score >= 55:
        return 'medium'
    return 'low'


def _country_fallback_position(country_code: str) -> tuple[float, float]:
    code = (country_code or 'ZZ').upper()
    seed = sum(ord(char) for char in code)
    lat = ((seed * 17) % 140) - 70
    lng = ((seed * 31) % 340) - 170
    return float(lat), float(lng)


def _jitter(value: float, delta: float, salt: int) -> float:
    offset = (((salt * 9301 + 49297) % 233280) / 233280 - 0.5) * 2 * delta
    return value + offset


def fetch_ddos_events() -> list[DdosEvent]:
    settings = get_settings()
    now = int(time.time() * 1000)
    if settings.abuseipdb_api_key:
        try:
            data = _fetch_json(
                'https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=50&limit=200',
                headers={
                    'Accept': 'application/json',
                    'Key': settings.abuseipdb_api_key,
                },
            )
            rows = data.get('data') or []
            events: list[DdosEvent] = []
            for idx, row in enumerate(rows[:200]):
                ip = str(row.get('ipAddress') or '')
                if not ip:
                    continue
                country_code = str(row.get('countryCode') or 'ZZ').upper()
                score = int(float(row.get('abuseConfidenceScore') or 0))
                base_lat, base_lng = _country_fallback_position(country_code)
                salt = idx + len(ip)
                events.append(
                    DdosEvent(
                        id=f'ABUSE-{ip}-{now}',
                        ip=ip,
                        source='abuseipdb',
                        lat=_jitter(base_lat, 3.2, salt),
                        lng=_jitter(base_lng, 4.1, salt + 7),
                        countryCode=country_code,
                        ddosConfidenceScore=score,
                        severity=_classify_ddos_severity(score),
                        timestamp=now,
                    )
                )
            if events:
                return events
        except (URLError, TimeoutError, ValueError, KeyError, IndexError, TypeError):
            pass

    sample_countries = ['US', 'DE', 'BR', 'JP', 'SG', 'GB', 'IN', 'AU']
    events: list[DdosEvent] = []
    for idx in range(18):
        country_code = random.choice(sample_countries)
        score = random.randint(45, 98)
        lat, lng = _country_fallback_position(country_code)
        events.append(
            DdosEvent(
                id=f'SIM-DDOS-{idx}',
                ip=f'203.0.113.{10 + idx}',
                source='simulated',
                lat=_jitter(lat, 4.0, idx + 3),
                lng=_jitter(lng, 5.0, idx + 9),
                countryCode=country_code,
                packetsPerSecond=float(random.randint(80_000, 900_000)),
                bytesPerSecond=float(random.randint(10_000_000, 200_000_000)),
                ddosConfidenceScore=score,
                severity=_classify_ddos_severity(score),
                timestamp=now - idx * 90_000,
            )
        )
    return events
