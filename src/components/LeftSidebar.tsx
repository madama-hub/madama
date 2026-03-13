import { useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, Minus, Plane, Car, Video, Activity, AlertTriangle, Camera, Thermometer, ImageIcon, FlaskConical, Orbit, SunMedium, Moon, Mountain, Database, Rocket, Radar } from 'lucide-react';
import LocationPanel from './LocationPanel';
import AIInsightsPanel from './AIInsightsPanel';
import { DATA_FEEDS_BY_WORLD } from '../utils/constants';
import type { CityData, WorldMode } from '../utils/constants';

export interface DataLayerState {
    flights: boolean;
    traffic: boolean;
    cctv: boolean;
    earthquakes: boolean;
    ddos: boolean;
    moonMedia: boolean;
    moonLro: boolean;
    moonScience: boolean;
    moonOrbiters: boolean;
    moonSpice: boolean;
    moonArtemis: boolean;
    moonSolarWeather: boolean;
    marsRovers: boolean;
    marsWeather: boolean;
    marsMedia: boolean;
    marsScience: boolean;
    marsOrbiters: boolean;
    marsSolarWeather: boolean;
}

interface LeftSidebarProps {
    dataLayers: DataLayerState;
    onToggleLayer: (layer: keyof DataLayerState) => void;
    layerCounts: Record<string, number>;
    worldMode: WorldMode;
    scenes: CityData[];
    selectedCity: number;
    selectedLandmark: number;
    onCityChange: (index: number) => void;
    onLandmarkChange: (index: number) => void;
    detectMode: boolean;
    locationName: string;
    landmarkName: string;
    cleanUI: boolean;
}

type LayerOption = {
    key: keyof DataLayerState;
    label: string;
    icon: ReactNode;
    color: string;
    description?: string;
};

export default function LeftSidebar({
    dataLayers,
    onToggleLayer,
    layerCounts,
    worldMode,
    scenes,
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

    const earthLayers: LayerOption[] = [
        { key: 'flights', label: 'Flights', icon: <Plane size={12} />, color: '#00ff88' },
        { key: 'traffic', label: 'Traffic', icon: <Car size={12} />, color: '#ffee00' },
        { key: 'cctv', label: 'CCTV', icon: <Video size={12} />, color: '#ff2244', description: 'visual context only' },
        { key: 'earthquakes', label: 'Seismic', icon: <Activity size={12} />, color: '#ff44aa' },
        { key: 'ddos', label: 'DDoS', icon: <AlertTriangle size={12} />, color: '#ff335f' },
    ];

    const marsLayers: LayerOption[] = [
        { key: 'marsRovers', label: 'Rover Photos', icon: <Camera size={12} />, color: '#ff8a4d' },
        { key: 'marsWeather', label: 'Mars Weather', icon: <Thermometer size={12} />, color: '#53d8fb' },
        { key: 'marsMedia', label: 'NASA Media', icon: <ImageIcon size={12} />, color: '#ffc857' },
        { key: 'marsScience', label: 'PDS Science', icon: <FlaskConical size={12} />, color: '#90be6d' },
        { key: 'marsOrbiters', label: 'JPL Horizons', icon: <Orbit size={12} />, color: '#b388eb' },
        { key: 'marsSolarWeather', label: 'DONKI Solar', icon: <SunMedium size={12} />, color: '#f94144' },
    ];

    const moonLayers: LayerOption[] = [
        { key: 'moonMedia', label: 'NASA Moon Media', icon: <Moon size={12} />, color: '#9ad4ff' },
        { key: 'moonLro', label: 'LRO Terrain', icon: <Mountain size={12} />, color: '#7fb7ff' },
        { key: 'moonScience', label: 'Lunar PDS Science', icon: <Database size={12} />, color: '#b8e1ff' },
        { key: 'moonOrbiters', label: 'JPL Horizons', icon: <Orbit size={12} />, color: '#c9b6ff' },
        { key: 'moonSpice', label: 'NAIF SPICE', icon: <Radar size={12} />, color: '#8bd3dd' },
        { key: 'moonArtemis', label: 'Artemis Mission', icon: <Rocket size={12} />, color: '#ffd6a5' },
        { key: 'moonSolarWeather', label: 'DONKI Weather', icon: <SunMedium size={12} />, color: '#f9c74f' },
    ];

    const layers = worldMode === 'mars' ? marsLayers : worldMode === 'moon' ? moonLayers : earthLayers;

    return (
        <div className="left-sidebar">
            <div className="sidebar-section">
                <span className="sidebar-section-label">Data Feed</span>
                <button className="expand-btn" onClick={() => toggleSection('feed')}>
                    {expandedSection === 'feed' ? <Minus size={12} /> : <Plus size={12} />}
                </button>
            </div>
            {expandedSection === 'feed' && (
                <div className="glass-panel" style={{ marginLeft: 0, minWidth: 180 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 8 }}>LIVE CONNECTIONS</div>
                    {DATA_FEEDS_BY_WORLD[worldMode].map((feed) => (
                        <div key={feed} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 9, color: 'var(--text-secondary)' }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.5)' }} />
                            {feed}
                        </div>
                    ))}
                </div>
            )}

            <div className="sidebar-section">
                <span className="sidebar-section-label">Data Layers</span>
                <button className="expand-btn" onClick={() => toggleSection('layers')}>
                    {expandedSection === 'layers' ? <Minus size={12} /> : <Plus size={12} />}
                </button>
            </div>
            {expandedSection === 'layers' && (
                <div className="glass-panel data-layers-panel">
                    {layers.map(({ key, label, icon, color, description }) => (
                        <div
                            key={key}
                            className={`layer-toggle ${dataLayers[key] ? 'active' : ''}`}
                            onClick={() => onToggleLayer(key)}
                        >
                            <div>
                                <div className="layer-toggle-name">
                                    <div
                                        className={`layer-toggle-dot ${dataLayers[key] ? 'active' : ''}`}
                                        style={dataLayers[key] ? { background: color, boxShadow: `0 0 8px ${color}60` } : {}}
                                    />
                                    {icon}
                                    {label}
                                </div>
                                {description && <div className="layer-toggle-description">{description}</div>}
                            </div>
                            <span className="layer-toggle-count">
                                {layerCounts[key] || 0}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="sidebar-section">
                <span className="sidebar-section-label">Scenes</span>
                <button className="expand-btn" onClick={() => toggleSection('scenes')}>
                    {expandedSection === 'scenes' ? <Minus size={12} /> : <Plus size={12} />}
                </button>
            </div>
            {expandedSection === 'scenes' && (
                <div className="glass-panel" style={{ minWidth: 180 }}>
                    <LocationPanel
                        scenes={scenes}
                        selectedCity={selectedCity}
                        selectedLandmark={selectedLandmark}
                        onCityChange={onCityChange}
                        onLandmarkChange={onLandmarkChange}
                        compact
                    />
                </div>
            )}

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
                        worldMode={worldMode}
                        compact
                    />
                </div>
            )}
        </div>
    );
}