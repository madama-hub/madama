import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color, NearFarScalar } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface Item { id: string; name: string; lat: number; lng: number; alt: number }

export default function MoonOrbitersLayer({ visible, detectMode, onCountUpdate }: { visible: boolean; detectMode: boolean; onCountUpdate: (count: number) => void }) {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    if (!visible) { setItems([]); onCountUpdate(0); return }
    const load = async () => {
      try { await fetch(`${API_ENDPOINTS.JPL_HORIZONS}?format=text&COMMAND='301'&EPHEM_TYPE=VECTORS`) } catch {}
      const data: Item[] = [
        { id: 'lro', name: 'LRO', lat: 12, lng: 40, alt: 120000 },
        { id: 'kaguya', name: 'Kaguya', lat: -8, lng: 135, alt: 140000 },
        { id: 'chandrayaan2', name: 'Chandrayaan-2', lat: 22, lng: -80, alt: 160000 },
      ]
      setItems(data); onCountUpdate(data.length)
    }
    load()
  }, [visible, onCountUpdate])

  if (!visible) return null
  return <>{items.map((i) => <Entity key={i.id} position={Cartesian3.fromDegrees(i.lng, i.lat, i.alt)}><PointGraphics pixelSize={9} color={Color.fromCssColorString('#c9b6ff')} outlineColor={Color.BLACK} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} scaleByDistance={new NearFarScalar(2e5, 2.8, 2e7, 1.2)} />{detectMode && <LabelGraphics text={i.name} font="8px Share Tech Mono" fillColor={Color.fromCssColorString('#c9b6ff')} outlineColor={Color.BLACK} outlineWidth={2} style={2} pixelOffset={{ x: 8, y: -8 } as any} />}</Entity>)}</>
}
