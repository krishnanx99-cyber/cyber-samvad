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

export function createInitialState(scenario: ScenarioId = 'surge'): SimulationState {
  const zones: Zones = {
    entry: { id: 'entry', label: 'Entry / screening', occupancy: 48, capacity: 130 },
    queueA: { id: 'queueA', label: 'Primary queue', occupancy: 234, capacity: 320 },
    queueB: { id: 'queueB', label: 'Staffed overflow lane', occupancy: 0, capacity: 170 },
    darshan: { id: 'darshan', label: 'Darshan corridor', occupancy: 42, capacity: 110 }
  }
  const state: SimulationState = {
    minute: 0, scenario, intervention: 'none',
    config: { ...DEFAULT_CONFIG, arrivalRate: SCENARIOS[scenario].arrivalRate },
    zones, outsideQueue: 0, processed: 0, history: []
  }
  return { ...state, history: [snapshotOf(state)] }
}
