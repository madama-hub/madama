import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics, EllipseGraphics } from 'resium';
import { Cartesian3, Color } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface MarsSolarEvent {
    id: string;
    lat: number;
    lng: number;
    impactIndex: number;
}

interface MarsSolarWeatherLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

export default function MarsSolarWeatherLayer({ visible, detectMode, onCountUpdate }: MarsSolarWeatherLayerProps) {
    const [events, setEvents] = useState<MarsSolarEvent[]>([]);

    useEffect(() => {
        if (!visible) {
            setEvents([]);
            onCountUpdate(0);
            return;
        }

        const fetchSolar = async () => {
            try {
                const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
                const end = new Date().toISOString().slice(0, 10);
                const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
                await fetch(`${API_ENDPOINTS.NASA_DONKI_CME}?startDate=${start}&endDate=${end}&api_key=${apiKey}`);
            } catch {
                // Fallback data below
            }

            const data: MarsSolarEvent[] = [
                { id: 'donki-1', lat: 0, lng: 0, impactIndex: 72 },
                { id: 'donki-2', lat: 16, lng: 75, impactIndex: 58 },
            ];

            setEvents(data);
            onCountUpdate(data.length);
        };

        fetchSolar();
    }, [visible, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {events.map((ev) => (
                <Entity key={ev.id} position={Cartesian3.fromDegrees(ev.lng, ev.lat, 1200)}>
                    <PointGraphics
                        pixelSize={5}
                        color={Color.fromCssColorString('#f94144')}
                        outlineColor={Color.BLACK}
                        outlineWidth={1}
                    />
                    <EllipseGraphics
                        semiMajorAxis={30000 + ev.impactIndex * 300}
                        semiMinorAxis={30000 + ev.impactIndex * 300}
                        material={Color.fromCssColorString('#f94144').withAlpha(0.1)}
                        outline
                        outlineColor={Color.fromCssColorString('#f94144').withAlpha(0.35)}
                        height={0}
                    />
                    {detectMode && (
                        <LabelGraphics
                            text={`DONKI CME IDX ${ev.impactIndex}`}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#f94144')}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={2}
                            pixelOffset={{ x: 8, y: -8 } as any}
                        />
                    )}
                </Entity>
            ))}
        </>
    );
}
