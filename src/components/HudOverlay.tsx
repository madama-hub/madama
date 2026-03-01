import { useState, useEffect } from 'react';
import { latLngToMGRS, formatLatLng } from '../utils/mgrs';

interface HudOverlayProps {
    activeStyle: string;
    cameraLat: number;
    cameraLng: number;
    cameraAlt: number;
}

export default function HudOverlay({
    activeStyle, cameraLat, cameraLng,
}: HudOverlayProps) {
    const [timestamp, setTimestamp] = useState('');
    const [orbNumber] = useState(47916);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const y = now.getFullYear();
            const mo = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const h = String(now.getHours()).padStart(2, '0');
            const mi = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            setTimestamp(`${y}-${mo}-${d} ${h}:${mi}:${s}${ms.substring(0, 1)}`);
        };
        update();
        const interval = setInterval(update, 100);
        return () => clearInterval(interval);
    }, []);

    const mgrs = latLngToMGRS(cameraLat, cameraLng);
    const latLng = formatLatLng(cameraLat, cameraLng);

    return (
        <div className="hud-overlay">
            {/* Branding */}
            <div className="hud-brand">
                <div className="brand-container">
                    <div className="brand-icon">
                        <div className="brand-icon-inner" />
                    </div>
                    <div>
                        <div className="brand-title">DORJAN</div>
                        <div className="brand-subtitle">No Place Left Behind</div>
                    </div>
                </div>
            </div>

            {/* Top Right */}
            <div className="hud-top-right">
                <div className="hud-active-style-label">ACTIVE STYLE</div>
                <div className="hud-active-style-value">{activeStyle.toUpperCase()}</div>
                <div className="hud-rec">
                    <span className="rec-dot" />
                    REC {timestamp}
                </div>
                <div className="hud-orb">ORB: {orbNumber} PASS: DESC-192</div>
            </div>

            {/* Bottom Left - MGRS */}
            <div className="hud-bottom-left">
                <span className="hud-mgrs-label">┗ MGRS:</span>
                <div className="hud-mgrs">{mgrs}</div>
                <div className="hud-mgrs" style={{ marginTop: 2 }}>{latLng}</div>
            </div>

            {/* Corner brackets */}
            <div className="corner-bracket tl" />
            <div className="corner-bracket tr" />
            <div className="corner-bracket bl" />
            <div className="corner-bracket br" />

            {/* Center crosshair */}
            <div className="crosshair" />

            {/* Scan line */}
            <div className="scan-line-bar" />
        </div>
    );
}
