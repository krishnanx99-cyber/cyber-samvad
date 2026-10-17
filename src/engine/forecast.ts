/* OWNER: DEVELOPER C. Pure forecast and intervention comparison, no DOM. */
import type { Comparison, Forecast, InterventionId, SimulationState, Zones } from '../types'
import { ZONE_IDS } from '../types'
import { stepSimulation } from './simulator'
import { snapshotOf } from '../data/scenarios'

/**
 * Deterministic queue forecast over a chosen horizon (5, 10, or 15 minutes).
 * Replays stepSimulation without external Python/ML dependencies.
 * Arrival and service rates are configured scenario assumptions, not black-box ML.
 */
export function forecast(state: SimulationState, intervention: InterventionId, horizon = 10): Forecast {
  // Deep clone state.zones to ensure the original state remains 100% immutable
  const clonedZones: Zones = Object.fromEntries(
    Object.entries(state.zones).map(([k, z]) => [k, { ...z }])
  ) as unknown as Zones

  let current: SimulationState = { ...state, intervention, zones: clonedZones, history: [snapshotOf(state)] }
  const snapshots = [snapshotOf(current)]
  let peakUtilization = 0
  let firstThresholdMinute: number | null = null

  for (let t = 0; t <= horizon; t++) {
    if (t > 0) {
      current = stepSimulation(current, intervention)
      snapshots.push(snapshotOf(current))
    }
    const utilization = Math.max(
      ...ZONE_IDS.map(id => current.zones[id].occupancy / Math.max(1, current.zones[id].capacity))
    )
    peakUtilization = Math.max(peakUtilization, utilization)
    if (utilization >= .9 && firstThresholdMinute === null) firstThresholdMinute = t
  }
  const additionalProcessed = current.processed - state.processed
  // Explicit trade-off: an outside backlog is penalized rather than hidden.
  const score = Math.round(
    180 * Math.max(0, peakUtilization - 0.80) +
    current.outsideQueue * .35 +
    current.zones.entry.occupancy * .10 -
    additionalProcessed * .25
  )
  return {
    intervention, horizon, snapshots, peakUtilization, firstThresholdMinute,
    finalOutsideQueue: current.outsideQueue,
    additionalProcessed,
    finalMainQueue: current.zones.queueA.occupancy,
    estimatedMainWaitMinutes: current.zones.queueA.occupancy / Math.max(1, state.config.mainServiceRate),
    score
  }
}

/**
 * Compares three interventions ('none', 'metered', 'staffedLane') from the SAME starting state.
 * Never mutates the original simulation state.
 * Evaluates trade-offs using transparent penalty scoring.
 */
export function compareInterventions(state: SimulationState, horizon = 10): Comparison {
  const baseline = forecast(state, 'none', horizon)
  const options: Forecast[] = [baseline, forecast(state, 'metered', horizon), forecast(state, 'staffedLane', horizon)]
  const preferred = [...options].sort((a, b) => a.score - b.score)[0]
  const explanation = preferred.intervention === 'staffedLane'
    ? 'A pre-authorised staffed lane may increase throughput. Confirm trained staff, route separation and downstream capacity.'
    : preferred.intervention === 'metered'
      ? 'Metered admission reduces internal pressure but moves waiting outside. Staff must confirm external holding capacity.'
      : 'Current configuration has the lowest model penalty; continue monitoring all zones.'
  return { baseline, options, preferred, explanation }
}
