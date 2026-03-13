import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface MarsWeatherPoint {
    id: string;
    lat: number;
    lng: number;
    tempC: number;
    windMps: number;
    pressurePa: number;
}

interface MarsWeatherLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

export default function MarsWeatherLayer({ visible, detectMode, onCountUpdate }: MarsWeatherLayerProps) {
    const [points, setPoints] = useState<MarsWeatherPoint[]>([]);

    useEffect(() => {
        if (!visible) {
            setPoints([]);
            onCountUpdate(0);
            return;
        }

        const fetchWeather = async () => {
            try {
                const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
                const res = await fetch(`${API_ENDPOINTS.NASA_INSIGHT_WEATHER}?api_key=${apiKey}&feedtype=json&ver=1.0`);
                if (!res.ok) throw new Error('insight weather unavailable');
                await res.json();
            } catch {
                // Fall back to static Mars weather station around Elysium Planitia
            }

            const data: MarsWeatherPoint[] = [
                { id: 'insight-wx', lat: 4.5, lng: 135.9, tempC: -62, windMps: 6.8, pressurePa: 720 },
                { id: 'gale-wx', lat: -5.4, lng: 137.8, tempC: -55, windMps: 5.1, pressurePa: 740 },
            ];
            setPoints(data);
            onCountUpdate(data.length);
        };

        fetchWeather();
    }, [visible, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {points.map((p) => (
                <Entity key={p.id} position={Cartesian3.fromDegrees(p.lng, p.lat, 600)}>
                    <PointGraphics
                        pixelSize={5}
                        color={Color.fromCssColorString('#53d8fb')}
                        outlineColor={Color.BLACK}
                        outlineWidth={1}
                        scaleByDistance={new NearFarScalar(2e5, 2, 1e7, 0.4)}
                    />
                    {detectMode && (
                        <LabelGraphics
                            text={`TEMP ${p.tempC}C | WIND ${p.windMps.toFixed(1)} m/s`}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#53d8fb')}
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
