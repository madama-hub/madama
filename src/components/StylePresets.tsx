import { STYLE_PRESETS } from '../utils/constants';
import type { StylePresetId } from '../utils/constants';

interface StylePresetsProps {
    activeStyle: StylePresetId;
    onStyleChange: (style: StylePresetId) => void;
}

export default function StylePresets({ activeStyle, onStyleChange }: StylePresetsProps) {
    return (
        <>
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

            {/* Style-specific overlay */}
            <div className="style-presets-info glass-panel" style={{
                position: 'absolute',
                bottom: 'calc(90px + env(safe-area-inset-bottom))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 25,
                padding: '4px 12px',
                pointerEvents: 'none',
                maxWidth: '92vw',
                textAlign: 'center',
            }}>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: 2,
                    color: 'var(--text-dim)',
                }}>
                    STYLE: <span style={{ color: 'var(--accent-cyan)' }}>{activeStyle.toUpperCase()}</span>
                </span>
            </div>
        </>
    );
}
