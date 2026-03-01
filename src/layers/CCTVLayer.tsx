import { useEffect } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';

export interface CameraPoint {
    id: string;
    name: string;
    lat: number;
    lng: number;
    streamUrl?: string;
    embedUrl?: string;
    pageUrl?: string;
    thumbnail?: string;
}

interface CCTVLayerProps {
    visible: boolean;
    showLabels: boolean;
    cameras: CameraPoint[];
    onCountUpdate: (count: number) => void;
    onCameraSelect?: (camera: CameraPoint) => void;
}

export default function CCTVLayer({ visible, showLabels, cameras, onCountUpdate, onCameraSelect }: CCTVLayerProps) {
    useEffect(() => {
        onCountUpdate(visible ? cameras.length : 0);
    }, [visible, cameras, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {cameras.map((cam) => (
                <Entity
                    key={cam.id}
                    position={Cartesian3.fromDegrees(cam.lng, cam.lat, 35)}
                    onClick={() => onCameraSelect?.(cam)}
                >
                    <PointGraphics
                        pixelSize={9}
                        color={Color.fromCssColorString('#ff2244')}
                        outlineColor={Color.fromCssColorString('#ff2244')}
                        outlineWidth={2}
                        scaleByDistance={new NearFarScalar(200, 1.4, 120000, 0.9)}
                        disableDepthTestDistance={Number.POSITIVE_INFINITY}
                    />
                    {showLabels && (
                        <LabelGraphics
                            text={cam.name}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#ff2244')}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={2}
                            pixelOffset={{ x: 10, y: -10 } as any}
                            scaleByDistance={new NearFarScalar(200, 1, 50000, 0.2)}
                            disableDepthTestDistance={Number.POSITIVE_INFINITY}
                        />
                    )}
                </Entity>
            ))}
        </>
    );
}
