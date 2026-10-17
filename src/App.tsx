/* OWNER: DEVELOPER D. Integration layer only; do not duplicate logic in App. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createInitialState, SCENARIOS } from './data/scenarios'
import { stepSimulation } from './engine/simulator'
import { compareInterventions } from './engine/forecast'
import { applyObservation, type Boundary, type Observation } from './engine/observations'
import { ForecastChart } from './components/ForecastChart'
import { TempleMap } from './components/TempleMap'
import { TempleSetup, getStoredTempleConfig, saveStoredTempleConfig } from './components/TempleSetup'
import type { TempleConfig } from './components/TempleSetup'
import { ZONE_IDS } from './types'
import type { InterventionId, ScenarioId, ZoneId } from './types'

type InputMode = 'simulation' | 'observations'

const interventions: {id:InterventionId;title:string;description:string}[] = [
  {id:'none',title:'No intervention',description:'Continue current operations'},
  {id:'metered',title:'Meter admissions',description:'Cap entry; outside queue may grow'},
  {id:'staffedLane',title:'Activate staffed lane',description:'Extra staffed processing capacity assumed'}
]
const pct = (a:number,b:number) => Math.round(a/b*100)
export default function App() {
  const [state,setState] = useState(() => createInitialState('surge'))
  const [running,setRunning] = useState(false)
  const [inputMode,setInputMode] = useState<InputMode>('simulation')
  const [forecastHorizon,setForecastHorizon] = useState<5 | 10 | 15>(10)
  const [selectedZone,setSelectedZone] = useState<ZoneId>('queueA')
  const [templeConfig,setTempleConfig] = useState<TempleConfig>(() => getStoredTempleConfig())
  const [showSetup,setShowSetup] = useState(false)
  const [candidate,setCandidate] = useState<InterventionId>('staffedLane')
  const [correctionZone,setCorrectionZone] = useState<ZoneId>('queueA')
  const [correctionCount,setCorrectionCount] = useState('')
  const [correctionReason,setCorrectionReason] = useState('Staff count correction')
  const [lastObservationAt,setLastObservationAt] = useState<string | null>(null)
  const [audit,setAudit] = useState<string[]>(['Simulation initialised with synthetic queue data'])
  const handledObservationIds = useRef(new Set<string>())
  const observationSequence = useRef(0)
  const forecasts = useMemo(() => compareInterventions(state,forecastHorizon),[state,forecastHorizon])
  const alternative = forecasts.options.find(f => f.intervention===candidate) ?? forecasts.options[2]
  const zone = state.zones[selectedZone]
  const hotspots = Object.values(state.zones).filter(z => z.occupancy/z.capacity>=.85).length
  const risk = forecasts.baseline.firstThresholdMinute
  const syncStateWithTempleConfig = (nextState: ReturnType<typeof createInitialState>, nextConfig = templeConfig) => {
    const zones = { ...nextState.zones }
    ZONE_IDS.forEach(id => {
      zones[id] = {
        ...zones[id],
        label: nextConfig.zones[id].label,
        capacity: nextConfig.zones[id].capacity
      }
    })
    return { ...nextState, zones }
  }
  useEffect(() => {
    if (!running || inputMode !== 'simulation') return
    const interval = window.setInterval(() => setState(prev => stepSimulation(prev)), 900)
    return () => window.clearInterval(interval)
  }, [running, inputMode])
  const reset = (scenario:ScenarioId) => {
    setRunning(false)
    setState(syncStateWithTempleConfig(createInitialState(scenario)))
    handledObservationIds.current.clear()
    setLastObservationAt(null)
    setAudit([`Simulation reset: ${SCENARIOS[scenario].label}`])
  }
  const updateTempleConfig = (nextConfig: TempleConfig) => {
    setTempleConfig(nextConfig)
    saveStoredTempleConfig(nextConfig)
    setState(prev => syncStateWithTempleConfig(prev, nextConfig))
  }
  const setMode = (mode: InputMode) => {
    setInputMode(mode)
    if (mode === 'observations') setRunning(false)
    setAudit(prev => [`Input mode changed to ${mode === 'simulation' ? 'Simulation' : 'Observations'}`, ...prev].slice(0,8))
  }
  const nextObservationId = (prefix: string) => {
    observationSequence.current += 1
    return `${prefix}-${state.minute}-${observationSequence.current}`
  }
  const recordObservation = (event: Observation) => {
    if (handledObservationIds.current.has(event.id)) {
      setAudit(prev => [`Duplicate observation ignored: ${event.id}`, ...prev].slice(0,8))
      return false
    }
    const result = applyObservation(state, event)
    if (!result.accepted) {
      setAudit(prev => [`Observation rejected: ${result.message}`, ...prev].slice(0,8))
      return false
    }
    handledObservationIds.current.add(event.id)
    setState(result.next)
    setLastObservationAt(event.at)
    const detail = event.kind === 'correction'
      ? `${event.zoneId} = ${event.observedCount} (${event.reason})`
      : `${event.from} → ${event.to}: ${event.count} people`
    setAudit(prev => [`${event.source === 'staff' ? 'Staff correction' : 'Synthetic gate'} • ${detail}`, ...prev].slice(0,8))
    return true
  }
  const recordCrossing = (from: Boundary, to: Boundary, count: number) => {
    recordObservation({
      id: nextObservationId('crossing'),
      kind: 'crossing',
      from,
      to,
      count,
      source: 'synthetic_gate',
      at: new Date().toISOString()
    })
  }
  const recordCorrection = () => {
    if (!correctionCount.trim()) {
      setAudit(prev => ['Observation rejected: enter a numeric zone count', ...prev].slice(0,8))
      return
    }
    const accepted = recordObservation({
      id: nextObservationId('correction'),
      kind: 'correction',
      zoneId: correctionZone,
      observedCount: Number(correctionCount),
      reason: correctionReason,
      source: 'staff',
      at: new Date().toISOString()
    })
    if (accepted) setCorrectionCount('')
  }
  const apply = (intervention:InterventionId) => {
    setState(prev => ({ ...prev, intervention }))
    const label = interventions.find(i => i.id===intervention)?.title ?? intervention
    setAudit(prev => [`Minute ${state.minute}: Operator selected ${label}`, ...prev].slice(0,8))
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-mark"><span className="brand-symbol">✦</span><div><b>DARSHANFLOW</b><small>OPERATIONS INTELLIGENCE</small></div></div>
      <div className="side-section"><div className="side-heading">OPERATIONS</div><div className="nav-item active">◈ <span>Command center</span></div><div className="nav-item">◷ <span>Forecast engine</span></div><div className="nav-item">▤ <span>Incident ledger</span></div></div>
      <div className="sidebar-foot"><span className="status-pulse"/> Synthetic simulation<br/><small>No personal data. No real routing.</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">CYBER SAMVAD 2026 • PS5</div><h1>Crowd Command Center</h1><p>Predict crowd pressure. Compare interventions. Keep humans in control.</p></div><span className="demo-pill">● {inputMode === 'simulation' ? 'SIMULATED INPUT' : 'STAFF OBSERVATIONS'}</span></header>
      <section className="toolbar card">
        <label>Input source<select value={inputMode} onChange={e => setMode(e.target.value as InputMode)}><option value="simulation">Simulation</option><option value="observations">Observations</option></select></label>
        <label>Demo scenario<select value={state.scenario} onChange={e => reset(e.target.value as ScenarioId)}>{Object.entries(SCENARIOS).map(([id,s]) => <option key={id} value={id}>{s.label}</option>)}</select></label>
        <label>Arrivals / minute <strong>{state.config.arrivalRate}</strong><input aria-label="Visitor arrival rate" type="range" min="10" max="60" value={state.config.arrivalRate} onChange={e => setState(prev=>({...prev,config:{...prev.config,arrivalRate:Number(e.target.value)}}))}/></label>
        <label>Forecast horizon<select value={forecastHorizon} onChange={e => setForecastHorizon(Number(e.target.value) as 5 | 10 | 15)}><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option></select></label>
        <div className="toolbar-actions"><button onClick={()=>setRunning(!running)} disabled={inputMode === 'observations'} className="primary">{running?'Ⅱ Pause':'▶ Play'}</button><button onClick={()=>setState(s=>stepSimulation(s))} disabled={running || inputMode === 'observations'}>+1 min</button><button onClick={()=>reset(state.scenario)}>↺ Reset</button></div>
        <span className="sim-minute">T+{state.minute} MIN</span>
      </section>
      <section className="stat-grid">
        <article className="stat card"><span>Visitors in managed zones</span><strong>{Object.values(state.zones).reduce((sum,z)=>sum+z.occupancy,0)}</strong><small>Outside waiting: {state.outsideQueue}</small></article>
        <article className="stat card"><span>Main queue occupancy</span><strong>{pct(state.zones.queueA.occupancy,state.zones.queueA.capacity)}%</strong><small>{state.zones.queueA.occupancy} / {state.zones.queueA.capacity} people</small></article>
        <article className="stat card"><span>Projected main wait</span><strong>{state.config.mainServiceRate > 0 ? `${Math.ceil(state.zones.queueA.occupancy/state.config.mainServiceRate)} min` : 'Unavailable'}</strong><small>Queue length ÷ service rate</small></article>
        <article className="stat card"><span>High-pressure zones</span><strong className={hotspots?'warn-text':''}>{hotspots}</strong><small>Zones at ≥85% capacity</small></article>
      </section>
      <section className="main-grid">
        <div className="card map-card"><div className="section-title"><div><div className="eyebrow">SPATIAL OPERATIONS</div><h2>Zone occupancy map</h2></div><span className="small-tag">Click a zone</span></div><TempleMap zones={state.zones} selectedZone={selectedZone} onSelect={setSelectedZone} config={templeConfig} sourceBadge={inputMode === 'simulation' ? 'SIMULATED DATA' : 'STAFF OBSERVATIONS'} onOpenSetup={() => setShowSetup(true)}/><div className="map-bottom"><div><b>{zone.label}</b><span>{zone.occupancy} / {zone.capacity} • {pct(zone.occupancy,zone.capacity)}% utilisation</span></div><div className={`severity ${pct(zone.occupancy,zone.capacity)>=90?'high':pct(zone.occupancy,zone.capacity)>=75?'medium':'low'}`}>{pct(zone.occupancy,zone.capacity)>=90?'CRITICAL':pct(zone.occupancy,zone.capacity)>=75?'ELEVATED':'NORMAL'}</div></div></div>
        <div className="card prediction-card"><div className="section-title"><div><div className="eyebrow">PREDICTIVE INTELLIGENCE</div><h2>{forecastHorizon}-minute forecast</h2></div><span className="small-tag">Deterministic model</span></div><div className="forecast-summary"><strong>{risk===null?'No breach predicted':`Threshold at T+${risk} min`}</strong><span>{risk===null?`Within the ${forecastHorizon}-minute horizon`:'Baseline forecast: ≥90% utilisation in at least one zone'}</span></div><ForecastChart baseline={forecasts.baseline} alternative={alternative} capacity={state.zones.queueA.capacity}/><div className="comparison-stats"><div><span>Baseline main queue</span><b>{forecasts.baseline.finalMainQueue}</b></div><div><span>Selected option</span><b>{alternative.finalMainQueue}</b></div><div><span>Outside backlog</span><b>{alternative.finalOutsideQueue}</b></div></div></div>
      </section>
      {inputMode === 'observations' && <section className="card action-card">
        <div className="section-title"><div><div className="eyebrow">OBSERVATION INPUTS</div><h2>Record a trusted demo event</h2></div><span className="small-tag">No live sensor claim</span></div>
        <p className="responsible">Observation mode pauses the continuous simulator. Each event is source-labelled, timestamped, immutable, and applied once. Use these controls to demonstrate how occupancy changes from explicit inputs.</p>
        <div className="interventions">
          <button className="option" onClick={() => recordCrossing('external','entry',10)}><b>Synthetic gate +10</b><span>External → entry crossing</span></button>
          <button className="option" onClick={() => recordCrossing('entry','queueA',8)}><b>Move through screening</b><span>Entry → primary queue, 8 people</span></button>
          <button className="option" onClick={() => recordCrossing('queueA','darshan',10)}><b>Advance primary queue</b><span>Primary queue → darshan, 10 people</span></button>
          <button className="option" onClick={() => recordCrossing('darshan','external',6)}><b>Record completion</b><span>Darshan → external, 6 completed</span></button>
        </div>
        <div className="toolbar" style={{marginTop:'15px', marginBottom:0, padding:0, border:0, boxShadow:'none'}}>
          <label>Correct zone<select value={correctionZone} onChange={e => setCorrectionZone(e.target.value as ZoneId)}>{Object.values(state.zones).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Observed count<input aria-label="Observed zone count" type="number" min="0" value={correctionCount} onChange={e => setCorrectionCount(e.target.value)} placeholder="e.g. 280" /></label>
          <label>Reason<input aria-label="Correction reason" value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} /></label>
          <button onClick={recordCorrection} className="primary">Apply staff correction</button>
        </div>
        <div className="responsible">{lastObservationAt ? `Last accepted observation: ${new Date(lastObservationAt).toLocaleTimeString()}` : 'No observation event recorded yet.'} Over-capacity corrections remain visible for operator review.</div>
      </section>}
      <section className="lower-grid">
        <div className="card action-card"><div className="section-title"><div><div className="eyebrow">HUMAN-IN-THE-LOOP</div><h2>Intervention lab</h2></div><span className="small-tag">What-if analysis</span></div><div className="interventions">{interventions.map(option=><button key={option.id} className={`option ${candidate===option.id?'selected':''}`} onClick={()=>setCandidate(option.id)}><b>{option.title}</b><span>{option.description}</span></button>)}</div><div className="action-note"><b>Comparison trade-off</b><p>Lowest model-penalty option: {interventions.find(i => i.id===forecasts.preferred.intervention)?.title}. {forecasts.explanation} Selected option score: {alternative.score}; baseline: {forecasts.baseline.score}. Scores are toy-model comparisons, not guarantees of safety.</p></div><div className="action-buttons"><button onClick={()=>apply(candidate)} className="primary">Apply simulated action →</button><span>Staff authorisation required in real operations</span></div></div>
        <div className="card ledger-card"><div className="section-title"><div><div className="eyebrow">ACCOUNTABILITY</div><h2>Operations log</h2></div><span className="small-tag">{audit.length} events</span></div><div className="ledger">{audit.map((item,index)=><div className="log" key={`${index}-${item}`}><i/> <span>{item}</span></div>)}</div><div className="responsible">Safety note: all crowd counts are synthetic. Real rerouting requires site assessment, authorised staff, route checks and validation.</div></div>
      </section>
      <footer>DarshanFlow — a student hackathon simulation. Not a real-time certified crowd-safety system.</footer>
    </main>
    <TempleSetup config={templeConfig} onChange={updateTempleConfig} isOpen={showSetup} onClose={() => setShowSetup(false)} />
  </div>
}
