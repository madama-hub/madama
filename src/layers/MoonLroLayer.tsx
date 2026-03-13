import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics } from 'resium';
import { Cartesian3, Color } from 'cesium';
import { API_ENDPOINTS } from '../utils/constants';

interface Item { id: string; name: string; lat: number; lng: number }

export default function MoonLroLayer({ visible, detectMode, onCountUpdate }: { visible: boolean; detectMode: boolean; onCountUpdate: (count: number) => void }) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    if (!visible) { setItems([]); onCountUpdate(0); return }
    const load = async () => {
      try { await fetch(`${API_ENDPOINTS.NASA_PDS_SEARCH}?q=lro+moon+topography`) } catch {}
      const data: Item[] = [
        { id: 'tycho-dem', name: 'Tycho DEM', lat: -43.3, lng: -11.2 },
        { id: 'copernicus-dem', name: 'Copernicus DEM', lat: 9.6, lng: -20.1 },
        { id: 'spole-dem', name: 'South Pole DEM', lat: -89.5, lng: 40.0 },
      ]
      setItems(data); onCountUpdate(data.length)
    }
    load()
  }, [visible, onCountUpdate])

  if (!visible) return null
  return <>{items.map((i) => <Entity key={i.id} position={Cartesian3.fromDegrees(i.lng, i.lat, 0)}><PointGraphics pixelSize={9} color={Color.fromCssColorString('#7fb7ff')} outlineColor={Color.BLACK} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />{detectMode && <LabelGraphics text={i.name} font="8px Share Tech Mono" fillColor={Color.fromCssColorString('#7fb7ff')} outlineColor={Color.BLACK} outlineWidth={2} style={2} pixelOffset={{ x: 8, y: -8 } as any} />}</Entity>)}</>
}
