import React, { useState, useEffect, useRef } from 'react'
import { ZONE_IDS } from '../types'
import type { ZoneId } from '../types'

export interface ZoneConfig {
  id: ZoneId
  label: string
  capacity: number
  xPct: number // 0 to 100 percentage
  yPct: number // 0 to 100 percentage
  wPct: number // 5 to 100 percentage
  hPct: number // 5 to 100 percentage
}

/** A display-only connection in the temple operations schematic. */
export interface MapRoute {
  id: string
  from: ZoneId
  to: ZoneId
  enabled: boolean
}

export interface TempleConfig {
  templeName: string
  imageDataUrl?: string | null
  /** Original uploaded-image width ÷ height; keeps editor and dashboard aligned. */
  imageAspectRatio?: number
  routes?: MapRoute[]
  zones: Record<ZoneId, ZoneConfig>
}

export const DEFAULT_MAP_ROUTES: MapRoute[] = [
  { id: 'entry-queue-a', from: 'entry', to: 'queueA', enabled: true },
  { id: 'entry-queue-b', from: 'entry', to: 'queueB', enabled: true },
  { id: 'queue-a-darshan', from: 'queueA', to: 'darshan', enabled: true },
  { id: 'queue-b-darshan', from: 'queueB', to: 'darshan', enabled: true }
]

export const ZONE_ACCENTS: Record<ZoneId, { border: string; bg: string; text: string; badge: string }> = {
  entry: { border: '#38bdf8', bg: 'rgba(56, 189, 248, 0.22)', text: '#38bdf8', badge: '#0369a1' },
  queueA: { border: '#34d399', bg: 'rgba(52, 211, 153, 0.22)', text: '#34d399', badge: '#047857' },
  queueB: { border: '#fbbf24', bg: 'rgba(251, 191, 36, 0.22)', text: '#fbbf24', badge: '#b45309' },
  darshan: { border: '#f472b6', bg: 'rgba(244, 114, 182, 0.22)', text: '#f472b6', badge: '#be185d' }
}

export const DEFAULT_TEMPLE_CONFIG: TempleConfig = {
  templeName: 'Somnath Temple Complex',
  imageDataUrl: null,
  routes: DEFAULT_MAP_ROUTES,
  zones: {
    entry: { id: 'entry', label: 'Main Entry Gate', capacity: 150, xPct: 5, yPct: 15, wPct: 26, hPct: 35 },
    queueA: { id: 'queueA', label: 'Queue Complex A', capacity: 350, xPct: 35, yPct: 15, wPct: 32, hPct: 50 },
    queueB: { id: 'queueB', label: 'Holding Queue B', capacity: 200, xPct: 5, yPct: 55, wPct: 26, hPct: 35 },
    darshan: { id: 'darshan', label: 'Darshan Sanctum', capacity: 180, xPct: 70, yPct: 30, wPct: 25, hPct: 45 }
  }
}

const STORAGE_KEY_CONFIG = 'darshanflow_temple_config'
const STORAGE_KEY_THEME = 'darshanflow_theme'
const MIN_ZONE_SIZE_PCT = 10
const MAX_ZONE_CAPACITY = 5000

