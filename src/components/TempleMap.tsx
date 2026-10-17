import type { ZoneId, Zones } from '../types'
import { DEFAULT_MAP_ROUTES } from './TempleSetup'
import type { TempleConfig } from './TempleSetup'

export interface TempleMapProps {
  zones: Zones
  selectedZone: ZoneId
  onSelect: (id: ZoneId) => void
  config?: TempleConfig | null
  sourceBadge?: string
  onOpenSetup?: () => void
}

const defaultRectangles: Record<ZoneId, { x: number; y: number; w: number; h: number }> = {
  entry: { x: 24, y: 44, w: 176, h: 116 },
  queueA: { x: 224, y: 44, w: 222, h: 180 },
  queueB: { x: 24, y: 184, w: 176, h: 132 },
  darshan: { x: 470, y: 98, w: 170, h: 164 }
}

const zoneIds: ZoneId[] = ['entry', 'queueA', 'queueB', 'darshan']
type MapRectangle = { x: number; y: number; w: number; h: number }

function getMapRectangle(id: ZoneId, config?: TempleConfig | null): MapRectangle {
  const fallback = defaultRectangles[id]
  const layout = config?.zones[id]
  if (!layout) return fallback
  return {
    x: Math.round(layout.xPct / 100 * 670),
    y: Math.round(layout.yPct / 100 * 354),
    w: Math.round(layout.wPct / 100 * 670),
    h: Math.round(layout.hPct / 100 * 354)
  }
}

function routeAnchor(from: MapRectangle, to: MapRectangle) {
  const dx = (to.x + to.w / 2) - (from.x + from.w / 2)
  const dy = (to.y + to.h / 2) - (from.y + from.h / 2)
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { x1: from.x + from.w, y1: from.y + from.h / 2, x2: to.x, y2: to.y + to.h / 2 }
      : { x1: from.x, y1: from.y + from.h / 2, x2: to.x + to.w, y2: to.y + to.h / 2 }
  }
  return dy >= 0
    ? { x1: from.x + from.w / 2, y1: from.y + from.h, x2: to.x + to.w / 2, y2: to.y }
    : { x1: from.x + from.w / 2, y1: from.y, x2: to.x + to.w / 2, y2: to.y + to.h }
}

function getThresholdVisuals(pct: number) {
  if (pct >= 0.90) {
    return {
      fill: '#8b4045',
      fillBg: 'rgba(139, 64, 69, 0.88)',
      border: '#ffaca1',
      text: '#ffaca1',
      badge: 'CRITICAL',
      barColor: '#ffb1a4'
    }
  }
  if (pct >= 0.75) {
    return {
      fill: '#916b35',
      fillBg: 'rgba(145, 107, 53, 0.88)',
      border: '#f1bd7b',
      text: '#f1bd7b',
      badge: 'ELEVATED',
      barColor: '#fcd34d'
    }
  }
  return {
    fill: '#1f665d',
    fillBg: 'rgba(31, 102, 93, 0.88)',
    border: '#56cba9',
    text: '#56cba9',
    badge: 'NORMAL',
    barColor: '#6ee7b7'
  }
}

