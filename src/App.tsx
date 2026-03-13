import { useState, useCallback, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import GlobeViewer from './components/GlobeViewer';
import HudOverlay from './components/HudOverlay';
import StylePresets from './components/StylePresets';
import LeftSidebar from './components/LeftSidebar';
import type { DataLayerState } from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import FlightLayer from './layers/FlightLayer';
import TrafficLayer from './layers/TrafficLayer';
import CCTVLayer from './layers/CCTVLayer';
import type { CameraPoint } from './layers/CCTVLayer';
import EarthquakeLayer from './layers/EarthquakeLayer';
import DdosLayer from './layers/DdosLayer';
import AlertLayer from './layers/AlertLayer';
import MarsRoverLayer from './layers/MarsRoverLayer';
import type { MarsRoverPoint } from './layers/MarsRoverLayer';
import MoonMediaLayer from './layers/MoonMediaLayer';
import MoonLroLayer from './layers/MoonLroLayer';
import MoonScienceLayer from './layers/MoonScienceLayer';
import MoonOrbitersLayer from './layers/MoonOrbitersLayer';
import MoonSpiceLayer from './layers/MoonSpiceLayer';
import MoonArtemisLayer from './layers/MoonArtemisLayer';
import MoonSolarWeatherLayer from './layers/MoonSolarWeatherLayer';
import MarsWeatherLayer from './layers/MarsWeatherLayer';
import MarsMediaLayer from './layers/MarsMediaLayer';
import MarsScienceLayer from './layers/MarsScienceLayer';
import MarsOrbitersLayer from './layers/MarsOrbitersLayer';
import MarsSolarWeatherLayer from './layers/MarsSolarWeatherLayer';
import { SCENES_BY_WORLD, STYLE_PRESETS } from './utils/constants';
import type { StylePresetId, Landmark, WorldMode } from './utils/constants';

export default function App() {
  // Style presets
  const [activeStyle, setActiveStyle] = useState<StylePresetId>('normal');
  const [worldMode, setWorldMode] = useState<WorldMode>('earth');

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
    flights: false,
    traffic: false,
    cctv: false,
    earthquakes: false,
    ddos: false,
    moonMedia: false,
    moonLro: false,
    moonScience: false,
    moonOrbiters: false,
    moonSpice: false,
    moonArtemis: false,
    moonSolarWeather: false,
    marsRovers: false,
    marsWeather: false,
    marsMedia: false,
    marsScience: false,
    marsOrbiters: false,
    marsSolarWeather: false,
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
  const [selectedMarsPhoto, setSelectedMarsPhoto] = useState<MarsRoverPoint | null>(null);
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
      if (layer === 'marsRovers' && prev.marsRovers) {
        setSelectedMarsPhoto(null);
      }
      return next;
    });
  }, []);

  // Layer count update
  const handleCountUpdate = useCallback((layer: string, count: number) => {
    setLayerCounts(prev => ({ ...prev, [layer]: count }));
  }, []);

  // Location changes
  const activeScenes = SCENES_BY_WORLD[worldMode];

  const handleCityChange = useCallback((index: number) => {
    setSelectedCity(index);
    setSelectedLandmark(-1);
    if (index >= 0 && activeScenes[index]) {
      const city = activeScenes[index];
      setFlyToTarget(city.landmarks[0]);
    }
  }, [activeScenes]);

  const handleLandmarkChange = useCallback((index: number) => {
    setSelectedLandmark(index);
    if (index >= 0 && selectedCity >= 0) {
      const landmark = activeScenes[selectedCity]?.landmarks[index];
      if (landmark) setFlyToTarget(landmark);
    }
  }, [selectedCity, activeScenes]);

  useEffect(() => {
    setSelectedCity(0);
    setSelectedLandmark(-1);
    setFlyToTarget(null);
    if (worldMode !== 'mars') {
      setSelectedMarsPhoto(null);
    }
  }, [worldMode]);

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
        const landmark = activeScenes[selectedCity]?.landmarks[lIndex];
        if (landmark) {
          setSelectedLandmark(lIndex);
          setFlyToTarget(landmark);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCity, activeScenes]);

  // Get style class for the globe
  const styleClass = activeStyle !== 'normal' ? `effect-${activeStyle}` : '';
  const locationName = selectedCity >= 0 ? activeScenes[selectedCity]?.name || '' : '';
  const landmarkName = selectedLandmark >= 0 ? activeScenes[selectedCity]?.landmarks[selectedLandmark]?.name || '' : '';
  const anomalyMonitoringActive = dataLayers.flights || dataLayers.traffic || dataLayers.earthquakes || dataLayers.ddos;

  return (
    <div className={`app-container theme-${themeMode} ${cleanUI ? 'clean-ui' : ''} ${bloom ? 'bloom-active' : ''}`}>
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
          worldMode={worldMode}
        >
          <FlightLayer
            visible={worldMode === 'earth' && dataLayers.flights}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('flights', c)}
          />
          <TrafficLayer
            visible={worldMode === 'earth' && dataLayers.traffic}
            centerLat={cameraLat}
            centerLng={cameraLng}
            onCountUpdate={(c) => handleCountUpdate('traffic', c)}
          />
          <CCTVLayer
            visible={worldMode === 'earth' && dataLayers.cctv}
            showLabels={false}
            cameras={earthCamCameras}
            onCountUpdate={(c) => handleCountUpdate('cctv', c)}
            onCameraSelect={(cam: CameraPoint) => {
              setSelectedCctv(cam);
            }}
          />
          <EarthquakeLayer
            visible={worldMode === 'earth' && dataLayers.earthquakes}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('earthquakes', c)}
          />
          <DdosLayer
            visible={worldMode === 'earth' && dataLayers.ddos}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('ddos', c)}
          />
          <AlertLayer
            visible={worldMode === 'earth' && anomalyMonitoringActive}
            onCountUpdate={(c) => handleCountUpdate('alerts', c)}
          />
          <MoonMediaLayer
            visible={worldMode === 'moon' && dataLayers.moonMedia}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('moonMedia', c)}
          />
          <MoonLroLayer
            visible={worldMode === 'moon' && dataLayers.moonLro}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('moonLro', c)}
          />
          <MoonScienceLayer
            visible={worldMode === 'moon' && dataLayers.moonScience}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('moonScience', c)}
          />
          <MoonOrbitersLayer
            visible={worldMode === 'moon' && dataLayers.moonOrbiters}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('moonOrbiters', c)}
          />
          <MoonSpiceLayer
            visible={worldMode === 'moon' && dataLayers.moonSpice}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('moonSpice', c)}
          />
          <MoonArtemisLayer
            visible={worldMode === 'moon' && dataLayers.moonArtemis}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('moonArtemis', c)}
          />
          <MoonSolarWeatherLayer
            visible={worldMode === 'moon' && dataLayers.moonSolarWeather}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('moonSolarWeather', c)}
          />
          <MarsRoverLayer
            visible={worldMode === 'mars' && dataLayers.marsRovers}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('marsRovers', c)}
            onPhotoSelect={(photo: MarsRoverPoint) => setSelectedMarsPhoto(photo)}
          />
          <MarsWeatherLayer
            visible={worldMode === 'mars' && dataLayers.marsWeather}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('marsWeather', c)}
          />
          <MarsMediaLayer
            visible={worldMode === 'mars' && dataLayers.marsMedia}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('marsMedia', c)}
          />
          <MarsScienceLayer
            visible={worldMode === 'mars' && dataLayers.marsScience}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('marsScience', c)}
          />
          <MarsOrbitersLayer
            visible={worldMode === 'mars' && dataLayers.marsOrbiters}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('marsOrbiters', c)}
          />
          <MarsSolarWeatherLayer
            visible={worldMode === 'mars' && dataLayers.marsSolarWeather}
            detectMode={false}
            onCountUpdate={(c) => handleCountUpdate('marsSolarWeather', c)}
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
        worldMode={worldMode}
        scenes={activeScenes}
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
        themeMode={themeMode}
        hudVisible={hudVisible}
        cleanUI={cleanUI}
        onToggleBloom={() => setBloom(!bloom)}
        onToggleHud={() => setHudVisible(!hudVisible)}
        onToggleCleanUI={() => setCleanUI(!cleanUI)}
        onToggleTheme={() => setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {/* Style Presets */}
      <StylePresets
        activeStyle={activeStyle}
        onStyleChange={setActiveStyle}
        worldMode={worldMode}
        onWorldModeChange={setWorldMode}
      />

      {/* CCTV Preview */}
      {worldMode === 'earth' && dataLayers.cctv && selectedCctv && (
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

      {/* Mars Photo Preview */}
      {worldMode === 'mars' && dataLayers.marsRovers && selectedMarsPhoto && (
        <div className="glass-panel cctv-preview-panel" style={{
          position: 'absolute',
          zIndex: 60,
          padding: 10,
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              MARS PHOTO: {selectedMarsPhoto.rover}
            </div>
            <button className="glass-btn" style={{ padding: '4px 8px', fontSize: 9 }} onClick={() => setSelectedMarsPhoto(null)}>
              Close
            </button>
          </div>

          {selectedMarsPhoto.imageUrl ? (
            <img
              src={selectedMarsPhoto.imageUrl}
              alt={`${selectedMarsPhoto.rover} ${selectedMarsPhoto.camera}`}
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--border-color)', background: '#000' }}
            />
          ) : (
            <div style={{ width: '100%', height: 180, borderRadius: 3, border: '1px solid var(--border-color)', background: '#000', display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--text-dim)' }}>
              No preview image available
            </div>
          )}

          <div style={{ marginTop: 6, fontSize: 9, color: 'var(--text-dim)' }}>
            CAM {selectedMarsPhoto.camera} · SOL {selectedMarsPhoto.sol}
            {selectedMarsPhoto.pageUrl && (
              <>
                {' '}
                <a href={selectedMarsPhoto.pageUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                  Open mission images
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
