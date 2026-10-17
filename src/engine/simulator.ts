/* OWNER: DEVELOPER A. One deterministic minute tick; never mutate input. */
import type { InterventionId, SimulationState, Zones } from '../types'
import { snapshotOf } from '../data/scenarios'

const transfer = (count: number, available: number, space: number): number =>
  Math.max(0, Math.min(Math.floor(count), Math.floor(available), Math.floor(space)))

export function stepSimulation(state: SimulationState, intervention: InterventionId = state.intervention): SimulationState {
  const zones: Zones = Object.fromEntries(Object.entries(state.zones).map(([key, zone]) => [key, { ...zone }])) as unknown as Zones
  const c = state.config
  let outsideQueue = state.outsideQueue + c.arrivalRate
  let processed = state.processed

  // Exit corridor -> completed visit. This is a model of one-minute flow, not physical guidance.
  const exiting = transfer(zones.darshan.occupancy, c.exitRate, Infinity)
  zones.darshan.occupancy -= exiting
  processed += exiting

  // Service checkpoint moves visitors from queues into darshan corridor.
  const mainServed = transfer(zones.queueA.occupancy, c.mainServiceRate, zones.darshan.capacity - zones.darshan.occupancy)
  zones.queueA.occupancy -= mainServed
  zones.darshan.occupancy += mainServed
  if (intervention === 'staffedLane' || zones.queueB.occupancy > 0) {
    // Finish serving a previously opened lane even after new admissions stop.
    const otherServed = transfer(zones.queueB.occupancy, c.secondaryServiceRate, zones.darshan.capacity - zones.darshan.occupancy)
    zones.queueB.occupancy -= otherServed
    zones.darshan.occupancy += otherServed
  }

  // Entry -> managed queues. Staffed lane represents pre-approved extra staffing and space.
  if (intervention === 'staffedLane') {
    const toSecondary = transfer(zones.entry.occupancy, c.secondaryServiceRate, zones.queueB.capacity - zones.queueB.occupancy)
    zones.entry.occupancy -= toSecondary
    zones.queueB.occupancy += toSecondary
  }
  const toMain = transfer(zones.entry.occupancy, c.mainServiceRate + 20, zones.queueA.capacity - zones.queueA.occupancy)
  zones.entry.occupancy -= toMain
  zones.queueA.occupancy += toMain

  // Outside -> entry. Metering does NOT remove visitors; it creates an outside backlog.
  const admissionLimit = intervention === 'metered' ? c.meteredGateRate : c.arrivalRate
  const admitted = transfer(outsideQueue, admissionLimit, zones.entry.capacity - zones.entry.occupancy)
  outsideQueue -= admitted
  zones.entry.occupancy += admitted

  const next: SimulationState = {
    ...state, minute: state.minute + 1, intervention, zones, outsideQueue, processed,
    history: state.history
  }
  next.history = [...state.history, snapshotOf(next)].slice(-41)
  return next
}
