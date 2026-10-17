/**
 * Crowd observations from synthetic gate counters and staff correction.
 * This module does NOT call stepSimulation. The UI must select observation
 * mode OR ticking simulation mode, not apply both to the same interval.
 * All values are people counts, not densities or verified safety limits.
 */
import type { SimulationState, ZoneId } from '../types'
import { snapshotOf } from '../data/scenarios'

export type Boundary = ZoneId | 'external'
export type Observation =
  | { id: string; kind: 'crossing'; from: Boundary; to: Boundary; count: number; source: 'synthetic_gate'; at: string }
  | { id: string; kind: 'correction'; zoneId: ZoneId; observedCount: number; reason: string; source: 'staff'; at: string }

export interface ObservationResult {
  next: SimulationState
  accepted: boolean
  message: string
  delta: number
}

// Physically allowed crossings in the sample temple layout. These are NOT route-safety approvals.
const allowedCrossings = new Set([
  'external>entry', 'entry>queueA', 'entry>queueB',
  'queueA>darshan', 'queueB>darshan', 'darshan>external'
])

const integer = (n: number) => Number.isSafeInteger(n) && n >= 0

/** Apply a trusted observation to a copy of state; reject malformed or impossible records. */
export function applyObservation(state: SimulationState, event: Observation): ObservationResult {
  const reject = (message: string): ObservationResult => ({next: state, accepted: false, message, delta: 0})
  if (!event.id || !event.at) return reject('Missing event ID/timestamp')
  const zones = Object.fromEntries(Object.entries(state.zones).map(([id, zone]) => [id, {...zone}])) as SimulationState['zones']
  let processed = state.processed
  let delta = 0
  if (event.kind === 'correction') {
    if (!zones[event.zoneId] || !integer(event.observedCount) || !event.reason.trim()) return reject('Invalid staff observation')
    delta = event.observedCount - zones[event.zoneId].occupancy
    // Observations may be ABOVE configured capacity; never mask a real overload by clamping.
    zones[event.zoneId].occupancy = event.observedCount
  } else {
    if (!integer(event.count) || event.count <= 0) return reject('Invalid crossing count')
    if (!allowedCrossings.has(`${event.from}>${event.to}`)) return reject('Unconfigured zone crossing')
    if (event.from !== 'external') {
      if (zones[event.from].occupancy < event.count) return reject('Crossing count exceeds source zone observation')
      zones[event.from].occupancy -= event.count
    }
    if (event.to !== 'external') zones[event.to].occupancy += event.count
    else processed += event.count
    delta = event.from === 'external' ? event.count : event.to === 'external' ? -event.count : 0
  }
  const next = {...state, zones, processed}
  next.history = [...state.history, snapshotOf(next)].slice(-41)
  const overload = Object.values(zones).some(z => z.occupancy > z.capacity)
  return {
    next, accepted: true, delta,
    message: `${event.kind === 'correction' ? 'Staff correction' : 'Synthetic boundary crossing'} accepted${overload ? '; configured occupancy limit exceeded' : ''}`
  }
}
