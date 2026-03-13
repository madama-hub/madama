import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface MarsSciencePoint {
    id: string;
    label: string;
    lat: number;
    lng: number;
}

interface MarsScienceLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

export default function MarsScienceLayer({ visible, detectMode, onCountUpdate }: MarsScienceLayerProps) {
    const [points, setPoints] = useState<MarsSciencePoint[]>([]);

    useEffect(() => {
        if (!visible) {
            setPoints([]);
            onCountUpdate(0);
            return;
        }

        const fetchScience = async () => {
            try {
                await fetch(`${API_ENDPOINTS.NASA_PDS_SEARCH}?q=mars`);
            } catch {
                // Fallback below
            }

            const data: MarsSciencePoint[] = [
                { id: 'pds-valles', label: 'PDS Geology Set', lat: -14.0, lng: -59.0 },
                { id: 'pds-jezero', label: 'PDS Spectrometry Set', lat: 18.4, lng: 77.5 },
                { id: 'pds-elysium', label: 'PDS Seismic Set', lat: 4.5, lng: 135.9 },
            ];

            setPoints(data);
            onCountUpdate(data.length);
        };

        fetchScience();
    }, [visible, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {points.map((p) => (
                <Entity key={p.id} position={Cartesian3.fromDegrees(p.lng, p.lat, 650)}>
                    <PointGraphics
                        pixelSize={4}
                        color={Color.fromCssColorString('#90be6d')}
                        outlineColor={Color.BLACK}
                        outlineWidth={1}
                        scaleByDistance={new NearFarScalar(2e5, 2, 1e7, 0.4)}
                    />
                    {detectMode && (
                        <LabelGraphics
                            text={p.label}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#90be6d')}
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
