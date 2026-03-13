import { useEffect, useRef, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics, EllipseGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

type DdosSeverity = 'low' | 'medium' | 'high' | 'critical';

interface DdosEvent {
    id: string;
    ip: string;
    source: 'cloudflare' | 'abuseipdb' | 'fused';
    lat: number;
    lng: number;
    countryCode?: string;
    packetsPerSecond?: number;
    bytesPerSecond?: number;
    ddosConfidenceScore: number;
    severity: DdosSeverity;
    timestamp: number;
}

interface DdosLayerProps {
    visible: boolean;
    detectMode: boolean;
    onCountUpdate: (count: number) => void;
}

interface DdosProxyResponse {
    events?: DdosEvent[];
}

export default function DdosLayer({ visible, detectMode, onCountUpdate }: DdosLayerProps) {
    const [events, setEvents] = useState<DdosEvent[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!visible) {
            setEvents([]);
            onCountUpdate(0);
            return;
        }

        const fetchDdosEvents = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.DDOS_EVENTS);
                if (!res.ok) throw new Error('DDoS proxy unavailable');
                const data = (await res.json()) as DdosProxyResponse;
                const parsed = Array.isArray(data.events) ? data.events : [];
                setEvents(parsed);
                onCountUpdate(parsed.length);
            } catch {
                setEvents([]);
                onCountUpdate(0);
            }
        };

        fetchDdosEvents();
        intervalRef.current = setInterval(fetchDdosEvents, 45000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [visible, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {events.map((event) => {
                const highConfidence = event.ddosConfidenceScore >= 85;
                const severe = event.severity === 'critical' || event.severity === 'high';
                const color = highConfidence
                    ? '#ff335f'
                    : severe
                        ? '#ff8c00'
                        : '#ffd166';
                const radius = Math.max(22000, Math.min(240000, (event.ddosConfidenceScore / 100) * 240000));
                const pointSize = highConfidence ? 7 : 5;

                return (
                    <Entity
                        key={event.id}
                        position={Cartesian3.fromDegrees(event.lng, event.lat, 1000)}
                    >
                        <PointGraphics
                            pixelSize={pointSize}
                            color={Color.fromCssColorString(color).withAlpha(0.95)}
                            outlineColor={Color.BLACK}
                            outlineWidth={1}
                            scaleByDistance={new NearFarScalar(5e4, 2, 1e7, 0.6)}
                        />
                        <EllipseGraphics
                            semiMajorAxis={radius}
                            semiMinorAxis={radius}
                            material={Color.fromCssColorString(color).withAlpha(0.08)}
                            outline
                            outlineColor={Color.fromCssColorString(color).withAlpha(0.3)}
                            outlineWidth={1}
                            height={0}
                        />
                        {(detectMode || highConfidence) && (
                            <LabelGraphics
                                text={`${highConfidence ? 'HIGH-RISK ' : ''}${event.ip} (${event.ddosConfidenceScore})`}
                                font="8px Share Tech Mono"
                                fillColor={Color.fromCssColorString(color)}
                                outlineColor={Color.BLACK}
                                outlineWidth={2}
                                style={2}
                                pixelOffset={{ x: 9, y: -9 } as any}
                                scaleByDistance={new NearFarScalar(5e4, 1, 1e7, 0.2)}
                            />
                        )}
                    </Entity>
                );
            })}
        </>
    );
}
