import { MapPin } from 'lucide-react';
import { CITIES } from '../utils/constants';

interface LocationPanelProps {
    selectedCity: number;
    selectedLandmark: number;
    onCityChange: (index: number) => void;
    onLandmarkChange: (index: number) => void;
    compact?: boolean;
}

export default function LocationPanel({
    selectedCity, selectedLandmark,
    onCityChange, onLandmarkChange,
    compact = false,
}: LocationPanelProps) {
    const city = CITIES[selectedCity];
    const landmarks = city?.landmarks || [];

    return (
        <div className={`location-panel ${compact ? 'compact' : ''}`}>
            <div className="glass-panel" style={compact ? { padding: '8px 10px' } : { padding: '8px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 8, letterSpacing: 2, color: 'var(--text-dim)', textTransform: 'uppercase' }}>LOCATIONS</span>
                </div>
                <div className="location-dropdowns">
                    <MapPin size={12} color="var(--accent-red)" />
                    <div>
                        <div className="location-label">Location:</div>
                        <select
                            className="location-select"
                            value={selectedCity}
                            onChange={(e) => onCityChange(parseInt(e.target.value))}
                        >
                            <option value={-1}>---</option>
                            {CITIES.map((c, i) => (
                                <option key={i} value={i}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div className="location-label">Landmark:</div>
                        <select
                            className="location-select"
                            value={selectedLandmark}
                            onChange={(e) => onLandmarkChange(parseInt(e.target.value))}
                        >
                            <option value={-1}>---</option>
                            {landmarks.map((l, i) => (
                                <option key={i} value={i}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
