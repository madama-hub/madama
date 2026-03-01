import { useState, useEffect } from 'react';
import { Entity, PointGraphics, LabelGraphics, EllipseGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface EarthquakeData {
    id: string;
    mag: number;
    place: string;
    lat: number;
    lng: number;
    depth: number;
    time: number;
}

interface EarthquakeLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

export default function EarthquakeLayer({ visible, detectMode, onCountUpdate }: EarthquakeLayerProps) {
    const [quakes, setQuakes] = useState<EarthquakeData[]>([]);

    useEffect(() => {
        if (!visible) {
            setQuakes([]);
            onCountUpdate(0);
            return;
        }

        const fetchQuakes = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.USGS_EARTHQUAKES);
                const data = await res.json();

                if (data.features) {
                    const parsed: EarthquakeData[] = data.features.map((f: any) => ({
                        id: f.id,
                        mag: f.properties.mag,
                        place: f.properties.place,
                        lat: f.geometry.coordinates[1],
                        lng: f.geometry.coordinates[0],
                        depth: f.geometry.coordinates[2],
                        time: f.properties.time,
                    }));
                    setQuakes(parsed);
                    onCountUpdate(parsed.length);
                }
            } catch {
                // Fallback simulated data
                const simulated = generateSimulatedQuakes();
                setQuakes(simulated);
                onCountUpdate(simulated.length);
            }
        };

        fetchQuakes();
    }, [visible]);

    if (!visible) return null;

    return (
        <>
            {quakes.map((quake) => {
                const size = Math.max(3, quake.mag * 2);
                const circleRadius = quake.mag * 15000;
                return (
                    <Entity
                        key={quake.id}
                        position={Cartesian3.fromDegrees(quake.lng, quake.lat, 0)}
                    >
                        <PointGraphics
                            pixelSize={size}
                            color={Color.fromCssColorString('#ff44aa').withAlpha(0.8)}
                            outlineColor={Color.fromCssColorString('#ff44aa')}
                            outlineWidth={1}
                            scaleByDistance={new NearFarScalar(1e5, 2, 1e7, 0.5)}
                        />
                        <EllipseGraphics
                            semiMajorAxis={circleRadius}
                            semiMinorAxis={circleRadius}
                            material={Color.fromCssColorString('#ff44aa').withAlpha(0.08)}
                            outline
                            outlineColor={Color.fromCssColorString('#ff44aa').withAlpha(0.3)}
                            outlineWidth={1}
                            height={0}
                        />
                        {detectMode && (
                            <LabelGraphics
                                text={`M${quake.mag.toFixed(1)} ${quake.place || ''}`}
                                font="8px Share Tech Mono"
                                fillColor={Color.fromCssColorString('#ff44aa')}
                                outlineColor={Color.BLACK}
                                outlineWidth={2}
                                style={2}
                                pixelOffset={{ x: 10, y: -10 } as any}
                                scaleByDistance={new NearFarScalar(1e5, 1, 1e7, 0.2)}
                            />
                        )}
                    </Entity>
                );
            })}
        </>
    );
}

function generateSimulatedQuakes(): EarthquakeData[] {
    const zones = [
        { lat: 35, lng: 139, name: 'Japan' },
        { lat: -33, lng: -71, name: 'Chile' },
        { lat: 37, lng: -122, name: 'California' },
        { lat: 28, lng: 84, name: 'Nepal' },
        { lat: -6, lng: 106, name: 'Indonesia' },
    ];

    return zones.flatMap((zone, zi) =>
        Array.from({ length: 5 }, (_, i) => ({
            id: `SIM-${zi}-${i}`,
            mag: 2.5 + Math.random() * 4,
            place: `${Math.floor(Math.random() * 100)}km from ${zone.name}`,
            lat: zone.lat + (Math.random() - 0.5) * 5,
            lng: zone.lng + (Math.random() - 0.5) * 5,
            depth: Math.random() * 100,
            time: Date.now() - Math.random() * 86400000,
        }))
    );
}
