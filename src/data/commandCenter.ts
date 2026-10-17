import type { ZoneId } from '../types'
import type { Boundary } from '../engine/observations'

export type RoomKind = 'gate' | 'queue' | 'overflow' | 'sanctum'

export interface CommandRoom {
  id: ZoneId
  kind: RoomKind
  eyebrow: string
  x: number
  y: number
  w: number
  h: number
}

export interface CommandRoute { id: string; from: ZoneId; to: ZoneId; label: string }
export type CommandEventPreset =
  | { id: string; label: string; detail: string; kind: 'crossing'; from: Boundary; to: Boundary; count: number }
  | { id: string; label: string; detail: string; kind: 'correction'; zoneId: ZoneId; observedCount: number; reason: string }

// Add or reposition a room/route/event here; the Command Center renders from this single model.
export const COMMAND_ROOMS: CommandRoom[] = [
  { id: 'entry', kind: 'gate', eyebrow: '01 · arrival gate', x: 4, y: 33, w: 22, h: 34 },
  { id: 'queueA', kind: 'queue', eyebrow: '02 · main queue', x: 33, y: 13, w: 34, h: 66 },
  { id: 'queueB', kind: 'overflow', eyebrow: '03 · overflow bay', x: 33, y: 82, w: 24, h: 14 },
  { id: 'darshan', kind: 'sanctum', eyebrow: '04 · darshan', x: 75, y: 29, w: 21, h: 43 }
]

export const COMMAND_ROUTES: CommandRoute[] = [
  { id: 'entry-main', from: 'entry', to: 'queueA', label: 'screening' },
  { id: 'entry-overflow', from: 'entry', to: 'queueB', label: 'overflow' },
  { id: 'main-darshan', from: 'queueA', to: 'darshan', label: 'darshan lane' },
  { id: 'overflow-darshan', from: 'queueB', to: 'darshan', label: 'staffed lane' }
]

export const COMMAND_EVENTS: CommandEventPreset[] = [
  { id: 'arrival', label: 'Record arrivals', detail: 'Outside → Entry · 10 people', kind: 'crossing', from: 'external', to: 'entry', count: 10 },
  { id: 'screening', label: 'Clear screening', detail: 'Entry → Main queue · 8 people', kind: 'crossing', from: 'entry', to: 'queueA', count: 8 },
  { id: 'overflow', label: 'Open overflow', detail: 'Entry → Overflow bay · 6 people', kind: 'crossing', from: 'entry', to: 'queueB', count: 6 },
  { id: 'darshan', label: 'Advance to darshan', detail: 'Main queue → Darshan · 10 people', kind: 'crossing', from: 'queueA', to: 'darshan', count: 10 },
  { id: 'exit', label: 'Record exits', detail: 'Darshan → Outside · 6 people', kind: 'crossing', from: 'darshan', to: 'external', count: 6 },
  { id: 'staff-check', label: 'Apply staff count', detail: 'Primary queue set to 280 · demo correction', kind: 'correction', zoneId: 'queueA', observedCount: 280, reason: 'Scheduled staff count check' }
]