export function TempleMap({
  zones,
  selectedZone,
  onSelect,
  config,
  sourceBadge = 'SIMULATED DATA',
  onOpenSetup
}: TempleMapProps) {
  // Image calibration is intentionally deferred; the demo uses a configurable operations schematic.
  const hasCustomImage = false
  const mapRectangles = Object.fromEntries(zoneIds.map((id) => [id, getMapRectangle(id, config)])) as Record<ZoneId, MapRectangle>
  const visibleRoutes = (config?.routes ?? DEFAULT_MAP_ROUTES).filter((route) => route.enabled && route.from !== route.to)

  return (
    <div className="temple-map-wrapper">
      {/* Top Map Control Bar */}
      <div className="map-top-bar">
        <div className="map-source-pill">
          <span className="source-dot" />
          <span>{sourceBadge}</span>
        </div>

        <div className="map-legend">
          <span className="legend-item">
            <i style={{ background: '#56cba9' }} /> &lt;75% Normal
          </span>
          <span className="legend-item">
            <i style={{ background: '#f1bd7b' }} /> 75-89% Elevated
          </span>
          <span className="legend-item">
            <i style={{ background: '#ffaca1' }} /> ≥90% Critical
          </span>
        </div>
        <div className="map-context">Four-zone operational flow • schematic view</div>
        {onOpenSetup && <button type="button" className="map-layout-btn" onClick={onOpenSetup}>Configure layout</button>}
      </div>

      {/* Main View: Custom Uploaded Floor Plan OR Default SVG Schematic */}
      {hasCustomImage && config?.imageDataUrl ? (
        <div
          className="custom-map-viewport"
          style={{ aspectRatio: config.imageAspectRatio ?? 16 / 9 }}
        >
          <img
            src={config.imageDataUrl}
            alt={config.templeName || 'Temple Floor Plan'}
            className="custom-map-image"
          />

          {/* Calibrated Zone Overlays */}
          {zoneIds.map((id) => {
            const z = zones[id]
            const zCfg = config.zones?.[id]
            const label = zCfg?.label || z.label
            const capacity = z.capacity
            const occupancy = z.occupancy
            const pct = capacity > 0 ? occupancy / capacity : 0
            const visuals = getThresholdVisuals(pct)
            const isSelected = selectedZone === id

            const xPct = zCfg?.xPct ?? 10
            const yPct = zCfg?.yPct ?? 10
            const wPct = zCfg?.wPct ?? 25
            const hPct = zCfg?.hPct ?? 30

            return (
              <div
                key={id}
                className={`custom-zone-overlay ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  width: `${wPct}%`,
                  height: `${hPct}%`,
                  borderColor: isSelected ? '#ffffff' : visuals.border,
                  backgroundColor: visuals.fillBg
                }}
                onClick={() => onSelect(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(id)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Zone ${label}, ${visuals.badge}, occupancy ${occupancy} of ${capacity}`}
              >
                <div className="custom-zone-header">
                  <span className="zone-name">{label}</span>
                  <span
                    className="zone-badge"
                    style={{ background: visuals.fill, color: '#ffffff' }}
                  >
                    {Math.round(pct * 100)}%
                  </span>
                </div>

                <div className="custom-zone-metrics">
                  <strong>{occupancy.toLocaleString()}</strong>
                  <small>of {capacity} cap</small>
                </div>

                <div className="custom-zone-progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, Math.round(pct * 100))}%`,
                      backgroundColor: visuals.barColor
                    }}
                  />
                </div>
              </div>
            )
          })}

          <div className="custom-map-footer">
            <span>{config.templeName} • Calibrated Spatial Layout</span>
            <small>Click any zone to inspect queue pressure</small>
          </div>
        </div>
      ) : (
        /* Fallback Default SVG Schematic Map */
        <svg
          viewBox="0 0 670 354"
          role="img"
          aria-label="Simulated temple crowd zone map"
          className="temple-map"
        >
          <defs>
            <pattern
              id="mapgrid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M24 0H0V24"
                fill="none"
                stroke="#334253"
                strokeWidth=".7"
                opacity=".65"
              />
            </pattern>
            {/* Pathway arrow marker */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#6f8da4" />
            </marker>
          </defs>

          <linearGradient id="mapSurface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14283a" />
            <stop offset="55%" stopColor="#0e1b2a" />
            <stop offset="100%" stopColor="#09131f" />
          </linearGradient>
          <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Schematic site envelope. It communicates operational flow, not a real floor plan. */}
          <rect width="670" height="354" fill="url(#mapSurface)" rx="12" />
          <rect width="670" height="354" fill="url(#mapgrid)" rx="12" />
          <rect x="11" y="11" width="648" height="332" rx="10" fill="none" stroke="#38536a" strokeWidth="1" />
          <path d="M23 34 H646" stroke="#2f5268" strokeWidth="1" strokeDasharray="2 8" />
          <text x="25" y="27" fill="#86a7ba" fontSize="9" fontWeight="700" letterSpacing="1.6">TEMPLE OPERATIONS SCHEMATIC</text>
          <text x="645" y="27" fill="#5c8796" fontSize="8" textAnchor="end">SIMULATED FLOW</text>

          <text x="25" y="48" fill="#6494a9" fontSize="8" fontWeight="700" letterSpacing="1.2">OPERATOR-DEFINED ZONE LAYOUT</text>

          {/* Display routes follow the operator-configured zone layout. */}
          {visibleRoutes.map((route) => {
            const anchor = routeAnchor(mapRectangles[route.from], mapRectangles[route.to])
            const path = `M ${anchor.x1} ${anchor.y1} L ${anchor.x2} ${anchor.y2}`
            return <g key={route.id}>
              <path d={path} stroke="#4f8093" strokeWidth="10" opacity=".22" fill="none" />
              <path d={path} stroke="#86b4c7" strokeWidth="3" strokeDasharray="6 4" markerEnd="url(#arrow)" fill="none" />
            </g>
          })}

          {/* Zone Nodes */}
          {zoneIds.map((id) => {
            const r = mapRectangles[id]
            const z = zones[id]
            const zCfg = config?.zones?.[id]
            const label = zCfg?.label || z.label
            const capacity = z.capacity
            const occupancy = z.occupancy
            const pct = capacity > 0 ? occupancy / capacity : 0
            const visuals = getThresholdVisuals(pct)
            const isSelected = selectedZone === id

            return (
              <g
                key={id}
                onClick={() => onSelect(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(id)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${label}`}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  rx="12"
                  fill={visuals.fill}
                  stroke={isSelected ? '#ffffff' : visuals.border}
                  strokeWidth={isSelected ? 3.5 : 1.2}
                  filter={isSelected ? 'url(#nodeGlow)' : undefined}
                />
                {/* Zone Label */}
                <text
                  x={r.x + 15}
                  y={r.y + 28}
                  fill="#f4f7fb"
                  fontSize="14"
                  fontWeight="700"
                >
                  {label}
                </text>
                {/* Occupancy count */}
                <text
                  x={r.x + 15}
                  y={r.y + 58}
                  fill="#ffffff"
                  fontSize="24"
                  fontWeight="700"
                >
                  {occupancy.toLocaleString()}
                </text>
                {/* Capacity subtitle */}
                <text
                  x={r.x + 15}
                  y={r.y + 78}
                  fill="#d5e5e8"
                  fontSize="11"
                >
                  of {capacity} capacity ({Math.round(pct * 100)}%)
                </text>
                {/* Progress bar background */}
                <rect
                  x={r.x + 15}
                  y={r.y + r.h - 24}
                  width={r.w - 30}
                  height="7"
                  rx="3.5"
                  fill="#0a1722"
                />
                {/* Progress bar fill */}
                <rect
                  x={r.x + 15}
                  y={r.y + r.h - 24}
                  width={(r.w - 30) * Math.max(0, Math.min(1, pct))}
                  height="7"
                  rx="3.5"
                  fill={visuals.barColor}
                />
              </g>
            )
          })}

          <text x="25" y="333" fontSize="10" fill="#8eacbb">
            SIMULATED OPERATIONS LAYOUT • ROUTE GEOMETRY REQUIRES ON-SITE VALIDATION
          </text>
        </svg>
      )}
    </div>
  )
}
