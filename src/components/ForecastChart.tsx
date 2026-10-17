/* OWNER: DEVELOPER B. Chart consumes forecasts; no forecast logic here. */
import type { Forecast } from '../types'
const coords = (arr: number[], max: number) => arr.map((v, i) => `${34+(i/(arr.length-1))*566},${170-(v/max)*145}`).join(' ')
export function ForecastChart({ baseline, alternative, capacity }: {baseline:Forecast;alternative:Forecast;capacity:number}) {
  const base = baseline.snapshots.map(s => s.occupancy.queueA)
  const alt = alternative.snapshots.map(s => s.occupancy.queueA)
  const max = Math.max(capacity*1.1, ...base, ...alt)
  const thresholdY = 170-((capacity*.9)/max)*145
  return <div>
    <svg viewBox="0 0 630 202" className="forecast-svg" aria-label="Forecast comparison of primary queue occupancy">
      {[.25,.5,.75,1].map(t => <line key={t} x1="34" y1={170-t*145} x2="600" y2={170-t*145} stroke="#3b4a5d" strokeDasharray="4 5"/>) }
      <line x1="34" y1={thresholdY} x2="600" y2={thresholdY} stroke="#e6b76b" strokeDasharray="7 4"/>
      <text x="600" y={thresholdY-6} textAnchor="end" fill="#e8c796" fontSize="10">90% capacity</text>
      <polyline points={coords(base,max)} stroke="#f0837f" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
      <polyline points={coords(alt,max)} stroke="#61d5bb" strokeWidth="3.5" fill="none" strokeLinejoin="round"/>
      <text x="34" y="190" fill="#b4c5d3" fontSize="11">NOW</text><text x="600" y="190" fill="#b4c5d3" fontSize="11" textAnchor="end">+{baseline.horizon} MIN</text>
    </svg>
    <div className="chart-legend"><span><i className="legend-dot" style={{background:'#f0837f'}}/>No intervention</span><span><i className="legend-dot" style={{background:'#61d5bb'}}/>Selected scenario</span></div>
  </div>
}
