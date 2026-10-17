import type { Zones, ZoneId } from '../types'
import { COMMAND_EVENTS, COMMAND_ROOMS, COMMAND_ROUTES } from '../data/commandCenter'

export interface CommandAlert { id: string; level: 'warning' | 'critical'; title: string; detail: string }

export function CommandCenter({ zones, selectedZone, onSelect, alerts, onEvent, onQueueNotification, onOpenLayout }: {
  zones: Zones
  selectedZone: ZoneId
  onSelect: (id: ZoneId) => void
  alerts: CommandAlert[]
  onEvent: (eventId: string) => void
  onQueueNotification: () => void
  onOpenLayout: () => void
}) {
  return <section className="command-flowboard">
    <aside className="command-panel event-panel">
      <div className="panel-kicker">LIVE INTAKE</div><h2>Gate events</h2><p>Record a verified demo crossing. Each event updates the live count once.</p>
      <div className="event-list">{COMMAND_EVENTS.map(event => <button key={event.id} onClick={() => onEvent(event.id)}><b>{event.label}</b><span>{event.detail}</span></button>)}</div>
      <small>Synthetic inputs only. Staff corrections remain available in Observation mode.</small>
    </aside>
    <div className="flow-canvas-card">
      <div className="flow-canvas-head"><div><div className="panel-kicker">TEMPLE FLOWBOARD</div><h2>Live movement across monitored zones</h2></div><button onClick={onOpenLayout}>Edit layout</button></div>
      <div className="flow-canvas" role="img" aria-label="Live temple operations flowboard">
        <svg className="flow-routes" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 1 L 9 5 L 0 9 z" fill="#83b9c5" /></marker></defs>{COMMAND_ROUTES.map(route => { const source = COMMAND_ROOMS.find(room => room.id===route.from)!; const target = COMMAND_ROOMS.find(room => room.id===route.to)!; const x1=(source.x+source.w)*10; const y1=(source.y+source.h/2)*6; const x2=target.x*10; const y2=(target.y+target.h/2)*6; return <g key={route.id}><path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#315367" strokeWidth="16" opacity=".55" fill="none"/><path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#83b9c5" strokeWidth="3" strokeDasharray="9 7" markerEnd="url(#flow-arrow)" fill="none"/></g> })}</svg>
        <div className="flow-grid" />
        {COMMAND_ROOMS.map(room => { const zone=zones[room.id]; const utilisation=zone.capacity ? zone.occupancy/zone.capacity : 0; const severity=utilisation>=.9?'critical':utilisation>=.75?'warning':'normal'; return <button key={room.id} className={`flow-room ${room.kind} ${severity} ${selectedZone===room.id?'selected':''}`} style={{left:`${room.x}%`,top:`${room.y}%`,width:`${room.w}%`,height:`${room.h}%`}} onClick={() => onSelect(room.id)}><span className="room-eyebrow">{room.eyebrow}</span><b>{zone.label}</b><strong>{zone.occupancy}</strong><small>of {zone.capacity} people · {Math.round(utilisation*100)}%</small><i><em style={{width:`${Math.min(100, utilisation*100)}%`}} /></i></button> })}
        <div className="flow-caption">SIMULATED OPERATIONS LAYOUT · CONFIGURATION-LED · NOT A SURVEYED FLOOR PLAN</div>
      </div>
    </div>
    <aside className="command-panel alert-panel"><div className="panel-kicker">ATTENTION</div><h2>{alerts.length ? `${alerts.length} active alert${alerts.length===1?'':'s'}` : 'All zones stable'}</h2><div className="flow-alerts">{alerts.length ? alerts.map(alert => <article key={alert.id} className={alert.level}><span>{alert.level==='critical'?'CRITICAL':'WATCH'}</span><b>{alert.title}</b><p>{alert.detail}</p></article>) : <p>No current zone or forecast pressure needs action.</p>}</div><button className="notify-button" disabled={!alerts.length} onClick={onQueueNotification}>Queue staff notification</button><small>Telegram delivery is a secured-server integration, not a browser action.</small></aside>
  </section>
}
