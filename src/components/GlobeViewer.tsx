import { useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    Viewer, Globe, Scene, Camera, Fog, ImageryLayer,
} from 'resium';
import {
    Ion, Cartesian3, Color, Math as CesiumMath,
    UrlTemplateImageryProvider,
    EllipsoidTerrainProvider,
    Cesium3DTileset,
    Viewer as CesiumViewer,
    Cartesian2,
    Rectangle,
    IntersectionTests,
    Ray,
} from 'cesium';
import type { Landmark } from '../utils/constants';
import type { WorldMode } from '../utils/constants';

const ION_TOKEN = (import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined)?.trim();
const EARTH_3D_TILES_ASSET_ID = Number(import.meta.env.VITE_GOOGLE_3D_TILES_ASSET_ID ?? '2275207');
const MOON_3D_TILES_ASSET_ID = Number(import.meta.env.VITE_MOON_3D_TILES_ASSET_ID ?? '2684829');
const MARS_3D_TILES_ASSET_ID = Number(import.meta.env.VITE_MARS_3D_TILES_ASSET_ID ?? '3644333');

const arcgisProvider = new UrlTemplateImageryProvider({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maximumLevel: 18,
});

const defaultTerrain = new EllipsoidTerrainProvider();

function getSpawnView(worldMode: WorldMode) {
    if (worldMode === 'moon') {
        return { lat: 8, lng: 20, alt: 3_200_000 };
    }
    if (worldMode === 'mars') {
        return { lat: 10, lng: 25, alt: 6_000_000 };
    }
    return { lat: 12, lng: 20, alt: 18_000_000 };
}

interface GlobeViewerProps {
    onCameraMove?: (lat: number, lng: number, alt: number, centerLat?: number, centerLng?: number) => void;
    flyToTarget?: Landmark | null;
    worldMode?: WorldMode;
    children?: ReactNode;
}

