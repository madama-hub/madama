import { useEffect, useState } from 'react';
import { Entity, PointGraphics, LabelGraphics, EllipseGraphics } from 'resium';
import { Cartesian3, Color } from 'cesium';

interface Item { id: string; name: string; lat: number; lng: number; ring: number }

export default function MoonArtemisLayer({ visible, detectMode, onCountUpdate }: { visible: boolean; detectMode: boolean; onCountUpdate: (count: number) => void }) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    if (!visible) { setItems([]); onCountUpdate(0); return }
    const data: Item[] = [
      { id: 'orion-pass-1', name: 'Orion Loop A', lat: 14, lng: 65, ring: 32000 },
      { id: 'orion-pass-2', name: 'Orion Loop B', lat: -12, lng: -55, ring: 28000 },
    ]
    setItems(data); onCountUpdate(data.length)
  }, [visible, onCountUpdate])

  if (!visible) return null
  return <>{items.map((i) => (
    <Entity key={i.id} position={Cartesian3.fromDegrees(i.lng, i.lat, 1000)}>
      <PointGraphics pixelSize={10} color={Color.fromCssColorString('#ffd6a5')} outlineColor={Color.BLACK} outlineWidth={2} disableDepthTestDistance={Number.POSITIVE_INFINITY} />
      <EllipseGraphics semiMajorAxis={i.ring} semiMinorAxis={i.ring} material={Color.fromCssColorString('#ffd6a5').withAlpha(0.1)} outline outlineColor={Color.fromCssColorString('#ffd6a5').withAlpha(0.35)} height={0} />
      {detectMode && <LabelGraphics text={i.name} font="8px Share Tech Mono" fillColor={Color.fromCssColorString('#ffd6a5')} outlineColor={Color.BLACK} outlineWidth={2} style={2} pixelOffset={{ x: 8, y: -8 } as any} />}
    </Entity>
  ))}</>
}
