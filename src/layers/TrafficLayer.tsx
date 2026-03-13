import { useState, useEffect, useRef } from 'react';
import { Entity, PointGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface TrafficLayerProps {
    visible: boolean;
    centerLat: number;
    centerLng: number;
    onCountUpdate: (count: number) => void;
}

interface TrafficParticle {
    id: number;
    lat: number;
    lng: number;
    dLat: number;
    dLng: number;
    speed: number;
}

interface TrafficApiResponse {
    traffic?: TrafficParticle[];
}

export default function TrafficLayer({ visible, centerLat, centerLng, onCountUpdate }: TrafficLayerProps) {
    const [particles, setParticles] = useState<TrafficParticle[]>([]);
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        if (!visible) {
            setParticles([]);
            onCountUpdate(0);
            return;
        }

        const loadTraffic = async () => {
            try {
                const params = new URLSearchParams({
                    center_lat: String(centerLat),
                    center_lng: String(centerLng),
                });
                const response = await fetch(`${API_ENDPOINTS.TRAFFIC_EVENTS}?${params.toString()}`);
                if (!response.ok) throw new Error('Traffic backend unavailable');
                const payload = (await response.json()) as TrafficApiResponse;
                const nextParticles = Array.isArray(payload.traffic) ? payload.traffic : [];
                setParticles(nextParticles);
                onCountUpdate(nextParticles.length);
            } catch {
                const count = 80;
                const fallbackParticles: TrafficParticle[] = [];
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 0.015;
                    fallbackParticles.push({
                        id: i,
                        lat: centerLat + Math.cos(angle) * dist,
                        lng: centerLng + Math.sin(angle) * dist,
                        dLat: (Math.random() - 0.5) * 0.00003,
                        dLng: (Math.random() - 0.5) * 0.00003,
                        speed: 0.5 + Math.random() * 1.5,
                    });
                }
                setParticles(fallbackParticles);
                onCountUpdate(fallbackParticles.length);
            }
        };

        loadTraffic();

        // Animate particles
        const animate = () => {
            setParticles(prev => prev.map(p => {
                let newLat = p.lat + p.dLat * p.speed;
                let newLng = p.lng + p.dLng * p.speed;

                // Bounce back if too far from center
                const distFromCenter = Math.sqrt(
                    Math.pow(newLat - centerLat, 2) + Math.pow(newLng - centerLng, 2)
                );
                if (distFromCenter > 0.02) {
                    return {
                        ...p,
                        dLat: -p.dLat + (Math.random() - 0.5) * 0.00001,
                        dLng: -p.dLng + (Math.random() - 0.5) * 0.00001,
                        lat: newLat,
                        lng: newLng,
                    };
                }
                return { ...p, lat: newLat, lng: newLng };
            }));
            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [visible, centerLat, centerLng, onCountUpdate]);

    if (!visible) return null;

    return (
        <>
            {particles.map((p) => (
                <Entity
                    key={p.id}
                    position={Cartesian3.fromDegrees(p.lng, p.lat, 5)}
                >
                    <PointGraphics
                        pixelSize={3}
                        color={Color.fromCssColorString('#ffee00').withAlpha(0.8)}
                        scaleByDistance={new NearFarScalar(200, 3, 50000, 0.3)}
                    />
                </Entity>
            ))}
        </>
    );
}
