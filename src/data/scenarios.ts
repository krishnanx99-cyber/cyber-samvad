import type { ScenarioId, SimulationConfig, SimulationState, Snapshot, Zones } from '../types'

export const SCENARIOS: Record<ScenarioId, { label: string; arrivalRate: number; description: string }> = {
  normal: { label: 'Normal day', arrivalRate: 22, description: 'Arrivals roughly match processing capacity' },
  surge: { label: 'Arrival surge', arrivalRate: 40, description: 'A bus arrival sharply increases entry demand' },
  festival: { label: 'Festival peak', arrivalRate: 48, description: 'Persistent high arrival demand stresses queue capacity' }
}
export const DEFAULT_CONFIG: SimulationConfig = {
  arrivalRate: 40,
  mainServiceRate: 20,
  secondaryServiceRate: 16,
  exitRate: 42,
  meteredGateRate: 22
}

export function snapshotOf(state: Pick<SimulationState, 'minute' | 'zones' | 'outsideQueue' | 'processed'>): Snapshot {
  return {
    minute: state.minute,
    occupancy: {
      entry: state.zones.entry.occupancy,
      queueA: state.zones.queueA.occupancy,
      queueB: state.zones.queueB.occupancy,
      darshan: state.zones.darshan.occupancy
    },
    outsideQueue: state.outsideQueue,
    processed: state.processed
  }
}

const INITIAL_OCCUPANCIES: Record<ScenarioId, { entry: number; queueA: number; queueB: number; darshan: number }> = {
  normal:  { entry: 18, queueA: 80,  queueB: 0, darshan: 28 }, // calm — queues well below capacity
  surge:   { entry: 48, queueA: 234, queueB: 0, darshan: 42 }, // mid-pressure — primary queue ~73%
  festival:{ entry: 90, queueA: 290, queueB: 0, darshan: 80 }, // high-pressure — most zones near threshold
}

export function createInitialState(scenario: ScenarioId = 'surge'): SimulationState {
  const occ = INITIAL_OCCUPANCIES[scenario]
  const zones: Zones = {
    entry: { id: 'entry', label: 'Entry / screening', occupancy: occ.entry, capacity: 130 },
    queueA: { id: 'queueA', label: 'Primary queue', occupancy: occ.queueA, capacity: 320 },
    queueB: { id: 'queueB', label: 'Staffed overflow lane', occupancy: occ.queueB, capacity: 170 },
    darshan: { id: 'darshan', label: 'Darshan corridor', occupancy: occ.darshan, capacity: 110 }
  }
  const state: SimulationState = {
    minute: 0, scenario, intervention: 'none',
    config: { ...DEFAULT_CONFIG, arrivalRate: SCENARIOS[scenario].arrivalRate },
    zones, outsideQueue: 0, processed: 0, history: []
  }
  return { ...state, history: [snapshotOf(state)] }
}
