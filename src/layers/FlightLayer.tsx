import { useState, useEffect, useRef } from 'react';
import { Entity, PointGraphics, LabelGraphics, PolylineGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface FlightData {
    icao24: string;
    callsign: string;
    lat: number;
    lng: number;
    alt: number;
    heading: number;
    velocity: number;
    onGround: boolean;
}

interface FlightLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

export default function FlightLayer({ visible, detectMode, onCountUpdate }: FlightLayerProps) {
    const [flights, setFlights] = useState<FlightData[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchFlights = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.OPENSKY);
            if (!res.ok) throw new Error('OpenSky API unavailable');
            const data = await res.json();

            if (data.states) {
                const parsed: FlightData[] = data.states
                    .filter((s: any[]) => s[5] != null && s[6] != null && !s[8])
                    .slice(0, 2000)
                    .map((s: any[]) => ({
                        icao24: s[0],
                        callsign: (s[1] || '').trim(),
                        lat: s[6],
                        lng: s[5],
                        alt: (s[7] || 0),
                        heading: s[10] || 0,
                        velocity: s[9] || 0,
                        onGround: s[8],
                    }));
                setFlights(parsed);
                onCountUpdate(parsed.length);
            }
        } catch {
            // Fallback: generate simulated flights
            const simulated = generateSimulatedFlights(500);
            setFlights(simulated);
            onCountUpdate(simulated.length);
        } finally {
        }
    };

    useEffect(() => {
        if (visible) {
            fetchFlights();
            intervalRef.current = setInterval(fetchFlights, 30000); // Refresh every 30s
        } else {
            setFlights([]);
            onCountUpdate(0);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [visible]);

    if (!visible) return null;

    return (
        <>
            {flights.map((flight, idx) => (
                <Entity
                    key={flight.icao24}
                    position={Cartesian3.fromDegrees(flight.lng, flight.lat, flight.alt)}
                >
                    {detectMode && idx < 300 && (
                        <PolylineGraphics
                            positions={buildEstimatedTrajectory(flight)}
                            width={1.2}
                            material={Color.fromCssColorString('#00ff88').withAlpha(0.35)}
                        />
                    )}
                    <PointGraphics
                        pixelSize={3}
                        color={Color.fromCssColorString('#00ff88')}
                        outlineColor={Color.fromCssColorString('#00ff88')}
                        outlineWidth={0}
                        scaleByDistance={new NearFarScalar(5e4, 2, 5e6, 0.5)}
                    />
                    {detectMode && flight.callsign && (
                        <LabelGraphics
                            text={flight.callsign}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#00ff88')}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={2}
                            pixelOffset={{ x: 6, y: -6 } as any}
                            scaleByDistance={new NearFarScalar(5e4, 1, 5e6, 0.2)}
                        />
                    )}
                </Entity>
            ))}
        </>
    );
}

function buildEstimatedTrajectory(flight: FlightData) {
    // OpenSky velocity is m/s. We estimate +/- 10 minutes around current position.
    // This is a heading-based projection, not true filed route origin/destination.
    const samples = 8;
    const totalSeconds = 10 * 60;
    const latRad = (flight.lat * Math.PI) / 180;
    const headingRad = (flight.heading * Math.PI) / 180;
    const metersPerDegLat = 111_320;
    const metersPerDegLng = Math.max(111_320 * Math.cos(latRad), 1);
    const speed = Math.max(flight.velocity || 0, 120);

    const positions: number[] = [];

    for (let i = -samples; i <= samples; i++) {
        const t = (i / samples) * totalSeconds;
        const dMeters = speed * t;
        const dLat = (dMeters * Math.cos(headingRad)) / metersPerDegLat;
        const dLng = (dMeters * Math.sin(headingRad)) / metersPerDegLng;

        positions.push(
            flight.lng + dLng,
            flight.lat + dLat,
            Math.max(flight.alt, 0),
        );
    }

    return Cartesian3.fromDegreesArrayHeights(positions);
}

function generateSimulatedFlights(count: number): FlightData[] {
    const flights: FlightData[] = [];
    // Concentrate around major air corridors
    const corridors = [
        { lat: 45, lng: -30, spread: 20 },  // Transatlantic
        { lat: 35, lng: 100, spread: 25 },  // Asia
        { lat: 40, lng: 10, spread: 15 },   // Europe
        { lat: 35, lng: -90, spread: 15 },  // US mainland
        { lat: -20, lng: 130, spread: 15 }, // Australia
    ];

    for (let i = 0; i < count; i++) {
        const corridor = corridors[Math.floor(Math.random() * corridors.length)];
        flights.push({
            icao24: `SIM${String(i).padStart(4, '0')}`,
            callsign: `${['UAL', 'DAL', 'AAL', 'SWA', 'BAW', 'DLH', 'AFR'][Math.floor(Math.random() * 7)]}${100 + i}`,
            lat: corridor.lat + (Math.random() - 0.5) * corridor.spread * 2,
            lng: corridor.lng + (Math.random() - 0.5) * corridor.spread * 2,
            alt: 8000 + Math.random() * 4000,
            heading: Math.random() * 360,
            velocity: 200 + Math.random() * 300,
            onGround: false,
        });
    }
    return flights;
}
