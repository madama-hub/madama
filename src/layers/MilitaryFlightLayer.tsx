import { useState, useEffect } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { generateMilitaryFlights } from '../utils/constants';

interface MilitaryFlightLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

export default function MilitaryFlightLayer({ visible, detectMode, onCountUpdate }: MilitaryFlightLayerProps) {
    const [flights, setFlights] = useState<ReturnType<typeof generateMilitaryFlights>>([]);

    useEffect(() => {
        if (visible) {
            const data = generateMilitaryFlights();
            setFlights(data);
            onCountUpdate(data.length);
        } else {
            setFlights([]);
            onCountUpdate(0);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <>
            {flights.map((flight) => (
                <Entity
                    key={flight.id}
                    position={Cartesian3.fromDegrees(flight.lng, flight.lat, flight.alt)}
                >
                    <PointGraphics
                        pixelSize={4}
                        color={Color.fromCssColorString('#ff6c00')}
                        outlineColor={Color.fromCssColorString('#ff6c00')}
                        outlineWidth={1}
                        scaleByDistance={new NearFarScalar(5e4, 2, 5e6, 0.6)}
                    />
                    {detectMode && (
                        <LabelGraphics
                            text={`${flight.callsign} [${flight.type}]`}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString('#ff6c00')}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={2}
                            pixelOffset={{ x: 8, y: -8 } as any}
                            scaleByDistance={new NearFarScalar(5e4, 1, 5e6, 0.2)}
                        />
                    )}
                </Entity>
            ))}
        </>
    );
}