export default function GlobeViewer({ onCameraMove, flyToTarget, worldMode = 'earth', children }: GlobeViewerProps) {
    const viewerRef = useRef<{ cesiumElement?: CesiumViewer | null }>(null);
    const [tileStatus, setTileStatus] = useState<string>('loading');
    const activeTilesetRef = useRef<Cesium3DTileset | null>(null);

    // Load world tiles (Earth / Moon / Mars)
    useEffect(() => {
        if (!ION_TOKEN) {
            setTileStatus('FAILED: missing VITE_CESIUM_ION_TOKEN');
            return;
        }

        const assetByWorld: Record<WorldMode, number> = {
            earth: EARTH_3D_TILES_ASSET_ID,
            moon: MOON_3D_TILES_ASSET_ID,
            mars: MARS_3D_TILES_ASSET_ID,
        };

        const selectedAssetId = assetByWorld[worldMode];

        if (!Number.isFinite(selectedAssetId)) {
            setTileStatus(`FAILED: invalid asset id for ${worldMode.toUpperCase()}`);
            return;
        }

        Ion.defaultAccessToken = ION_TOKEN;

        let destroyed = false;
        let attempts = 0;
        let timer: number | undefined;

        const loadTiles = async () => {
            const viewer = viewerRef.current?.cesiumElement;
            if (!viewer) {
                attempts += 1;
                if (attempts > 60) {
                    setTileStatus('FAILED: viewer init timeout');
                    return;
                }
                setTileStatus('initializing viewer...');
                timer = window.setTimeout(loadTiles, 100);
                return;
            }

            try {
                const showEarthBase = worldMode === 'earth';
                viewer.scene.globe.show = showEarthBase;
                if (viewer.imageryLayers.length > 0) {
                    viewer.imageryLayers.get(0).show = showEarthBase;
                }

                setTileStatus(`fetching ${worldMode.toUpperCase()} asset ${selectedAssetId}...`);

                const tileset = await Cesium3DTileset.fromIonAssetId(selectedAssetId);

                if (!destroyed && !viewer.isDestroyed()) {
                    if (activeTilesetRef.current) {
                        viewer.scene.primitives.remove(activeTilesetRef.current);
                        activeTilesetRef.current = null;
                    }

                    viewer.scene.primitives.add(tileset);
                    activeTilesetRef.current = tileset;

                    await viewer.zoomTo(tileset);

                    const spawn = getSpawnView(worldMode);
                    viewer.camera.setView({
                        destination: Cartesian3.fromDegrees(spawn.lng, spawn.lat, spawn.alt),
                        orientation: {
                            heading: CesiumMath.toRadians(0),
                            pitch: CesiumMath.toRadians(-90),
                            roll: 0,
                        },
                    });

                    setTileStatus(`loaded ${worldMode.toUpperCase()}`);
                }
            } catch (err: any) {
                console.error('3D Tiles error:', err);
                setTileStatus(`FAILED: ${err?.message || err}`);
                viewer.scene.globe.show = true;
                if (viewer.imageryLayers.length === 0) {
                    viewer.imageryLayers.addImageryProvider(arcgisProvider);
                } else {
                    viewer.imageryLayers.get(0).show = true;
                }
            }
        };

        loadTiles();

        return () => {
            destroyed = true;
            if (timer) window.clearTimeout(timer);
            const viewer = viewerRef.current?.cesiumElement;
            if (activeTilesetRef.current && viewer && !viewer.isDestroyed()) {
                viewer.scene.primitives.remove(activeTilesetRef.current);
                activeTilesetRef.current = null;
            }
        };
    }, [worldMode]);

    // Camera movement callback
    useEffect(() => {
        const viewer = viewerRef.current?.cesiumElement;
        if (!viewer || !onCameraMove) return;

        let lastLat = Number.NaN;
        let lastLng = Number.NaN;
        let lastAlt = Number.NaN;
        let lastCenterLat = Number.NaN;
        let lastCenterLng = Number.NaN;

        const handler = () => {
            const pos = viewer.camera.positionCartographic;
            if (pos) {
                const center = new Cartesian2(
                    viewer.canvas.clientWidth / 2,
                    viewer.canvas.clientHeight / 2,
                );

                let centerLat: number | undefined;
                let centerLng: number | undefined;

                // Baseline fallback: derive center from current view rectangle.
                // This remains available even when depth/terrain picking fails.
                const rect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
                if (rect) {
                    const rectCenter = Rectangle.center(rect);
                    centerLat = CesiumMath.toDegrees(rectCenter.latitude);
                    centerLng = CesiumMath.toDegrees(rectCenter.longitude);
                }

                const ray = viewer.camera.getPickRay(center);
                const ellipsoidPick = viewer.camera.pickEllipsoid(center, viewer.scene.globe.ellipsoid);
                const globePick = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined;
                const pickPosition = viewer.scene.pickPosition(center);

                // Most stable intersection for center-cross coordinate extraction:
                // intersect center ray with WGS84 ellipsoid directly.
                let rayEllipsoidPick: Cartesian3 | undefined;
                if (ray) {
                    const hit = IntersectionTests.rayEllipsoid(ray, viewer.scene.globe.ellipsoid);
                    if (hit && hit.start >= 0) {
                        rayEllipsoidPick = Ray.getPoint(ray, hit.start);
                    }
                }

                // Prefer ellipsoid/globe intersection for stable center tracking,
                // then fall back to depth-based pick on dense 3D tiles.
                const picked = rayEllipsoidPick || ellipsoidPick || globePick || pickPosition;
                if (picked) {
                    const cart = viewer.scene.globe.ellipsoid.cartesianToCartographic(picked);
                    if (cart) {
                        centerLat = CesiumMath.toDegrees(cart.latitude);
                        centerLng = CesiumMath.toDegrees(cart.longitude);
                    }
                }

                const lat = Number(CesiumMath.toDegrees(pos.latitude).toFixed(6));
                const lng = Number(CesiumMath.toDegrees(pos.longitude).toFixed(6));
                const alt = Number(pos.height.toFixed(2));
                const cLatRaw = centerLat ?? lat;
                const cLngRaw = centerLng ?? lng;
                const cLat = Number((Number.isFinite(cLatRaw) ? cLatRaw : lat).toFixed(7));
                const cLng = Number((Number.isFinite(cLngRaw) ? cLngRaw : lng).toFixed(7));

                const changed =
                    lat !== lastLat ||
                    lng !== lastLng ||
                    alt !== lastAlt ||
                    cLat !== lastCenterLat ||
                    cLng !== lastCenterLng;

                if (!changed) return;

                lastLat = lat;
                lastLng = lng;
                lastAlt = alt;
                lastCenterLat = cLat;
                lastCenterLng = cLng;

                onCameraMove(
                    lat,
                    lng,
                    alt,
                    cLat,
                    cLng,
                );
            }
        };

        viewer.scene.postRender.addEventListener(handler);
        handler();

        return () => {
            if (!viewer.isDestroyed()) {
                viewer.scene.postRender.removeEventListener(handler);
            }
        };
    }, [onCameraMove]);

    // Fly to target landmark
    useEffect(() => {
        const viewer = viewerRef.current?.cesiumElement;
        if (!viewer || !flyToTarget) return;

        viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(
                flyToTarget.lng,
                flyToTarget.lat,
                flyToTarget.alt,
            ),
            orientation: {
                heading: CesiumMath.toRadians(flyToTarget.heading || 0),
                pitch: CesiumMath.toRadians(flyToTarget.pitch || -35),
                roll: 0,
            },
            duration: 2.0,
        });
    }, [flyToTarget]);

    return (
        <>
            {/* Debug banner — remove once working */}
            {!tileStatus.startsWith('loaded') && (
                <div style={{
                    position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, background: tileStatus.startsWith('FAILED') ? '#ff2244' : '#008080',
                    color: '#fff', padding: '6px 16px', borderRadius: 4,
                    fontFamily: 'monospace', fontSize: 11, letterSpacing: 1,
                }}>
                    3D TILES: {tileStatus}
                </div>
            )}
            <Viewer
                ref={viewerRef as any}
                full
                timeline={false}
                animation={false}
                baseLayerPicker={false}
                geocoder={false}
                homeButton={false}
                sceneModePicker={false}
                navigationHelpButton={false}
                fullscreenButton={false}
                selectionIndicator={false}
                infoBox={false}
                terrainProvider={defaultTerrain}
                requestRenderMode={false}
                maximumRenderTimeChange={Infinity}
            >
                <ImageryLayer imageryProvider={arcgisProvider} />
                <Scene backgroundColor={Color.BLACK} />
                <Globe
                    baseColor={Color.fromCssColorString('#0a0e17')}
                    enableLighting={false}
                    showGroundAtmosphere={false}
                />
                <Camera />
                <Fog enabled={false} />
                {children}
            </Viewer>
        </>
    );
}
