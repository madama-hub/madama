import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface MoonMediaPoint { id: string; title: string; lat: number; lng: number }

interface MoonMediaLayerProps {
  visible: boolean
  detectMode: boolean
  onCountUpdate: (count: number) => void
}

export default function MoonMediaLayer({ visible, detectMode, onCountUpdate }: MoonMediaLayerProps) {
  const [points, setPoints] = useState<MoonMediaPoint[]>([])

  useEffect(() => {
    if (!visible) { setPoints([]); onCountUpdate(0); return }

    const load = async () => {
      try { await fetch(`${API_ENDPOINTS.NASA_IMAGE_LIBRARY}?q=moon+apollo+artemis&media_type=image`) } catch {}
      const data: MoonMediaPoint[] = [
        { id: 'apollo11', title: 'Apollo 11 Archive', lat: 0.6741, lng: 23.4729 },
        { id: 'artemis', title: 'Artemis Media', lat: -84.0, lng: 0.0 },
        { id: 'lro-gallery', title: 'LRO Gallery', lat: 9.7, lng: -20.0 },
      ]
      setPoints(data); onCountUpdate(data.length)
    }

    load()
  }, [visible, onCountUpdate])

  if (!visible) return null
  return <>{points.map((p) => (
    <Entity key={p.id} position={Cartesian3.fromDegrees(p.lng, p.lat, 0)}>
      <PointGraphics pixelSize={9} color={Color.fromCssColorString('#9ad4ff')} outlineColor={Color.BLACK} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} scaleByDistance={new NearFarScalar(2e5, 2.8, 1e7, 1.2)} />
      {detectMode && <LabelGraphics text={p.title} font="8px Share Tech Mono" fillColor={Color.fromCssColorString('#9ad4ff')} outlineColor={Color.BLACK} outlineWidth={2} style={2} pixelOffset={{ x: 8, y: -8 } as any} />}
    </Entity>
  ))}</>
}
