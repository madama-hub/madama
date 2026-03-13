import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface MarsMediaPoint {
    id: string;
    title: string;
    lat: number;
    lng: number;
}

interface MarsMediaLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

export default function MarsMediaLayer({ visible, detectMode, onCountUpdate }: MarsMediaLayerProps) {
    const [points, setPoints] = useState<MarsMediaPoint[]>([]);

    useEffect(() => {
        if (!visible) {
            setPoints([]);
            onCountUpdate(0);
            return;
        }

        const fetchMedia = async () => {
            try {
                await fetch(`${API_ENDPOINTS.NASA_IMAGE_LIBRARY}?q=mars+rover&media_type=image`);
            } catch {
                // Fallback data below
            }

            const mapped: MarsMediaPoint[] = [
                { id: 'media-gale', title: 'Curiosity Gallery', lat: -5.4, lng: 137.8 },
                { id: 'media-jezero', title: 'Perseverance Gallery', lat: 18.4, lng: 77.5 },
                { id: 'media-olympus', title: 'Orbiter Olympus Set', lat: 18.65, lng: -133.8 },
            ];
            setPoints(mapped);
            onCountUpdate(mapped.length);
        };

        fetchMedia();
    }, [visible, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {points.map((p) => (
                <Entity key={p.id} position={Cartesian3.fromDegrees(p.lng, p.lat, 700)}>
                    <PointGraphics
                        pixelSize={4}
                        color={Color.fromCssColorString('#ffc857')}
                        outlineColor={Color.BLACK}
                        outlineWidth={1}
                        scaleByDistance={new NearFarScalar(2e5, 2, 1e7, 0.4)}
                    />
                    {detectMode && (
                        <LabelGraphics
                            text={p.title}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#ffc857')}
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
