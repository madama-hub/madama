import { useEffect, useMemo, useState } from 'react';

declare const __DEEPSEEK_PROXY_ENABLED__: boolean;

interface AIInsightsPanelProps {
    dataLayers: {
        satellites: boolean;
        flights: boolean;
        military: boolean;
        traffic: boolean;
        cctv: boolean;
        earthquakes: boolean;
    };
    layerCounts: Record<string, number>;
    detectMode: boolean;
    locationName: string;
    landmarkName: string;
    cleanUI: boolean;
    compact?: boolean;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export default function AIInsightsPanel({
    dataLayers,
    layerCounts,
    detectMode,
    locationName: _locationName,
    landmarkName: _landmarkName,
    cleanUI,
    compact = false,
}: AIInsightsPanelProps) {
    const [aiSummary, setAiSummary] = useState<string>('');
    const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [aiError, setAiError] = useState<string>('');

    const flights = layerCounts.flights || 0;
    const military = layerCounts.military || 0;
    const quakes = layerCounts.earthquakes || 0;
    const satellites = layerCounts.satellites || 0;
    const traffic = layerCounts.traffic || 0;
    const cctv = layerCounts.cctv || 0;

    const scoreRaw =
        (dataLayers.flights ? Math.min(40, flights / 40) : 0) +
        (dataLayers.military ? Math.min(25, military / 2) : 0) +
        (dataLayers.earthquakes ? Math.min(20, quakes * 1.2) : 0) +
        (detectMode ? 10 : 0) +
        (dataLayers.cctv ? 5 : 0);
    const riskScore = Math.round(clamp(scoreRaw, 0, 100));

    const localInsights = useMemo(() => {
        const insights: string[] = [];
        if (dataLayers.flights) insights.push(`Air traffic monitored: ${flights.toLocaleString()} tracks in view.`);
        if (dataLayers.military) insights.push(`Military activity flagged: ${military} aircraft patterns tagged.`);
        if (dataLayers.earthquakes) insights.push(`Seismic feed active: ${quakes} recent events under review.`);
        if (dataLayers.satellites) insights.push(`Orbital context online: ${satellites} satellites contributing coverage.`);
        if (dataLayers.traffic) insights.push(`Ground mobility model running with ${traffic} traffic particles.`);
        if (dataLayers.cctv) insights.push(`Visual verification available from ${cctv} camera points.`);
        if (detectMode) insights.push('Detection mode enabled: labels and projected paths enrich context.');
        if (!insights.length) {
            insights.push('No active intelligence feeds. Enable one or more layers to generate AI summaries.');
        }
        return insights;
    }, [dataLayers, flights, military, quakes, satellites, traffic, cctv, detectMode]);

    const focusText = 'Worldwide';

    const proxyEnabled = typeof __DEEPSEEK_PROXY_ENABLED__ !== 'undefined' && __DEEPSEEK_PROXY_ENABLED__;

    const promptPayload = useMemo(
        () => ({
            focusText,
            detectMode,
            riskScore,
            counts: { flights, military, quakes, satellites, traffic, cctv },
            activeLayers: dataLayers,
            localInsights,
        }),
        [focusText, detectMode, riskScore, flights, military, quakes, satellites, traffic, cctv, dataLayers, localInsights],
    );

    useEffect(() => {
        if (!proxyEnabled || cleanUI) {
            setAiStatus('idle');
            setAiSummary('');
            setAiError('');
            return;
        }

        let cancelled = false;

        const timer = window.setTimeout(async () => {
            try {
                setAiStatus('loading');
                setAiError('');

                const response = await fetch('/api/deepseek-summary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        payload: promptPayload,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(`DeepSeek request failed: ${response.status}`);
                }

                const text = typeof data?.summary === 'string' ? data.summary.trim() : '';
                if (!cancelled && text) {
                    setAiSummary(text);
                    setAiStatus('ready');
                }
            } catch (error: unknown) {
                if (!cancelled) {
                    setAiStatus('error');
                    setAiError(error instanceof Error ? error.message : 'DeepSeek request failed');
                }
            }
        }, 500);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [proxyEnabled, promptPayload, cleanUI]);

    return (
        <div className={`ai-insights-panel glass-panel ${cleanUI ? 'hidden' : ''} ${compact ? 'compact' : ''}`}>
            <div className="ai-insights-header">
                <span>AI Insights</span>
                <span className="ai-risk-score">Risk {riskScore}</span>
            </div>
            <div className="ai-focus">Focus: {focusText}</div>
            {proxyEnabled && (
                <div className="ai-llm-line">
                    {aiStatus === 'loading' && 'DeepSeek: generating summary...'}
                    {aiStatus === 'ready' && `DeepSeek: ${aiSummary}`}
                    {aiStatus === 'error' && `DeepSeek unavailable right now (${aiError || 'request failed'}); showing local heuristic insights.`}
                </div>
            )}
            <ul className="ai-insights-list">
                {localInsights.slice(0, 4).map((insight) => (
                    <li key={insight}>{insight}</li>
                ))}
            </ul>
        </div>
    );
}
