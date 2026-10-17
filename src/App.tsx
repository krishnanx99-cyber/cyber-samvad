/* OWNER: DEVELOPER D. Integration layer only; do not duplicate logic in App. */
import { useEffect, useMemo, useState } from 'react'
import { createInitialState, SCENARIOS } from './data/scenarios'
import { stepSimulation } from './engine/simulator'
import { compareInterventions } from './engine/forecast'
import { ForecastChart } from './components/ForecastChart'
import { TempleMap } from './components/TempleMap'
import type { InterventionId, ScenarioId, ZoneId } from './types'

const interventions: {id:InterventionId;title:string;description:string}[] = [
  {id:'none',title:'No intervention',description:'Continue current operations'},
  {id:'metered',title:'Meter admissions',description:'Cap entry; outside queue may grow'},
  {id:'staffedLane',title:'Activate staffed lane',description:'Extra staffed processing capacity assumed'}
]
const pct = (a:number,b:number) => Math.round(a/b*100)
export default function App() {
  const [state,setState] = useState(() => createInitialState('surge'))
  const [running,setRunning] = useState(false)
  const [selectedZone,setSelectedZone] = useState<ZoneId>('queueA')
  const [candidate,setCandidate] = useState<InterventionId>('staffedLane')
  const [audit,setAudit] = useState<string[]>(['Simulation initialised with synthetic queue data'])
  const forecasts = useMemo(() => compareInterventions(state,10),[state])
  const alternative = forecasts.options.find(f => f.intervention===candidate) ?? forecasts.options[2]
  const zone = state.zones[selectedZone]
  const hotspots = Object.values(state.zones).filter(z => z.occupancy/z.capacity>=.85).length
  const risk = forecasts.baseline.firstThresholdMinute
  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => setState(prev => stepSimulation(prev)), 900)
    return () => window.clearInterval(interval)
  }, [running])
  const reset = (scenario:ScenarioId) => {setRunning(false);setState(createInitialState(scenario));setAudit([`Simulation reset: ${SCENARIOS[scenario].label}`])}
  const apply = (intervention:InterventionId) => {
    const label = interventions.find(i => i.id===intervention)?.title ?? intervention
    setState(prev => {
      // Read minute from prev to avoid stale closure when Play is running
      setAudit(a => [`Minute ${prev.minute}: Operator selected ${label}`, ...a].slice(0,8))
      return { ...prev, intervention }
    })
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-mark"><span className="brand-symbol">✦</span><div><b>DARSHANFLOW</b><small>OPERATIONS INTELLIGENCE</small></div></div>
      <div className="side-section"><div className="side-heading">OPERATIONS</div><div className="nav-item active">◈ <span>Command center</span></div><div className="nav-item">◷ <span>Forecast engine</span></div><div className="nav-item">▤ <span>Incident ledger</span></div></div>
      <div className="sidebar-foot"><span className="status-pulse"/> Synthetic simulation<br/><small>No personal data. No real routing.</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">CYBER SAMVAD 2026 • PS5</div><h1>Crowd Command Center</h1><p>Predict crowd pressure. Compare interventions. Keep humans in control.</p></div><span className="demo-pill">● LIVE SIMULATION</span></header>
      <section className="toolbar card">
        <label>Demo scenario<select value={state.scenario} onChange={e => reset(e.target.value as ScenarioId)}>{Object.entries(SCENARIOS).map(([id,s]) => <option key={id} value={id}>{s.label}</option>)}</select></label>
        <label>Arrivals / minute <strong>{state.config.arrivalRate}</strong><input aria-label="Visitor arrival rate" type="range" min="10" max="60" value={state.config.arrivalRate} onChange={e => setState(prev=>({...prev,config:{...prev.config,arrivalRate:Number(e.target.value)}}))}/></label>
        <div className="toolbar-actions"><button onClick={()=>setRunning(!running)} className="primary">{running?'Ⅱ Pause':'▶ Play'}</button><button onClick={()=>setState(s=>stepSimulation(s))} disabled={running}>+1 min</button><button onClick={()=>reset(state.scenario)}>↺ Reset</button></div>
        <span className="sim-minute">T+{state.minute} MIN</span>
      </section>
      <section className="stat-grid">
        <article className="stat card"><span>Visitors in managed zones</span><strong>{Object.values(state.zones).reduce((sum,z)=>sum+z.occupancy,0)}</strong><small>Outside waiting: {state.outsideQueue}</small></article>
        <article className="stat card"><span>Main queue occupancy</span><strong>{pct(state.zones.queueA.occupancy,state.zones.queueA.capacity)}%</strong><small>{state.zones.queueA.occupancy} / {state.zones.queueA.capacity} people</small></article>
        <article className="stat card"><span>Projected main wait</span><strong>{Math.ceil(state.zones.queueA.occupancy/state.config.mainServiceRate)} min</strong><small>Queue length ÷ service rate</small></article>
        <article className="stat card"><span>High-pressure zones</span><strong className={hotspots?'warn-text':''}>{hotspots}</strong><small>Zones at ≥85% capacity</small></article>
      </section>
      <section className="main-grid">
        <div className="card map-card"><div className="section-title"><div><div className="eyebrow">SPATIAL OPERATIONS</div><h2>Zone occupancy map</h2></div><span className="small-tag">Click a zone</span></div><TempleMap zones={state.zones} selectedZone={selectedZone} onSelect={setSelectedZone}/><div className="map-bottom"><div><b>{zone.label}</b><span>{zone.occupancy} / {zone.capacity} • {pct(zone.occupancy,zone.capacity)}% utilisation</span></div><div className={`severity ${pct(zone.occupancy,zone.capacity)>=90?'high':pct(zone.occupancy,zone.capacity)>=75?'medium':'low'}`}>{pct(zone.occupancy,zone.capacity)>=90?'CRITICAL':pct(zone.occupancy,zone.capacity)>=75?'ELEVATED':'NORMAL'}</div></div></div>
        <div className="card prediction-card"><div className="section-title"><div><div className="eyebrow">PREDICTIVE INTELLIGENCE</div><h2>10-minute forecast</h2></div><span className="small-tag">Deterministic model</span></div><div className="forecast-summary"><strong>{risk===null?'No breach predicted':`Threshold at T+${risk} min`}</strong><span>{risk===null?'Within the tested horizon':'Baseline forecast: ≥90% utilisation in at least one zone'}</span></div><ForecastChart baseline={forecasts.baseline} alternative={alternative} capacity={state.zones.queueA.capacity}/><div className="comparison-stats"><div><span>Baseline main queue</span><b>{forecasts.baseline.finalMainQueue}</b></div><div><span>Selected option</span><b>{alternative.finalMainQueue}</b></div><div><span>Outside backlog</span><b>{alternative.finalOutsideQueue}</b></div></div></div>
      </section>
      <section className="lower-grid">
        <div className="card action-card"><div className="section-title"><div><div className="eyebrow">HUMAN-IN-THE-LOOP</div><h2>Intervention lab</h2></div><span className="small-tag">What-if analysis</span></div><div className="interventions">{interventions.map(option=><button key={option.id} className={`option ${candidate===option.id?'selected':''}`} onClick={()=>setCandidate(option.id)}><b>{option.title}</b><span>{option.description}</span></button>)}</div><div className="action-note"><b>Comparison trade-off</b><p>Lowest model-penalty option: {interventions.find(i => i.id===forecasts.preferred.intervention)?.title}. {forecasts.explanation} Selected option score: {alternative.score}; baseline: {forecasts.baseline.score}. Scores are toy-model comparisons, not guarantees of safety.</p></div><div className="action-buttons"><button onClick={()=>apply(candidate)} className="primary">Apply simulated action →</button><span>Staff authorisation required in real operations</span></div></div>
        <div className="card ledger-card"><div className="section-title"><div><div className="eyebrow">ACCOUNTABILITY</div><h2>Operations log</h2></div><span className="small-tag">{audit.length} events</span></div><div className="ledger">{audit.map((item,index)=><div className="log" key={`${index}-${item}`}><i/> <span>{item}</span></div>)}</div><div className="responsible">Safety note: all crowd counts are synthetic. Real rerouting requires site assessment, authorised staff, route checks and validation.</div></div>
      </section>
      <footer>DarshanFlow — a student hackathon simulation. Not a real-time certified crowd-safety system.</footer>
    </main>
  </div>
}
