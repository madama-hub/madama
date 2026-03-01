import { Sparkles, Focus, Monitor, Eye, EyeOff, SunMoon } from 'lucide-react';

interface RightSidebarProps {
    bloom: boolean;
    sharpen: boolean;
    themeMode: 'dark' | 'light';
    hudVisible: boolean;
    cleanUI: boolean;
    onToggleBloom: () => void;
    onToggleSharpen: () => void;
    onToggleHud: () => void;
    onToggleCleanUI: () => void;
    onToggleTheme: () => void;
}

export default function RightSidebar({
    bloom, sharpen, themeMode, hudVisible, cleanUI,
    onToggleBloom, onToggleSharpen, onToggleHud,
    onToggleCleanUI, onToggleTheme,
}: RightSidebarProps) {
    return (
        <div className="right-sidebar">
            <div className="glass-panel" style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>MODE</div>

                {/* Bloom */}
                <button className={`glass-btn ${bloom ? 'active' : ''}`} onClick={onToggleBloom}>
                    <Sparkles size={12} /> Bloom
                </button>

                {/* Sharpen */}
                <button
                    className={`glass-btn ${sharpen ? 'active' : ''}`}
                    onClick={onToggleSharpen}
                    style={{ marginTop: 4 }}
                >
                    <Focus size={12} /> Sharpen
                </button>

                {/* HUD */}
                <button
                    className={`glass-btn ${hudVisible ? 'active' : ''}`}
                    onClick={onToggleHud}
                    style={{ marginTop: 4 }}
                >
                    <Monitor size={12} /> HUD
                </button>
            </div>

            {/* Clean UI */}
            <button className={`glass-btn clean-ui-toggle ${cleanUI ? 'active' : ''}`} onClick={onToggleCleanUI}>
                {cleanUI ? <EyeOff size={12} /> : <Eye size={12} />} Clean UI
            </button>

            {/* Theme mode */}
            <button className="glass-btn" onClick={onToggleTheme}>
                <SunMoon size={12} /> Theme: {themeMode === 'dark' ? 'Dark' : 'Light'}
            </button>
        </div>
    );
}
