import { STYLE_PRESETS } from '../utils/constants';
import type { StylePresetId, WorldMode } from '../utils/constants';

interface StylePresetsProps {
    activeStyle: StylePresetId;
    onStyleChange: (style: StylePresetId) => void;
    worldMode: WorldMode;
    onWorldModeChange: (mode: WorldMode) => void;
}

export default function StylePresets({ activeStyle, onStyleChange, worldMode, onWorldModeChange }: StylePresetsProps) {
    return (
        <>
            <div className="world-mode-bar-wrap">
                <div className="glass-panel world-mode-bar">
                    {(['earth', 'moon', 'mars'] as WorldMode[]).map((mode) => (
                        <button
                            key={mode}
                            className={`world-mode-btn ${worldMode === mode ? 'active' : ''}`}
                            onClick={() => onWorldModeChange(mode)}
                        >
                            {mode.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="style-presets-bar">
                <div className="glass-panel style-presets-inner">
                    {STYLE_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            className={`style-preset-btn ${activeStyle === preset.id ? 'active' : ''}`}
                            onClick={() => onStyleChange(preset.id)}
                            title={`${preset.name} (${preset.key})`}
                        >
                            <span className="style-preset-icon">{preset.icon}</span>
                            <span className="style-preset-label">{preset.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="presets-bar-label">
                <div className="presets-label-text">
                    <span className="presets-label-line" />
                    STYLE PRESETS — Visual Modes
                    <span className="presets-label-line" />
                </div>
            </div>

        </>
    );
}
