import { useState, useEffect } from 'react';
import { Entity, PointGraphics, PolylineGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';

// We'll use simplified satellite positions instead of full TLE propagation
// to avoid complex satellite.js setup issues

interface SatelliteData {
    id: string;
    name: string;
    lat: number;
    lng: number;
    alt: number; // km
    orbitPoints?: Array<{ lat: number; lng: number; alt: number }>;
}

interface SatelliteLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

function generateSatellites(): SatelliteData[] {
    const sats: SatelliteData[] = [];
    const groups = [
        { prefix: 'STARLINK', count: 60, altRange: [340, 550] },
        { prefix: 'NORAD', count: 30, altRange: [400, 2000] },
        { prefix: 'ISS', count: 1, altRange: [408, 420] },
        { prefix: 'GPS', count: 24, altRange: [20180, 20220] },
        { prefix: 'COSMOS', count: 15, altRange: [500, 1500] },
    ];

    groups.forEach((group) => {
        for (let i = 0; i < group.count; i++) {
            const lat = (Math.random() - 0.5) * 160;
            const lng = (Math.random() - 0.5) * 360;
            const alt = group.altRange[0] + Math.random() * (group.altRange[1] - group.altRange[0]);
            const noradId = 10000 + sats.length;

            // Generate orbit arc
            const orbitPoints: Array<{ lat: number; lng: number; alt: number }> = [];
            const inclination = (Math.random() * 80 + 10) * (Math.PI / 180);
            const startLng = lng;
            for (let j = 0; j <= 60; j++) {
                const frac = (j / 60) * Math.PI * 2;
                const oLat = Math.asin(Math.sin(inclination) * Math.sin(frac)) * (180 / Math.PI);
                const oLng = startLng + (j / 60) * 360;
                orbitPoints.push({ lat: oLat, lng: oLng > 180 ? oLng - 360 : oLng, alt: alt });
            }

            sats.push({
                id: `NORAD-${noradId}`,
                name: `${group.prefix}-${i + 1}`,
                lat, lng, alt,
                orbitPoints,
            });
        }
    });
    return sats;
}

export default function SatelliteLayer({ visible, detectMode, onCountUpdate }: SatelliteLayerProps) {
    const [satellites, setSatellites] = useState<SatelliteData[]>([]);
    const [selectedSat, setSelectedSat] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            const sats = generateSatellites();
            setSatellites(sats);
            onCountUpdate(sats.length);
        } else {
            setSatellites([]);
            onCountUpdate(0);
        }
    }, [visible]);

    if (!visible) return null;

    const selectedSatData = satellites.find(s => s.id === selectedSat);

    return (
        <>
            {satellites.map((sat) => (
                <Entity
                    key={sat.id}
                    position={Cartesian3.fromDegrees(sat.lng, sat.lat, sat.alt * 1000)}
                    onClick={() => setSelectedSat(sat.id === selectedSat ? null : sat.id)}
                >
                    <PointGraphics
                        pixelSize={sat.id === selectedSat ? 6 : 3}
                        color={sat.id === selectedSat ? Color.fromCssColorString('#00ff88') : Color.fromCssColorString('#00f0ff')}
                        outlineColor={Color.fromCssColorString('#00f0ff')}
                        outlineWidth={sat.id === selectedSat ? 2 : 0}
                        scaleByDistance={new NearFarScalar(1e6, 1.5, 1e8, 0.3)}
                    />
                    {detectMode && (
                        <LabelGraphics
                            text={sat.id}
                            font="9px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#00f0ff')}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={2}
                            pixelOffset={{ x: 8, y: -8 } as any}
                            scaleByDistance={new NearFarScalar(1e6, 1, 1e8, 0.2)}
                            showBackground={true}
                            backgroundColor={Color.fromCssColorString('rgba(0,0,0,0.7)') as any}
                        />
                    )}
                </Entity>
            ))}
            {/* Show orbit for selected satellite */}
            {selectedSatData?.orbitPoints && (
                <Entity>
                    <PolylineGraphics
                        positions={Cartesian3.fromDegreesArrayHeights(
                            selectedSatData.orbitPoints.flatMap(p => [p.lng, p.lat, p.alt * 1000])
                        )}
                        width={1}
                        material={Color.fromCssColorString('#00f0ff').withAlpha(0.3)}
                    />
                </Entity>
            )}
        </>
    );
}
