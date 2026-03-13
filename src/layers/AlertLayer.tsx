import { useEffect, useRef, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics, EllipseGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

interface AlertItem {
    region_id: string;
    lat: number;
    lng: number;
    score: number;
    severity: AlertSeverity;
    summary: string;
    reasons: string[];
}

interface AlertsResponse {
    alerts?: AlertItem[];
}

interface AlertLayerProps {
    visible: boolean;
    onCountUpdate: (count: number) => void;
}

function colorForSeverity(severity: AlertSeverity) {
    switch (severity) {
        case 'critical':
            return '#ff335f';
        case 'high':
            return '#ff8c00';
        case 'medium':
            return '#ffd166';
        default:
            return '#66b2b2';
    }
}

export default function AlertLayer({ visible, onCountUpdate }: AlertLayerProps) {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!visible) {
            setAlerts([]);
            onCountUpdate(0);
            return;
        }

        const loadAlerts = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.ALERTS);
                if (!response.ok) throw new Error('Alerts backend unavailable');
                const payload = (await response.json()) as AlertsResponse;
                const nextAlerts = Array.isArray(payload.alerts) ? payload.alerts : [];
                setAlerts(nextAlerts);
                onCountUpdate(nextAlerts.length);
            } catch {
                setAlerts([]);
                onCountUpdate(0);
            }
        };

        loadAlerts();
        intervalRef.current = setInterval(loadAlerts, 45_000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [visible, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {alerts.map((alert) => {
                const color = colorForSeverity(alert.severity);
                const radius = Math.max(50_000, Math.min(250_000, alert.score * 2_500));
                return (
                    <Entity key={`${alert.region_id}-${alert.score}`} position={Cartesian3.fromDegrees(alert.lng, alert.lat, 1000)}>
                        <PointGraphics
                            pixelSize={7}
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
                        <LabelGraphics
                            text={`${alert.severity.toUpperCase()} · ${alert.region_id}`}
                            font="8px Share Tech Mono"
                            fillColor={Color.fromCssColorString(color)}
                            outlineColor={Color.BLACK}
                            outlineWidth={2}
                            style={2}
                            pixelOffset={{ x: 9, y: -9 } as any}
                            scaleByDistance={new NearFarScalar(5e4, 1, 1e7, 0.2)}
                        />
                    </Entity>
                );
            })}
        </>
    );
}