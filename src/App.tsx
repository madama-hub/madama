import { useState, useCallback, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import GlobeViewer from './components/GlobeViewer';
import HudOverlay from './components/HudOverlay';
import StylePresets from './components/StylePresets';
import LeftSidebar from './components/LeftSidebar';
import type { DataLayerState } from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import SatelliteLayer from './layers/SatelliteLayer';
import FlightLayer from './layers/FlightLayer';
import MilitaryFlightLayer from './layers/MilitaryFlightLayer';
import TrafficLayer from './layers/TrafficLayer';
import CCTVLayer from './layers/CCTVLayer';
import type { CameraPoint } from './layers/CCTVLayer';
import EarthquakeLayer from './layers/EarthquakeLayer';
import { CITIES, STYLE_PRESETS } from './utils/constants';
import type { StylePresetId, Landmark } from './utils/constants';

export default function App() {
  // Style presets
  const [activeStyle, setActiveStyle] = useState<StylePresetId>('normal');

  // Camera state
  const [cameraLat, setCameraLat] = useState(30.2747);
  const [cameraLng, setCameraLng] = useState(-97.7403);
  const [cameraAlt, setCameraAlt] = useState(2000);
  const [crosshairLat, setCrosshairLat] = useState(30.2747);
  const [crosshairLng, setCrosshairLng] = useState(-97.7403);

  // Location selection
  const [selectedCity, setSelectedCity] = useState(0); // Austin
  const [selectedLandmark, setSelectedLandmark] = useState(-1);
  const [flyToTarget, setFlyToTarget] = useState<Landmark | null>(null);

  // Data layers
  const [dataLayers, setDataLayers] = useState<DataLayerState>({
    satellites: false,
    flights: false,
    military: false,
    traffic: false,
    cctv: false,
    earthquakes: false,
  });

  const [layerCounts, setLayerCounts] = useState<Record<string, number>>({});
  const [selectedCctv, setSelectedCctv] = useState<{
    id: string;
    name: string;
    streamUrl?: string;
    embedUrl?: string;
    pageUrl?: string;
    thumbnail?: string;
  } | null>(null);
  const [earthCamCameras, setEarthCamCameras] = useState<CameraPoint[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [earthCamStatus, setEarthCamStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const fetchEarthCamCameras = useCallback(async (): Promise<CameraPoint[]> => {
    const resp = await fetch('/webcamera24-mvp.json');
    if (!resp.ok) throw new Error('Failed to load webcamera24 MVP dataset');

    const json = await resp.json();
    const mapped = (Array.isArray(json) ? json : [])
      .map((item: any): CameraPoint | null => {
        const lat = Number.parseFloat(String(item?.lat));
        const lng = Number.parseFloat(String(item?.lng));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const cleanName = String(item?.name ?? 'Web Camera')
          .replaceAll('&#x27;', "'")
          .replaceAll('&amp;', '&');

        return {
          id: String(item?.id ?? `${cleanName}-${lat}-${lng}`),
          name: cleanName,
          lat,
          lng,
          embedUrl: typeof item?.embedUrl === 'string' ? item.embedUrl : undefined,
          pageUrl: typeof item?.pageUrl === 'string' ? item.pageUrl : undefined,
          thumbnail: typeof item?.thumbnail === 'string' ? item.thumbnail : undefined,
        };
      })
      .filter((x: CameraPoint | null): x is CameraPoint => !!x);

    return mapped;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadEarthCam = async () => {
      try {
        setEarthCamStatus('loading');
        const cameras = await fetchEarthCamCameras();

        if (!cancelled) {
          setEarthCamCameras(cameras);
          setEarthCamStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setEarthCamStatus('error');
          setEarthCamCameras([]);
        }
      }
    };

    loadEarthCam();

    return () => {
      cancelled = true;
    };
  }, [fetchEarthCamCameras]);

  // Effects
  const [bloom, setBloom] = useState(false);
  const [sharpen, setSharpen] = useState(true);
  const [hudVisible, setHudVisible] = useState(true);
  const [cleanUI, setCleanUI] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const streamUrl = selectedCctv?.streamUrl;

    setVideoError(null);

    if (!video || !streamUrl) {
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      return;
    }

    let hls: Hls | null = null;

    if (streamUrl.includes('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if (Hls.isSupported()) {
        hls = new Hls({
          lowLatencyMode: true,
          enableWorker: true,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data?.fatal) {
            const statusCode = (data as any)?.response?.code;
            if (statusCode === 403) {
              setVideoError('Provider blocked direct playback (403). Open camera page instead.');
            } else {
              setVideoError('Unable to play this live stream in-browser.');
            }
          }
        });
      } else {
        setVideoError('This browser does not support HLS playback for this stream.');
      }
    } else {
      video.src = streamUrl;
    }

    video
      .play()
      .catch(() => {
        // Autoplay can be blocked; controls remain available for manual play
      });

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [selectedCctv?.id, selectedCctv?.streamUrl, selectedCctv?.embedUrl]);

  // Camera move handler
  const handleCameraMove = useCallback((lat: number, lng: number, alt: number, centerLat?: number, centerLng?: number) => {
    setCameraLat(lat);
    setCameraLng(lng);
    setCameraAlt(alt);
    if (typeof centerLat === 'number' && typeof centerLng === 'number') {
      setCrosshairLat(centerLat);
      setCrosshairLng(centerLng);
    } else {
      setCrosshairLat(lat);
      setCrosshairLng(lng);
    }
  }, []);

  // Layer toggle
  const handleToggleLayer = useCallback((layer: keyof DataLayerState) => {
    setDataLayers(prev => {
      const next = { ...prev, [layer]: !prev[layer] };
      if (layer === 'cctv' && prev.cctv) {
        setSelectedCctv(null);
      }
      return next;
    });
  }, []);

  // Layer count update
  const handleCountUpdate = useCallback((layer: string, count: number) => {
    setLayerCounts(prev => ({ ...prev, [layer]: count }));
  }, []);

  // Location changes
  const handleCityChange = useCallback((index: number) => {
    setSelectedCity(index);
    setSelectedLandmark(-1);
    if (index >= 0 && CITIES[index]) {
      const city = CITIES[index];
      setFlyToTarget(city.landmarks[0]);
    }
  }, []);

  const handleLandmarkChange = useCallback((index: number) => {
    setSelectedLandmark(index);
    if (index >= 0 && selectedCity >= 0) {
      const landmark = CITIES[selectedCity]?.landmarks[index];
      if (landmark) setFlyToTarget(landmark);
    }
  }, [selectedCity]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      // Number keys 1-8 for style presets
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        setActiveStyle(STYLE_PRESETS[num - 1].id);
        return;
      }

      // Q, W, E, R, T for landmarks in current city
      const landmarkKeys = ['q', 'w', 'e', 'r', 't'];
      const lIndex = landmarkKeys.indexOf(e.key.toLowerCase());
      if (lIndex >= 0 && selectedCity >= 0) {
        const landmark = CITIES[selectedCity]?.landmarks[lIndex];
        if (landmark) {
          setSelectedLandmark(lIndex);
          setFlyToTarget(landmark);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCity]);

  // Get style class for the globe
  const styleClass = activeStyle !== 'normal' ? `effect-${activeStyle}` : '';
  const locationName = selectedCity >= 0 ? CITIES[selectedCity]?.name || '' : '';
  const landmarkName = selectedLandmark >= 0 ? CITIES[selectedCity]?.landmarks[selectedLandmark]?.name || '' : '';

  return (
    <div className={`app-container theme-${themeMode} ${cleanUI ? 'clean-ui' : ''} ${bloom ? 'bloom-active' : ''} ${sharpen ? 'sharpen-active' : ''}`}>
      {/* Loading screen */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">WORLDVIEW INITIALIZING...</div>
          <div style={{ marginTop: 10, fontSize: 9, color: 'var(--text-dim)', letterSpacing: 2 }}>
            ESTABLISHING SECURE CONNECTIONS
          </div>
        </div>
      )}

      {/* Globe with style filter */}
      <div className={styleClass} style={{ position: 'absolute', inset: 0 }}>
        <GlobeViewer
          onCameraMove={handleCameraMove}
          flyToTarget={flyToTarget}
        >
          <SatelliteLayer
            visible={dataLayers.satellites}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('satellites', c)}
          />
          <FlightLayer
            visible={dataLayers.flights}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('flights', c)}
          />
          <MilitaryFlightLayer
            visible={dataLayers.military}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('military', c)}
          />
          <TrafficLayer
            visible={dataLayers.traffic}
            centerLat={cameraLat}
            centerLng={cameraLng}
            onCountUpdate={(c) => handleCountUpdate('traffic', c)}
          />
          <CCTVLayer
            visible={dataLayers.cctv}
            showLabels={false}
            cameras={earthCamCameras}
            onCountUpdate={(c) => handleCountUpdate('cctv', c)}
            onCameraSelect={(cam) => {
              setSelectedCctv(cam);
            }}
          />
          <EarthquakeLayer
            visible={dataLayers.earthquakes}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('earthquakes', c)}
          />
        </GlobeViewer>

        {/* CRT scan lines overlay */}
        {activeStyle === 'crt' && <div className="scan-lines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }} />}
      </div>

      {/* Vignette */}
      <div className="vignette-overlay" />
      <div className="vignette-circle" />

      {/* Grain overlay for certain styles */}
      {(activeStyle === 'noir' || activeStyle === 'nvg' || activeStyle === 'crt') && (
        <div className="grain-overlay" />
      )}

      {/* HUD */}
      {hudVisible && (
        <HudOverlay
          activeStyle={activeStyle}
          cameraLat={crosshairLat}
          cameraLng={crosshairLng}
          cameraAlt={cameraAlt}
        />
      )}

      {/* Left Sidebar */}
      <LeftSidebar
        dataLayers={dataLayers}
        onToggleLayer={handleToggleLayer}
        layerCounts={layerCounts}
        selectedCity={selectedCity}
        selectedLandmark={selectedLandmark}
        onCityChange={handleCityChange}
        onLandmarkChange={handleLandmarkChange}
        detectMode={false}
        locationName={locationName}
        landmarkName={landmarkName}
        cleanUI={cleanUI}
      />

      {/* Right Sidebar */}
      <RightSidebar
        bloom={bloom}
        sharpen={sharpen}
        themeMode={themeMode}
        hudVisible={hudVisible}
        cleanUI={cleanUI}
        onToggleBloom={() => setBloom(!bloom)}
        onToggleSharpen={() => setSharpen(!sharpen)}
        onToggleHud={() => setHudVisible(!hudVisible)}
        onToggleCleanUI={() => setCleanUI(!cleanUI)}
        onToggleTheme={() => setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {/* Style Presets */}
      <StylePresets
        activeStyle={activeStyle}
        onStyleChange={setActiveStyle}
      />

      {/* CCTV Preview */}
      {dataLayers.cctv && selectedCctv && (
        <div className="glass-panel cctv-preview-panel" style={{
          position: 'absolute',
          zIndex: 60,
          padding: 10,
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--accent-red)', textTransform: 'uppercase' }}>
              CCTV: {selectedCctv.name}
            </div>
            <button className="glass-btn" style={{ padding: '4px 8px', fontSize: 9 }} onClick={() => setSelectedCctv(null)}>
              Close
            </button>
          </div>
          {selectedCctv.embedUrl ? (
            <iframe
              src={selectedCctv.embedUrl}
              title={selectedCctv.name}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: 180, borderRadius: 3, border: '1px solid var(--border-color)', background: '#000' }}
            />
          ) : selectedCctv.streamUrl ? (
            <video
              ref={videoRef}
              controls
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--border-color)', background: '#000' }}
            />
          ) : (
            <img
              src={selectedCctv.thumbnail || ''}
              alt={selectedCctv.name}
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--border-color)' }}
            />
          )}
          <div style={{ marginTop: 6, fontSize: 9, color: 'var(--text-dim)' }}>
            {earthCamStatus === 'loading' && 'Loading webcamera24 feed index...'}
            {earthCamStatus === 'error' && 'webcamera24 feed index unavailable right now.'}
            {videoError && videoError}
            {selectedCctv.pageUrl && (
              <>
                {' '}
                <a href={selectedCctv.pageUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                  Open camera page
                </a>
              </>
            )}
            {!selectedCctv.streamUrl && selectedCctv.pageUrl && (
              <>Live stream unavailable for this item.</>
            )}
            {(selectedCctv.streamUrl || selectedCctv.embedUrl) && 'Click another CCTV point to switch feed.'}
          </div>
        </div>
      )}
    </div>
  );
}
