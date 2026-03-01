import { useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, Minus, Satellite, Plane, Shield, Car, Video, Activity } from 'lucide-react';
import LocationPanel from './LocationPanel';
import AIInsightsPanel from './AIInsightsPanel';

export interface DataLayerState {
    satellites: boolean;
    flights: boolean;
    military: boolean;
    traffic: boolean;
    cctv: boolean;
    earthquakes: boolean;
}

interface LeftSidebarProps {
    dataLayers: DataLayerState;
    onToggleLayer: (layer: keyof DataLayerState) => void;
    layerCounts: Record<string, number>;
    selectedCity: number;
    selectedLandmark: number;
    onCityChange: (index: number) => void;
    onLandmarkChange: (index: number) => void;
    detectMode: boolean;
    locationName: string;
    landmarkName: string;
    cleanUI: boolean;
}

export default function LeftSidebar({
    dataLayers,
    onToggleLayer,
    layerCounts,
    selectedCity,
    selectedLandmark,
    onCityChange,
    onLandmarkChange,
    detectMode,
    locationName,
    landmarkName,
    cleanUI,
}: LeftSidebarProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const layers: Array<{ key: keyof DataLayerState; label: string; icon: ReactNode; color: string }> = [
        { key: 'satellites', label: 'Satellites', icon: <Satellite size={12} />, color: '#00f0ff' },
        { key: 'flights', label: 'Flights', icon: <Plane size={12} />, color: '#00ff88' },
        { key: 'military', label: 'Military', icon: <Shield size={12} />, color: '#ff6c00' },
        { key: 'traffic', label: 'Traffic', icon: <Car size={12} />, color: '#ffee00' },
        { key: 'cctv', label: 'CCTV', icon: <Video size={12} />, color: '#ff2244' },
        { key: 'earthquakes', label: 'Seismic', icon: <Activity size={12} />, color: '#ff44aa' },
    ];

    return (
        <div className="left-sidebar">
            {/* Data Feed Section */}
            <div className="sidebar-section">
                <span className="sidebar-section-label">Data Feed</span>
                <button className="expand-btn" onClick={() => toggleSection('feed')}>
                    {expandedSection === 'feed' ? <Minus size={12} /> : <Plus size={12} />}
                </button>
            </div>
            {expandedSection === 'feed' && (
                <div className="glass-panel" style={{ marginLeft: 0, minWidth: 180 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 8 }}>LIVE CONNECTIONS</div>
                    {['CELESTRAK', 'OPENSKY', 'USGS', 'ADSB-X'].map((feed) => (
                        <div key={feed} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 9, color: 'var(--text-secondary)' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.5)' }} />
                            {feed}
                        </div>
                    ))}
                </div>
            )}

            {/* Data Layers Section */}
            <div className="sidebar-section">
                <span className="sidebar-section-label">Data Layers</span>
                <button className="expand-btn" onClick={() => toggleSection('layers')}>
                    {expandedSection === 'layers' ? <Minus size={12} /> : <Plus size={12} />}
                </button>
            </div>
            {expandedSection === 'layers' && (
                <div className="glass-panel data-layers-panel">
                    {layers.map(({ key, label, icon, color }) => (
                        <div
                            key={key}
                            className="layer-toggle"
                            onClick={() => onToggleLayer(key)}
                        >
                            <div className="layer-toggle-name">
                                <div
                                    className={`layer-toggle-dot ${dataLayers[key] ? 'active' : ''}`}
                                    style={dataLayers[key] ? { background: color, boxShadow: `0 0 8px ${color}60` } : {}}
                                />
                                {icon}
                                {label}
                            </div>
                            <span className="layer-toggle-count">
                                {layerCounts[key] || 0}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Scenes Section */}
            <div className="sidebar-section">
                <span className="sidebar-section-label">Scenes</span>
                <button className="expand-btn" onClick={() => toggleSection('scenes')}>
                    {expandedSection === 'scenes' ? <Minus size={12} /> : <Plus size={12} />}
                </button>
            </div>
            {expandedSection === 'scenes' && (
                <div className="glass-panel" style={{ minWidth: 180 }}>
                    <div>
                        <LocationPanel
                            selectedCity={selectedCity}
                            selectedLandmark={selectedLandmark}
                            onCityChange={onCityChange}
                            onLandmarkChange={onLandmarkChange}
                            compact
                        />
                    </div>
                </div>
            )}

            {/* AI Insights Section */}
            <div className="sidebar-section">
                <span className="sidebar-section-label">AI Insights</span>
                <button className="expand-btn" onClick={() => toggleSection('insights')}>
                    {expandedSection === 'insights' ? <Minus size={12} /> : <Plus size={12} />}
                </button>
            </div>
            {expandedSection === 'insights' && (
                <div className="sidebar-ai-insights-wrap">
                    <AIInsightsPanel
                        dataLayers={dataLayers}
                        layerCounts={layerCounts}
                        detectMode={detectMode}
                        locationName={locationName}
                        landmarkName={landmarkName}
                        cleanUI={cleanUI}
                        compact
                    />
                </div>
            )}
        </div>
    );
}
