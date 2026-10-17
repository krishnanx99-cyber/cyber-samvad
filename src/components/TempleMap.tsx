/* OWNER: DEVELOPER B. Presentational component only. */
import type { ZoneId, Zones } from '../types'
const rectangles: Record<ZoneId, { x: number; y: number; w: number; h: number }> = {
  entry: { x: 24, y: 44, w: 176, h: 116 },
  queueA: { x: 224, y: 44, w: 222, h: 180 },
  queueB: { x: 24, y: 184, w: 176, h: 132 },
  darshan: { x: 470, y: 98, w: 170, h: 164 }
}
export function TempleMap({ zones, selectedZone, onSelect }: {zones: Zones;selectedZone: ZoneId;onSelect: (id: ZoneId) => void}) {
  return <svg viewBox="0 0 670 354" role="img" aria-label="Simulated temple crowd zone map" className="temple-map">
    <defs><pattern id="mapgrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#334253" strokeWidth=".7" opacity=".65"/></pattern></defs>
    <rect width="670" height="354" fill="#111c2a" rx="12"/><rect width="670" height="354" fill="url(#mapgrid)" rx="12"/>
    <path d="M113 160V184 M200 100H224 M446 130H470 M446 213H470 M200 250H224" stroke="#6f8da4" strokeWidth="4" strokeDasharray="8 6" fill="none"/>
    {(Object.keys(rectangles) as ZoneId[]).map(id => {
      const r = rectangles[id]; const z = zones[id]; const pct = z.occupancy/z.capacity
      const fill = pct >= .90 ? '#8b4045' : pct >= .75 ? '#916b35' : '#1f665d'
      return <g key={id} onClick={() => onSelect(id)} onKeyDown={e => {if(e.key==='Enter') onSelect(id)}} role="button" tabIndex={0} aria-label={`Select ${z.label}`} style={{cursor:'pointer'}}>
        <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="12" fill={fill} stroke={selectedZone===id?'#e8eff5':'#7792a2'} strokeWidth={selectedZone===id?3:1.2}/>
        <text x={r.x+15} y={r.y+29} fill="#f4f7fb" fontSize="15" fontWeight="700">{z.label}</text>
        <text x={r.x+15} y={r.y+60} fill="#fff" fontSize="24" fontWeight="700">{z.occupancy.toLocaleString()}</text>
        <text x={r.x+15} y={r.y+80} fill="#d5e5e8" fontSize="12">of {z.capacity} capacity</text>
        <rect x={r.x+15} y={r.y+r.h-25} width={r.w-30} height="7" rx="3.5" fill="#0a1722"/>
        <rect x={r.x+15} y={r.y+r.h-25} width={(r.w-30)*Math.min(1,pct)} height="7" rx="3.5" fill={pct>=.9?'#ffb1a4':'#b2e8d7'}/>
      </g>
    })}
    <text x="25" y="340" fontSize="11" fill="#adc2d0">SIMULATED COUNTS • schematic layout, not real navigation</text>
  </svg>
}
