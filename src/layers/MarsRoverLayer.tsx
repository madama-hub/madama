import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

export interface MarsRoverPoint {
    id: string;
    rover: string;
    camera: string;
    sol: number;
    earthDate: string;
    imageUrl?: string;
    pageUrl?: string;
    lat: number;
    lng: number;
}

interface MarsRoverLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
    onPhotoSelect?: (photo: MarsRoverPoint) => void;
}

const ROVER_LOCATIONS: Record<string, { lat: number; lng: number }> = {
    curiosity: { lat: -4.5895, lng: 137.4417 },
    perseverance: { lat: 18.4446, lng: 77.4509 },
    opportunity: { lat: -1.9462, lng: -5.5264 },
    spirit: { lat: -14.5684, lng: 175.4726 },
    insight: { lat: 4.5024, lng: 135.6234 },
};

export default function MarsRoverLayer({ visible, detectMode, onCountUpdate, onPhotoSelect }: MarsRoverLayerProps) {
    const [points, setPoints] = useState<MarsRoverPoint[]>([]);

    useEffect(() => {
        if (!visible) {
            setPoints([]);
            onCountUpdate(0);
            return;
        }

        const fetchRoverPoints = async () => {
            try {
                const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
                const res = await fetch(`${API_ENDPOINTS.NASA_MARS_ROVER_PHOTOS}?sol=1000&page=1&api_key=${apiKey}`);
                if (!res.ok) throw new Error('mars rover photos unavailable');
                const data = await res.json();
                const photos = Array.isArray(data?.photos) ? data.photos : [];

                const mapped: MarsRoverPoint[] = photos.slice(0, 120).map((photo: any, idx: number) => {
                    const roverName = String(photo?.rover?.name || 'Curiosity');
                    const roverKey = roverName.toLowerCase();
                    const seed = roverName.length * 13 + idx * 7;
                    const base = ROVER_LOCATIONS[roverKey] || ROVER_LOCATIONS.curiosity;
                    return {
                        id: String(photo?.id || `rover-${idx}`),
                        rover: roverName,
                        camera: String(photo?.camera?.name || 'NAVCAM'),
                        sol: Number(photo?.sol || 0),
                        earthDate: String(photo?.earth_date || ''),
                        imageUrl: typeof photo?.img_src === 'string' ? photo.img_src : undefined,
                        pageUrl: typeof photo?.earth_date === 'string'
                            ? `https://mars.nasa.gov/msl/multimedia/raw-images/?order=sol+desc&per_page=25&page=0&mission=msl&subsort=jpg&sol=${photo.sol}`
                            : undefined,
                        lat: base.lat + (((seed * 17) % 100) / 100 - 0.5) * 0.3,
                        lng: base.lng + (((seed * 29) % 100) / 100 - 0.5) * 0.3,
                    };
                });

                setPoints(mapped);
                onCountUpdate(mapped.length);
            } catch {
                const fallback = generateFallbackRoverPoints();
                setPoints(fallback);
                onCountUpdate(fallback.length);
            }
        };

        fetchRoverPoints();
    }, [visible, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {points.map((point) => (
                <Entity
                    key={point.id}
                    position={Cartesian3.fromDegrees(point.lng, point.lat, 0)}
                    onClick={() => onPhotoSelect?.(point)}
                >
                    <PointGraphics
                        pixelSize={9}
                        color={Color.fromCssColorString('#ff8a4d')}
                        outlineColor={Color.BLACK}
                        outlineWidth={2}
                        disableDepthTestDistance={Number.POSITIVE_INFINITY}
                        scaleByDistance={new NearFarScalar(2e5, 2.8, 1e7, 1.2)}
                    />
                    {detectMode && (
                        <LabelGraphics
                            text={`${point.rover} ${point.camera} SOL ${point.sol}`}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#ff8a4d')}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={2}
                            pixelOffset={{ x: 8, y: -8 } as any}
                            scaleByDistance={new NearFarScalar(2e5, 1, 1e7, 0.2)}
                        />
                    )}
                </Entity>
            ))}
        </>
    );
}

function generateFallbackRoverPoints(): MarsRoverPoint[] {
    return [
        {
            id: 'curiosity-gale',
            rover: 'Curiosity',
            camera: 'NAVCAM',
            sol: 1000,
            earthDate: '',
            imageUrl: 'https://mars.nasa.gov/system/resources/detail_files/27201_PIA25681-320.jpg',
            pageUrl: 'https://mars.nasa.gov/msl/multimedia/raw-images/',
            lat: -4.5895,
            lng: 137.4417,
        },
        {
            id: 'perseverance-jezero',
            rover: 'Perseverance',
            camera: 'MASTCAM',
            sol: 800,
            earthDate: '',
            imageUrl: 'https://mars.nasa.gov/system/resources/detail_files/25039_PIA24607-web.jpg',
            pageUrl: 'https://mars.nasa.gov/mars2020/multimedia/raw-images/',
            lat: 18.4446,
            lng: 77.4509,
        },
        {
            id: 'insight-elysium',
            rover: 'InSight',
            camera: 'IDC',
            sol: 500,
            earthDate: '',
            imageUrl: 'https://mars.nasa.gov/system/resources/detail_files/25784_PIA24479-320.jpg',
            pageUrl: 'https://mars.nasa.gov/insight/multimedia/raw-images/',
            lat: 4.5024,
            lng: 135.6234,
        },
    ];
}