/** Validate the persisted/imported shape before it reaches the interactive editor. */
export function isValidTempleConfig(value: unknown): value is TempleConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const candidate = value as Partial<TempleConfig>
  if (typeof candidate.templeName !== 'string' || candidate.templeName.trim() === '') return false
  if (candidate.imageDataUrl !== undefined && candidate.imageDataUrl !== null && typeof candidate.imageDataUrl !== 'string') {
    return false
  }
  if (candidate.imageAspectRatio !== undefined
    && (typeof candidate.imageAspectRatio !== 'number'
      || !Number.isFinite(candidate.imageAspectRatio)
      || candidate.imageAspectRatio < 0.25
      || candidate.imageAspectRatio > 4)) {
    return false
  }
  if (candidate.routes !== undefined && (!Array.isArray(candidate.routes) || !candidate.routes.every((route) => {
    return route
      && typeof route.id === 'string'
      && ZONE_IDS.includes(route.from)
      && ZONE_IDS.includes(route.to)
      && route.from !== route.to
      && typeof route.enabled === 'boolean'
  }))) return false
  if (!candidate.zones || typeof candidate.zones !== 'object' || Array.isArray(candidate.zones)) return false

  return ZONE_IDS.every((zoneId) => {
    const zone = candidate.zones?.[zoneId]
    if (!zone || typeof zone !== 'object') return false

    const candidateZone = zone as Partial<ZoneConfig>
    const isFiniteNumber = (input: unknown): input is number => typeof input === 'number' && Number.isFinite(input)
    return candidateZone.id === zoneId
      && typeof candidateZone.label === 'string'
      && candidateZone.label.trim() !== ''
      && isFiniteNumber(candidateZone.capacity)
      && candidateZone.capacity >= 1
      && candidateZone.capacity <= MAX_ZONE_CAPACITY
      && isFiniteNumber(candidateZone.xPct)
      && isFiniteNumber(candidateZone.yPct)
      && isFiniteNumber(candidateZone.wPct)
      && isFiniteNumber(candidateZone.hPct)
      && candidateZone.xPct >= 0
      && candidateZone.yPct >= 0
      && candidateZone.wPct >= MIN_ZONE_SIZE_PCT
      && candidateZone.hPct >= MIN_ZONE_SIZE_PCT
      && candidateZone.xPct + candidateZone.wPct <= 100
      && candidateZone.yPct + candidateZone.hPct <= 100
  })
}

/** Retrieve saved configuration from localStorage, or return default */
export function getStoredTempleConfig(): TempleConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (!raw) return DEFAULT_TEMPLE_CONFIG
    const parsed: unknown = JSON.parse(raw)
    if (isValidTempleConfig(parsed)) {
      return {
        ...parsed,
        routes: parsed.routes?.length ? parsed.routes : DEFAULT_MAP_ROUTES.map((route) => ({ ...route }))
      }
    }
  } catch {
    // fallback if corrupted
  }
  return DEFAULT_TEMPLE_CONFIG
}

/** Save configuration to localStorage */
export function saveStoredTempleConfig(config: TempleConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
  } catch (err) {
    console.warn('Failed to save temple config to localStorage:', err)
  }
}

/** Get theme from localStorage, defaulting to 'dark' */
export function getStoredTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // fallback
  }
  return 'dark'
}

/** Apply theme attribute to document element and persist */
export function applyAppTheme(theme: 'dark' | 'light'): void {
  try {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY_THEME, theme)
  } catch (err) {
    console.warn('Failed to apply theme:', err)
  }
}

export interface TempleSetupProps {
  config: TempleConfig
  onChange: (next: TempleConfig) => void
  isOpen?: boolean
  onClose?: () => void
}

