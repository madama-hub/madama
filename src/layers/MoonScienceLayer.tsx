import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface Item { id: string; label: string; lat: number; lng: number }

export default function MoonScienceLayer({ visible, detectMode, onCountUpdate }: { visible: boolean; detectMode: boolean; onCountUpdate: (count: number) => void }) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    if (!visible) { setItems([]); onCountUpdate(0); return }
    const load = async () => {
      try { await fetch(`${API_ENDPOINTS.NASA_PDS_SEARCH}?q=apollo+lunar+science`) } catch {}
      const data: Item[] = [
        { id: 'apollo17', label: 'Apollo 17 Geology', lat: 20.2, lng: 30.8 },
        { id: 'apollo15', label: 'Apollo 15 Samples', lat: 26.1, lng: 3.6 },
        { id: 'apollo12', label: 'Apollo 12 Radiation', lat: -3.0, lng: -23.4 },
      ]
      setItems(data); onCountUpdate(data.length)
    }
    load()
  }, [visible, onCountUpdate])

  if (!visible) return null
  return <>{items.map((i) => <Entity key={i.id} position={Cartesian3.fromDegrees(i.lng, i.lat, 0)}><PointGraphics pixelSize={9} color={Color.fromCssColorString('#b8e1ff')} outlineColor={Color.BLACK} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />{detectMode && <LabelGraphics text={i.label} font="8px Share Tech Mono" fillColor={Color.fromCssColorString('#b8e1ff')} outlineColor={Color.BLACK} outlineWidth={2} style={2} pixelOffset={{ x: 8, y: -8 } as any} />}</Entity>)}</>
}
