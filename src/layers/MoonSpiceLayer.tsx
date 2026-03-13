import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface Item { id: string; label: string; lat: number; lng: number }

export default function MoonSpiceLayer({ visible, detectMode, onCountUpdate }: { visible: boolean; detectMode: boolean; onCountUpdate: (count: number) => void }) {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    if (!visible) { setItems([]); onCountUpdate(0); return }
    const load = async () => {
      try { await fetch(API_ENDPOINTS.NAIF_SPICE) } catch {}
      const data: Item[] = [
        { id: 'spice-apollo', label: 'SPICE Apollo Trajectory', lat: 0.6, lng: 23.4 },
        { id: 'spice-orion', label: 'SPICE Orion Arc', lat: -20, lng: 150 },
      ]
      setItems(data); onCountUpdate(data.length)
    }
    load()
  }, [visible, onCountUpdate])

  if (!visible) return null
  return <>{items.map((i) => <Entity key={i.id} position={Cartesian3.fromDegrees(i.lng, i.lat, 0)}><PointGraphics pixelSize={9} color={Color.fromCssColorString('#8bd3dd')} outlineColor={Color.BLACK} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />{detectMode && <LabelGraphics text={i.label} font="8px Share Tech Mono" fillColor={Color.fromCssColorString('#8bd3dd')} outlineColor={Color.BLACK} outlineWidth={2} style={2} pixelOffset={{ x: 8, y: -8 } as any} />}</Entity>)}</>
}