export function TempleSetup({ config: incomingConfig, onChange, isOpen = false, onClose }: TempleSetupProps) {
  const config = incomingConfig
  const [activeZone, setActiveZone] = useState<ZoneId>('entry')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredTheme())
  const isDraggingOver = false
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    zoneId: ZoneId
    mode: 'move' | 'resize'
    startX: number
    startY: number
    initXPct: number
    initYPct: number
    initWPct: number
    initHPct: number
  } | null>(null)

  // Initialize theme on mount
  useEffect(() => {
    applyAppTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyAppTheme(nextTheme)
    showMessage(`Switched to ${nextTheme} theme`)
  }

  const showMessage = (msg: string) => {
    setStatusMessage(msg)
    window.setTimeout(() => setStatusMessage(null), 3000)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, templeName: e.target.value })
  }

  const handleZoneChange = (zoneId: ZoneId, patch: Partial<ZoneConfig>) => {
    onChange({
      ...config,
      zones: {
        ...config.zones,
        [zoneId]: { ...config.zones[zoneId], ...patch }
      }
    })
  }

  const routes = config.routes ?? DEFAULT_MAP_ROUTES
  const handleRouteChange = (index: number, patch: Partial<MapRoute>) => {
    onChange({ ...config, routes: routes.map((route, routeIndex) => routeIndex === index ? { ...route, ...patch } : route) })
  }
  const addRoute = () => {
    if (routes.length >= 6) return showMessage('Keep the demo map to six routes or fewer for readability.')
    onChange({ ...config, routes: [...routes, { id: `route-${Date.now()}`, from: 'entry', to: 'queueA', enabled: true }] })
  }
  const removeRoute = (index: number) => {
    onChange({ ...config, routes: routes.filter((_, routeIndex) => routeIndex !== index) })
  }

  // Interactive mouse / pointer dragging for boxes and resize handles
  const handlePointerDown = (
    e: React.PointerEvent,
    zoneId: ZoneId,
    mode: 'move' | 'resize'
  ) => {
    e.stopPropagation()
    setActiveZone(zoneId)
    const zone = config.zones[zoneId]
    dragRef.current = {
      zoneId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initXPct: zone.xPct,
      initYPct: zone.yPct,
      initWPct: zone.wPct,
      initHPct: zone.hPct
    }
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const { zoneId, mode, startX, startY, initXPct, initYPct, initWPct, initHPct } = dragRef.current
    const dxPct = ((e.clientX - startX) / rect.width) * 100
    const dyPct = ((e.clientY - startY) / rect.height) * 100

    if (mode === 'move') {
      const currentW = initWPct
      const currentH = initHPct
      const newX = Math.max(0, Math.min(100 - currentW, Math.round(initXPct + dxPct)))
      const newY = Math.max(0, Math.min(100 - currentH, Math.round(initYPct + dyPct)))
      handleZoneChange(zoneId, { xPct: newX, yPct: newY })
    } else if (mode === 'resize') {
      const newW = Math.max(10, Math.min(100 - initXPct, Math.round(initWPct + dxPct)))
      const newH = Math.max(10, Math.min(100 - initYPct, Math.round(initHPct + dyPct)))
      handleZoneChange(zoneId, { wPct: newW, hPct: newH })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        const target = e.currentTarget as HTMLElement
        target.releasePointerCapture(e.pointerId)
      } catch {
        // pointer may have unmounted
      }
      dragRef.current = null
    }
  }

  // Storage & Export / Import operations
  const handleSaveToBrowser = () => {
    saveStoredTempleConfig(config)
    showMessage('Configuration saved to browser!')
  }

  const handleApplyAndClose = () => {
    saveStoredTempleConfig(config)
    showMessage('Calibration saved to this browser')
    onClose?.()
  }

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', `${config.templeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_setup.json`)
    dlAnchor.click()
    showMessage('Configuration exported as JSON')
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string)
        if (isValidTempleConfig(parsed)) {
          onChange(parsed)
          showMessage('Imported layout from JSON')
        } else {
          alert('Invalid layout JSON format.')
        }
      } catch {
        alert('Could not parse JSON file.')
      }
    }
    reader.readAsText(file)
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset temple configuration to default 4-zone schematic?')) {
      onChange(DEFAULT_TEMPLE_CONFIG)
      saveStoredTempleConfig(DEFAULT_TEMPLE_CONFIG)
      showMessage('Reset to factory defaults')
    }
  }

  if (!isOpen) return null

  const selectedZoneConfig = config.zones[activeZone]
  const zoneIds: ZoneId[] = ['entry', 'queueA', 'queueB', 'darshan']

  return (
    <div className="temple-setup-backdrop" role="dialog" aria-modal="true" aria-labelledby="temple-setup-title">
      <div className="temple-setup-modal card">
        {/* Header bar */}
        <div className="setup-header">
          <div className="setup-title-box">
            <span className="eyebrow">DEVELOPER B • SPATIAL CONFIGURATION</span>
            <h2 id="temple-setup-title">Operations Layout Builder</h2>
          </div>
          <div className="setup-header-actions">
            {/* Light / Dark theme toggle */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              aria-label="Toggle visual theme"
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            {onClose && (
              <button
                type="button"
                className="setup-close-btn"
                onClick={onClose}
                aria-label="Close setup modal"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {statusMessage && (
          <div className="setup-status-banner" role="status">
            <span>✓</span> {statusMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="setup-body">
          {/* Left Column: Visual Canvas & Overlay Layout */}
          <div className="setup-canvas-col">
            <div className="setup-canvas-bar">
              <span className="canvas-hint">
                🧭 Move each zone to match this temple's operational flow
              </span>
              <span className="badge-pill">4 Fixed Zones</span>
            </div>

            <div
              ref={containerRef}
              className={`setup-canvas-container ${isDraggingOver ? 'dragging-over' : ''}`}
              style={{ aspectRatio: 16 / 9 }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div className="setup-schematic-bg">
                <div className="schematic-watermark">
                  <span>OPERATIONS LAYOUT</span>
                  <small>Drag zones to show local crowd movement. Routes are configured on the right.</small>
                </div>
              </div>

              {/* 4 Interactive Zone Overlays */}
              {zoneIds.map((id) => {
                const z = config.zones[id]
                const accent = ZONE_ACCENTS[id]
                const isSelected = activeZone === id

                return (
                  <div
                    key={id}
                    className={`setup-zone-box ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${z.xPct}%`,
                      top: `${z.yPct}%`,
                      width: `${z.wPct}%`,
                      height: `${z.hPct}%`,
                      borderColor: accent.border,
                      backgroundColor: accent.bg
                    }}
                    onPointerDown={(e) => handlePointerDown(e, id, 'move')}
                    onClick={() => setActiveZone(id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setActiveZone(id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`Zone ${z.label}`}
                  >
                    <div className="zone-box-header" style={{ background: accent.border }}>
                      <span className="zone-box-id">{id}</span>
                      <span className="zone-box-label">{z.label}</span>
                    </div>

                    <div className="zone-box-body">
                      <strong>Cap: {z.capacity}</strong>
                      <small>{z.wPct}% × {z.hPct}%</small>
                    </div>

                    {/* Resize handle in bottom-right corner */}
                    <div
                      className="zone-resize-handle"
                      style={{ background: accent.border }}
                      onPointerDown={(e) => handlePointerDown(e, id, 'resize')}
                      title="Drag to resize zone"
                    />
                  </div>
                )
              })}
            </div>

            {/* Clear operational guidance */}
            <div className="setup-upload-toolbar">
              <span className="privacy-note">1. Drag or resize the four monitored zones  2. Define display routes  3. Apply &amp; Return</span>
              <span className="privacy-note">Layout routes explain the demo map; they do not automatically change real-world routing or simulation rules.</span>
            </div>
          </div>

          {/* Right Column: Zone Calibration & Inspector */}
          <div className="setup-inspector-col">
            <div className="inspector-card">
              <label className="form-label" htmlFor="temple-name-input">
                Temple / Complex Name
              </label>
              <input
                id="temple-name-input"
                className="form-input"
                type="text"
                value={config.templeName}
                onChange={handleNameChange}
                placeholder="e.g. Somnath Temple Complex"
              />
            </div>

            {/* Zone Selector Tabs */}
            <div className="zone-tab-selector">
              <span className="form-label">Calibrate Zone</span>
              <div className="zone-tab-buttons">
                {zoneIds.map((id) => {
                  const z = config.zones[id]
                  const accent = ZONE_ACCENTS[id]
                  const isSelected = activeZone === id
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`zone-tab-btn ${isSelected ? 'active' : ''}`}
                      style={{
                        borderColor: isSelected ? accent.border : undefined,
                        borderLeftWidth: '4px',
                        borderLeftColor: accent.border
                      }}
                      onClick={() => setActiveZone(id)}
                    >
                      <b>{id}</b>
                      <span>{z.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Zone Controls */}
            {selectedZoneConfig && (
              <div className="zone-config-panel">
                <div className="panel-title">
                  <span
                    className="zone-indicator-dot"
                    style={{ background: ZONE_ACCENTS[activeZone].border }}
                  />
                  <strong>Edit Zone: {activeZone}</strong>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Display Label</label>
                    <input
                      className="form-input"
                      type="text"
                      value={selectedZoneConfig.label}
                      onChange={(e) =>
                        handleZoneChange(activeZone, { label: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Configured Capacity</label>
                    <input
                      className="form-input"
                      type="number"
                      min={10}
                      max={5000}
                      step={10}
                      value={selectedZoneConfig.capacity}
                      onChange={(e) =>
                        handleZoneChange(activeZone, {
                          capacity: Math.max(1, Number(e.target.value))
                        })
                      }
                    />
                  </div>
                </div>

                {/* Precision Sliders */}
                <div className="slider-controls">
                  <div className="slider-row">
                    <label>
                      X Position: <strong>{selectedZoneConfig.xPct}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={100 - selectedZoneConfig.wPct}
                      value={selectedZoneConfig.xPct}
                      onChange={(e) =>
                        handleZoneChange(activeZone, { xPct: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="slider-row">
                    <label>
                      Y Position: <strong>{selectedZoneConfig.yPct}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={100 - selectedZoneConfig.hPct}
                      value={selectedZoneConfig.yPct}
                      onChange={(e) =>
                        handleZoneChange(activeZone, { yPct: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="slider-row">
                    <label>
                      Width: <strong>{selectedZoneConfig.wPct}%</strong>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max={100 - selectedZoneConfig.xPct}
                      value={selectedZoneConfig.wPct}
                      onChange={(e) =>
                        handleZoneChange(activeZone, { wPct: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="slider-row">
                    <label>
                      Height: <strong>{selectedZoneConfig.hPct}%</strong>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max={100 - selectedZoneConfig.yPct}
                      value={selectedZoneConfig.hPct}
                      onChange={(e) =>
                        handleZoneChange(activeZone, { hPct: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="route-config-panel">
                  <div className="panel-title">
                    <span className="zone-indicator-dot" style={{ background: '#86b4c7' }} />
                    <strong>Display routes</strong>
                  </div>
                  <p className="route-help">Show the routes people normally take between the monitored zones.</p>
                  <div className="route-list">
                    {routes.map((route, index) => (
                      <div className="route-row" key={route.id}>
                        <label className="route-enabled"><input type="checkbox" checked={route.enabled} onChange={(event) => handleRouteChange(index, { enabled: event.target.checked })} /> show</label>
                        <select value={route.from} onChange={(event) => handleRouteChange(index, { from: event.target.value as ZoneId })} aria-label={`Route ${index + 1} from`}>
                          {zoneIds.map((id) => <option key={id} value={id}>{config.zones[id].label}</option>)}
                        </select>
                        <span>→</span>
                        <select value={route.to} onChange={(event) => handleRouteChange(index, { to: event.target.value as ZoneId })} aria-label={`Route ${index + 1} to`}>
                          {zoneIds.filter((id) => id !== route.from).map((id) => <option key={id} value={id}>{config.zones[id].label}</option>)}
                        </select>
                        <button type="button" className="route-remove" onClick={() => removeRoute(index)} aria-label={`Remove route ${index + 1}`}>×</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-outline route-add" onClick={addRoute}>+ Add display route</button>
                </div>
              </div>
            )}

            {/* Storage & Preset Actions */}
            <div className="setup-actions-footer">
              <div className="actions-button-grid">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveToBrowser}
                >
                  💾 Save to Browser
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportJSON}
                >
                  ⤓ Export JSON
                </button>
                <label className="btn btn-outline file-label-btn">
                  ⤒ Import JSON
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportJSON}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-outline text-warn"
                  onClick={handleResetDefaults}
                >
                  ↺ Reset
                </button>
              </div>

              {onClose && (
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  style={{ marginTop: '12px' }}
                  onClick={handleApplyAndClose}
                >
                  Apply & Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
