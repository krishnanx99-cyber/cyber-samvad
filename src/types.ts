/** Shared contract: agree before coding; modifications need lead approval. */
export const ZONE_IDS = ['entry', 'queueA', 'queueB', 'darshan'] as const
export type ZoneId = (typeof ZONE_IDS)[number]
export type ScenarioId = 'normal' | 'surge' | 'festival'
export type InterventionId = 'none' | 'metered' | 'staffedLane'

export interface Zone {
  id: ZoneId
  label: string
  occupancy: number
  capacity: number
}
export type Zones = Record<ZoneId, Zone>
export interface SimulationConfig {
  arrivalRate: number           // visitors/min arriving outside gate
  mainServiceRate: number       // visitors/min leaving main queue for darshan
  secondaryServiceRate: number  // only available if staffed lane is approved
  exitRate: number              // visitors/min exiting darshan area
  meteredGateRate: number       // visitors/min admitted from outside
}
export interface Snapshot {
  minute: number
  occupancy: Record<ZoneId, number>
  outsideQueue: number
  processed: number
}
export interface SimulationState {
  minute: number
  scenario: ScenarioId
  intervention: InterventionId
  config: SimulationConfig
  zones: Zones
  outsideQueue: number
  processed: number
  history: Snapshot[]
}
export interface Forecast {
  intervention: InterventionId
  horizon: number
  snapshots: Snapshot[] // includes t=0, length horizon+1
  peakUtilization: number // max internal occupancy/capacity, over horizon
  firstThresholdMinute: number | null // threshold >= 90% in any zone
  finalOutsideQueue: number
  additionalProcessed: number
  finalMainQueue: number
  estimatedMainWaitMinutes: number
  score: number // lower is preferred in this toy model; not a safety assessment
}
export interface Comparison {
  baseline: Forecast
  options: Forecast[]
  preferred: Forecast
  explanation: string
}
