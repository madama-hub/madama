import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../utils/constants';
import type { WorldMode } from '../utils/constants';

interface AIInsightsPanelProps {
    dataLayers: {
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
    };
    layerCounts: Record<string, number>;
    detectMode: boolean;
    locationName: string;
    landmarkName: string;
    cleanUI: boolean;
    worldMode: WorldMode;
    compact?: boolean;
}

interface AlertRegionSummary {
    region_id: string;
    score: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
}

interface AlertSummaryResponse {
    generated_at: string;
    risk_score: number;
    headline: string;
    overview: string;
    active_alerts: number;
    top_regions: AlertRegionSummary[];
    monitored_sources: string[];
}

interface ModelMetricsResponse {
    model_name: string;
    evaluation_window: string;
    training_samples: number;
    validation_samples: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export default function AIInsightsPanel({
    dataLayers,
    layerCounts,
    detectMode,
    locationName,
    landmarkName,
    cleanUI,
    worldMode,
    compact = false,
}: AIInsightsPanelProps) {
    const [summary, setSummary] = useState<AlertSummaryResponse | null>(null);
    const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [error, setError] = useState('');

    const flights = layerCounts.flights || 0;
    const quakes = layerCounts.earthquakes || 0;
    const traffic = layerCounts.traffic || 0;
    const ddos = layerCounts.ddos || 0;

    const fallbackScore = Math.round(clamp(
        (dataLayers.flights ? Math.min(32, flights / 32) : 0) +
        (dataLayers.earthquakes ? Math.min(24, quakes * 1.8) : 0) +
        (dataLayers.ddos ? Math.min(28, ddos * 2.2) : 0) +
        (dataLayers.traffic ? Math.min(16, traffic / 8) : 0) +
        (detectMode ? 8 : 0),
        0,
        100,
    ));

    const fallbackInsights = useMemo(() => {
        const insights: string[] = [];
        if (dataLayers.flights) insights.push(`Flights active: ${flights.toLocaleString()} aircraft in the latest snapshot.`);
        if (dataLayers.earthquakes) insights.push(`Seismic feed active: ${quakes} recent earthquakes under review.`);
        if (dataLayers.ddos) insights.push(`Cyber signal feed active: ${ddos} suspicious DDoS / abuse markers tracked.`);
        if (dataLayers.traffic) insights.push(`Traffic simulation active: ${traffic} mobility particles generated near the current view.`);
        if (dataLayers.cctv) insights.push('CCTV stays available for visual context, but does not influence model scoring.');
        if (!insights.length) {
            insights.push('Enable flights, earthquakes, traffic, or DDoS layers to drive the anomaly engine.');
        }
        return insights;
    }, [dataLayers, flights, quakes, ddos, traffic]);

    const focusText = landmarkName || locationName || 'Worldwide';

    useEffect(() => {
        if (cleanUI || worldMode !== 'earth') {
            setStatus('idle');
            setSummary(null);
            setMetrics(null);
            setError('');
            return;
        }

        let cancelled = false;

        const loadInsights = async () => {
            try {
                setStatus('loading');
                setError('');

                const [summaryResponse, metricsResponse] = await Promise.all([
                    fetch(API_ENDPOINTS.ALERTS_SUMMARY),
                    fetch(API_ENDPOINTS.MODEL_METRICS),
                ]);

                if (!summaryResponse.ok) {
                    throw new Error(`Alert summary request failed (${summaryResponse.status})`);
                }

                if (!metricsResponse.ok) {
                    throw new Error(`Model metrics request failed (${metricsResponse.status})`);
                }

                const [summaryPayload, metricsPayload] = await Promise.all([
                    summaryResponse.json() as Promise<AlertSummaryResponse>,
                    metricsResponse.json() as Promise<ModelMetricsResponse>,
                ]);

                if (!cancelled) {
                    setSummary(summaryPayload);
                    setMetrics(metricsPayload);
                    setStatus('ready');
                }
            } catch (fetchError: unknown) {
                if (!cancelled) {
                    setStatus('error');
                    setSummary(null);
                    setMetrics(null);
                    setError(fetchError instanceof Error ? fetchError.message : 'Unable to load backend intelligence');
                }
            }
        };

        loadInsights();
        const interval = window.setInterval(loadInsights, 45_000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [cleanUI, worldMode]);

    if (worldMode !== 'earth') {
        return (
            <div className={`ai-insights-panel glass-panel ${cleanUI ? 'hidden' : ''} ${compact ? 'compact' : ''}`}>
                <div className="ai-insights-header">
                    <span>AI Insights</span>
                    <span className="ai-risk-score">Earth Only</span>
                </div>
                <div className="ai-focus">Focus: Exploration Mode</div>
                <div className="ai-llm-line">
                    The anomaly engine currently focuses on Earth operations: flights, earthquakes, DDoS signals, and traffic.
                </div>
                <ul className="ai-insights-list">
                    <li>Moon and Mars remain available as exploration layers for the portfolio demo.</li>
                    <li>Switch back to Earth to inspect live anomaly alerts and model evaluation metrics.</li>
                </ul>
            </div>
        );
    }

    return (
        <div className={`ai-insights-panel glass-panel ${cleanUI ? 'hidden' : ''} ${compact ? 'compact' : ''}`}>
            <div className="ai-insights-header">
                <span>AI Insights</span>
                <span className="ai-risk-score">Risk {summary?.risk_score ?? fallbackScore}</span>
            </div>
            <div className="ai-focus">Focus: {focusText}</div>
            <div className="ai-llm-line">
                {status === 'loading' && 'Backend model: refreshing anomaly summary and evaluation metrics...'}
                {status === 'ready' && summary?.headline}
                {status === 'error' && `Backend unavailable (${error || 'request failed'}). Showing local heuristic fallback.`}
                {status === 'idle' && 'Backend model idle.'}
            </div>

            {summary && status === 'ready' ? (
                <>
                    <ul className="ai-insights-list">
                        <li>{summary.overview}</li>
                        <li>{summary.active_alerts} active alert regions in the latest snapshot.</li>
                        {summary.top_regions.slice(0, 2).map((region) => (
                            <li key={region.region_id}>
                                {region.severity.toUpperCase()} · {region.region_id} · {region.summary}
                            </li>
                        ))}
                        {dataLayers.cctv && <li>CCTV is enabled for operator context only and is excluded from anomaly scoring.</li>}
                    </ul>

                    {metrics && (
                        <div className="ai-metrics-grid">
                            <div className="ai-metric-card">
                                <span className="ai-metric-label">Precision</span>
                                <strong>{metrics.precision.toFixed(2)}</strong>
                            </div>
                            <div className="ai-metric-card">
                                <span className="ai-metric-label">Recall</span>
                                <strong>{metrics.recall.toFixed(2)}</strong>
                            </div>
                            <div className="ai-metric-card">
                                <span className="ai-metric-label">F1</span>
                                <strong>{metrics.f1_score.toFixed(2)}</strong>
                            </div>
                            <div className="ai-metric-card">
                                <span className="ai-metric-label">ROC-AUC</span>
                                <strong>{metrics.roc_auc.toFixed(2)}</strong>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <ul className="ai-insights-list">
                    {fallbackInsights.slice(0, 4).map((insight) => (
                        <li key={insight}>{insight}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}