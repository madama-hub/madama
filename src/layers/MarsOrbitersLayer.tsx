import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface MarsOrbiterPoint {
    id: string;
    name: string;
    lat: number;
    lng: number;
    alt: number;
}

interface MarsOrbitersLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

export default function MarsOrbitersLayer({ visible, detectMode, onCountUpdate }: MarsOrbitersLayerProps) {
    const [points, setPoints] = useState<MarsOrbiterPoint[]>([]);

    useEffect(() => {
        if (!visible) {
            setPoints([]);
            onCountUpdate(0);
            return;
        }

        const fetchOrbiters = async () => {
            try {
                await fetch(`${API_ENDPOINTS.JPL_HORIZONS}?format=text&COMMAND='499'&EPHEM_TYPE=VECTORS&CENTER='500@499'`);
            } catch {
                // Fallback below
            }

            const data: MarsOrbiterPoint[] = [
                { id: 'mro', name: 'MRO', lat: 4, lng: 40, alt: 380000 },
                { id: 'maven', name: 'MAVEN', lat: -12, lng: 140, alt: 450000 },
                { id: 'tgo', name: 'TGO', lat: 22, lng: -60, alt: 400000 },
            ];

            setPoints(data);
            onCountUpdate(data.length);
        };

        fetchOrbiters();
    }, [visible, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {points.map((p) => (
                <Entity key={p.id} position={Cartesian3.fromDegrees(p.lng, p.lat, p.alt)}>
                    <PointGraphics
                        pixelSize={4}
                        color={Color.fromCssColorString('#b388eb')}
                        outlineColor={Color.BLACK}
                        outlineWidth={1}
                        scaleByDistance={new NearFarScalar(2e5, 2, 2e7, 0.3)}
                    />
                    {detectMode && (
                        <LabelGraphics
                            text={p.name}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#b388eb')}
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
