/* OWNER: DEVELOPER B. High-contrast responsive forecast comparison chart. */
import type { Forecast } from '../types'

export interface ForecastChartProps {
  baseline: Forecast
  alternative: Forecast
  capacity: number
}

export function ForecastChart({ baseline, alternative, capacity }: ForecastChartProps) {
  const baseSnapshots = baseline?.snapshots ?? []
  const altSnapshots = alternative?.snapshots ?? []

  if (baseSnapshots.length === 0 || altSnapshots.length === 0) {
    return (
      <div className="forecast-chart-container">
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span>Generating forecast projections...</span>
        </div>
      </div>
    )
  }

  const baseVals = baseSnapshots.map((s) => s.occupancy.queueA)
  const altVals = altSnapshots.map((s) => s.occupancy.queueA)

  const thresholdVal = Math.round(capacity * 0.9)
  const maxVal = Math.max(capacity * 1.15, ...baseVals, ...altVals, 1)

  // Chart dimensions
  const chartW = 630
  const chartH = 210
  const padLeft = 45
  const padRight = 35
  const padTop = 26
  const padBottom = 32
  const plotW = chartW - padLeft - padRight
  const plotH = chartH - padTop - padBottom

  const getX = (index: number, total: number) =>
    total <= 1 ? padLeft : padLeft + (index / (total - 1)) * plotW

  const getY = (val: number) =>
    padTop + plotH - (Math.max(0, val) / maxVal) * plotH

  // Coordinates strings
  const basePoints = baseVals.map((v, i) => `${getX(i, baseVals.length)},${getY(v)}`).join(' ')
  const altPoints = altVals.map((v, i) => `${getX(i, altVals.length)},${getY(v)}`).join(' ')

  // Area under alternative curve
  const altArea = `${getX(0, altVals.length)},${padTop + plotH} ${altPoints} ${getX(
    altVals.length - 1,
    altVals.length
  )},${padTop + plotH}`

  const thresholdY = getY(thresholdVal)
  const finalBase = baseVals[baseVals.length - 1] ?? 0
  const finalAlt = altVals[altVals.length - 1] ?? 0

  // Y-axis grid increments
  const yTicks = [
    { val: 0, label: '0' },
    { val: Math.round(maxVal * 0.5), label: String(Math.round(maxVal * 0.5)) },
    { val: thresholdVal, label: `${thresholdVal}` },
    { val: Math.round(maxVal), label: String(Math.round(maxVal)) }
  ]

  return (
    <div className="forecast-chart-container">
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="forecast-svg"
        role="img"
        aria-label={`Forecast comparison: Primary queue projected from ${baseVals[0] ?? 0} to ${finalBase} (baseline) vs ${finalAlt} (intervention).`}
      >
        <defs>
          {/* Subtle teal area gradient */}
          <linearGradient id="altAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#56cba9" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#56cba9" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Background Grid Lines */}
        {yTicks.map((tick, idx) => {
          const y = getY(tick.val)
          return (
            <g key={idx} className="chart-grid-row">
              <line
                x1={padLeft}
                y1={y}
                x2={chartW - padRight}
                y2={y}
                stroke="var(--border-subtle, #273548)"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-muted, #7c96a8)"
                fontSize="10"
                fontFamily="'DM Sans', sans-serif"
              >
                {tick.label}
              </text>
            </g>
          )
        })}

        {/* 90% Capacity Threshold Line */}
        <line
          x1={padLeft}
          y1={thresholdY}
          x2={chartW - padRight}
          y2={thresholdY}
          stroke="#f1bd7b"
          strokeWidth="1.6"
          strokeDasharray="6 4"
        />
        <text
          x={chartW - padRight}
          y={thresholdY - 6}
          textAnchor="end"
          fill="#f1bd7b"
          fontSize="10"
          fontWeight="700"
          fontFamily="'DM Sans', sans-serif"
        >
          90% Threshold ({thresholdVal})
        </text>

        {/* Shaded Area for Selected Option */}
        <polygon points={altArea} fill="url(#altAreaGrad)" />

        {/* Baseline (No Intervention) Polyline */}
        <polyline
          points={basePoints}
          fill="none"
          stroke="#f0837f"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Alternative (Selected Option) Polyline */}
        <polyline
          points={altPoints}
          fill="none"
          stroke="#56cba9"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Point Markers for Baseline */}
        {baseSnapshots.map((s, idx) => {
          const cx = getX(idx, baseSnapshots.length)
          const cy = getY(s.occupancy.queueA)
          return (
            <circle
              key={`base-${idx}`}
              cx={cx}
              cy={cy}
              r="3.5"
              fill="#f0837f"
              stroke="var(--bg-card, #111b29)"
              strokeWidth="1.5"
              className="chart-dot"
            >
              <title>{`T+${s.minute}m Baseline: ${s.occupancy.queueA} visitors`}</title>
            </circle>
          )
        })}

        {/* Data Point Markers for Alternative */}
        {altSnapshots.map((s, idx) => {
          const cx = getX(idx, altSnapshots.length)
          const cy = getY(s.occupancy.queueA)
          return (
            <circle
              key={`alt-${idx}`}
              cx={cx}
              cy={cy}
              r="4"
              fill="#56cba9"
              stroke="var(--bg-card, #111b29)"
              strokeWidth="1.8"
              className="chart-dot"
            >
              <title>{`T+${s.minute}m Selected Option: ${s.occupancy.queueA} visitors`}</title>
            </circle>
          )
        })}

        {/* X-Axis Labels */}
        <text
          x={padLeft}
          y={chartH - 8}
          fill="var(--text-secondary, #9bb0c1)"
          fontSize="11"
          fontWeight="600"
          fontFamily="'DM Sans', sans-serif"
        >
          T+0 MIN (NOW)
        </text>

        {baseline.horizon > 5 && (
          <text
            x={padLeft + plotW / 2}
            y={chartH - 8}
            textAnchor="middle"
            fill="var(--text-muted, #7c96a8)"
            fontSize="10"
            fontFamily="'DM Sans', sans-serif"
          >
            T+{Math.round(baseline.horizon / 2)} MIN
          </text>
        )}

        <text
          x={chartW - padRight}
          y={chartH - 8}
          textAnchor="end"
          fill="var(--text-secondary, #9bb0c1)"
          fontSize="11"
          fontWeight="600"
          fontFamily="'DM Sans', sans-serif"
        >
          T+{baseline.horizon} MIN
        </text>
      </svg>

      {/* Dynamic Visual Legend */}
      <div className="chart-legend">
        <span className="legend-entry">
          <i className="legend-dot" style={{ background: '#f0837f' }} />
          <span>No intervention (ends at <strong>{finalBase}</strong>)</span>
        </span>
        <span className="legend-entry">
          <i className="legend-dot" style={{ background: '#56cba9' }} />
          <span>Selected option (ends at <strong>{finalAlt}</strong>)</span>
        </span>
        <span className="legend-entry">
          <i className="legend-dash" style={{ borderColor: '#f1bd7b' }} />
          <span>90% Alert threshold</span>
        </span>
      </div>
    </div>
  )
}
