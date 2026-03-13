import { Sparkles, Monitor, Eye, EyeOff, SunMoon } from 'lucide-react';

interface RightSidebarProps {
    bloom: boolean;
    themeMode: 'dark' | 'light';
    hudVisible: boolean;
    cleanUI: boolean;
    onToggleBloom: () => void;
    onToggleHud: () => void;
    onToggleCleanUI: () => void;
    onToggleTheme: () => void;
}

export default function RightSidebar({
    bloom, themeMode, hudVisible, cleanUI,
    onToggleBloom, onToggleHud,
    onToggleCleanUI, onToggleTheme,
}: RightSidebarProps) {
    const darkModeActive = themeMode === 'dark';

    return (
        <div className="right-sidebar">
            <div className="glass-panel" style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>MODE</div>

                {/* Bloom */}
                <button className={`world-mode-btn mode-box-btn ${bloom ? 'active' : ''}`} onClick={onToggleBloom}>
                    <Sparkles size={12} /> Bloom
                </button>

                {/* HUD */}
                <button
                    className={`world-mode-btn mode-box-btn ${!hudVisible ? 'active' : ''}`}
                    onClick={onToggleHud}
                    style={{ marginTop: 4 }}
                >
                    <Monitor size={12} /> HUD
                </button>

                {/* Clean UI */}
                <button
                    className={`world-mode-btn mode-box-btn clean-ui-toggle ${cleanUI ? 'active' : ''}`}
                    onClick={onToggleCleanUI}
                    style={{ marginTop: 4 }}
                >
                    {cleanUI ? <EyeOff size={12} /> : <Eye size={12} />} Clean UI
                </button>

                {/* Theme mode */}
                <button
                    className={`world-mode-btn mode-box-btn ${darkModeActive ? 'active' : ''}`}
                    onClick={onToggleTheme}
                    style={{ marginTop: 4 }}
                >
                    <SunMoon size={12} /> Theme Dark
                </button>
            </div>
        </div>
    );
}
