import type { ZoneId, Zones } from '../types'
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
  const hasCustomImage = Boolean(config?.imageDataUrl)

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

        {onOpenSetup && (
          <button
            type="button"
            className="map-setup-btn"
            onClick={onOpenSetup}
            title="Configure floor plan and zone positions"
          >
            ⚙ Calibrate Map
          </button>
        )}
      </div>

      {/* Main View: Custom Uploaded Floor Plan OR Default SVG Schematic */}
      {hasCustomImage && config?.imageDataUrl ? (
        <div className="custom-map-viewport">
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

          {/* Grid background */}
          <rect width="670" height="354" fill="#111c2a" rx="12" />
          <rect width="670" height="354" fill="url(#mapgrid)" rx="12" />

          {/* Directional Flow Pathways */}
          <path
            d="M 112 160 L 112 184"
            stroke="#6f8da4"
            strokeWidth="3"
            strokeDasharray="6 4"
            markerEnd="url(#arrow)"
            fill="none"
          />
          <path
            d="M 200 100 L 224 100"
            stroke="#6f8da4"
            strokeWidth="3"
            strokeDasharray="6 4"
            markerEnd="url(#arrow)"
            fill="none"
          />
          <path
            d="M 200 250 L 224 220"
            stroke="#6f8da4"
            strokeWidth="3"
            strokeDasharray="6 4"
            markerEnd="url(#arrow)"
            fill="none"
          />
          <path
            d="M 446 130 L 470 130"
            stroke="#6f8da4"
            strokeWidth="3"
            strokeDasharray="6 4"
            markerEnd="url(#arrow)"
            fill="none"
          />
          <path
            d="M 446 213 L 470 213"
            stroke="#6f8da4"
            strokeWidth="3"
            strokeDasharray="6 4"
            markerEnd="url(#arrow)"
            fill="none"
          />

          {/* Zone Nodes */}
          {zoneIds.map((id) => {
            const r = defaultRectangles[id]
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

          {/* Watermark disclaimer */}
          <text x="25" y="340" fontSize="11" fill="#adc2d0">
            SIMULATED COUNTS • schematic layout, not real navigation
          </text>
        </svg>
      )}
    </div>
  )
}
