import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface Item { id: string; idx: number; lat: number; lng: number }

export default function MoonSolarWeatherLayer({ visible, detectMode, onCountUpdate }: { visible: boolean; detectMode: boolean; onCountUpdate: (count: number) => void }) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    if (!visible) { setItems([]); onCountUpdate(0); return }
    const load = async () => {
      try {
        const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'
        const end = new Date().toISOString().slice(0, 10)
        const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10)
        await fetch(`${API_ENDPOINTS.NASA_DONKI_CME}?startDate=${start}&endDate=${end}&api_key=${apiKey}`)
      } catch {}
      const data: Item[] = [
        { id: 'moon-donki-1', idx: 66, lat: 0, lng: 0 },
        { id: 'moon-donki-2', idx: 52, lat: 26, lng: -40 },
      ]
      setItems(data); onCountUpdate(data.length)
    }
    load()
  }, [visible, onCountUpdate])

  if (!visible) return null
  return <>{items.map((i) => <Entity key={i.id} position={Cartesian3.fromDegrees(i.lng, i.lat, 0)}><PointGraphics pixelSize={10} color={Color.fromCssColorString('#f9c74f')} outlineColor={Color.BLACK} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />{detectMode && <LabelGraphics text={`DONKI IDX ${i.idx}`} font="8px Share Tech Mono" fillColor={Color.fromCssColorString('#f9c74f')} outlineColor={Color.BLACK} outlineWidth={2} style={2} pixelOffset={{ x: 8, y: -8 } as any} />}</Entity>)}</>
}
