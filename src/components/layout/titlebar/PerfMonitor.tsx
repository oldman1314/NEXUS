import { useEffect, useRef, memo } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Activity, Clock, Cpu, Monitor, Gauge, HardDrive,
  FileCode, Layers, Wifi, Battery, BatteryCharging, BatteryWarning,
  Timer, Download, Code2, ExternalLink, Globe
} from 'lucide-react'
import { usePerformanceStore } from '@/stores/usePerformanceStore'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import './perf-monitor.css'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (!isFinite(bytes) || bytes < 0) return '\u2014'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '\u2014'
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return ms.toFixed(1) + ' ms'
  return (ms / 1000).toFixed(2) + ' s'
}

function getFpsColor(fps: number): string {
  if (fps >= 55) return 'var(--success, #34C759)'
  if (fps >= 30) return 'var(--warning, #FF9500)'
  return 'var(--error, #FF3B30)'
}

function getFpsHexColor(fps: number): string {
  if (fps >= 55) return '#34C759'
  if (fps >= 30) return '#FF9500'
  return '#FF3B30'
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getMemPercent(used: number, total: number): number {
  if (total === 0 || !isFinite(used) || !isFinite(total)) return 0
  return Math.min(100, Math.max(0, (used / total) * 100))
}

function getUtilColor(pct: number): string {
  if (pct > 80) return 'var(--error)'
  if (pct > 50) return 'var(--warning)'
  return 'var(--success)'
}

const FpsSparkline: React.FC<{ history: number[]; currentFps: number }> = memo(({ history, currentFps }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width === 0 || height === 0) return
    if (!isFinite(width) || !isFinite(height)) return

    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const maxFps = 60
    const minFps = 0
    const points = [...history, currentFps]
    if (points.length < 2) return

    ctx.beginPath()
    const hexColor = getFpsHexColor(currentFps)
    ctx.strokeStyle = hexColor
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'

    const stepX = width / (points.length - 1)
    points.forEach((fps, i) => {
      const x = i * stepX
      const y = height - ((Math.min(maxFps, Math.max(minFps, fps)) - minFps) / (maxFps - minFps)) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, hexToRgba(hexColor, 0.4))
    gradient.addColorStop(1, hexToRgba(hexColor, 0.05))
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }, [history, currentFps])

  return <canvas ref={canvasRef} className="perf-sparkline" />
})

FpsSparkline.displayName = 'FpsSparkline'

const StatCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color?: string
}> = memo(({ icon, label, value, sub, color }) => (
  <div className="perf-stat-card">
    <div className="perf-stat-icon" style={color ? { color } : undefined}>{icon}</div>
    <div className="perf-stat-info">
      <div className="perf-stat-value" style={color ? { color } : undefined}>{value}</div>
      <div className="perf-stat-label">{label}</div>
      {sub && <div className="perf-stat-sub">{sub}</div>}
    </div>
  </div>
))

StatCard.displayName = 'StatCard'

const ProgressBar: React.FC<{
  label: string
  used: string
  total: string
  pct: number
  color?: string
}> = memo(({ label, used, total, pct, color }) => (
  <div className="perf-progress-section">
    <div className="perf-progress-header">
      <span className="perf-progress-label">{label}</span>
      <span className="perf-progress-value">{used} / {total}</span>
    </div>
    <div className="perf-progress-bar">
      <div
        className="perf-progress-fill"
        style={{ width: `${pct}%`, background: color || getUtilColor(pct) }}
      />
    </div>
  </div>
))

ProgressBar.displayName = 'ProgressBar'

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = memo(({ icon, title }) => (
  <div className="perf-section-header">
    {icon}
    <span>{title}</span>
  </div>
))

SectionHeader.displayName = 'SectionHeader'

const ResourceBreakdown: React.FC<{
  scripts: number
  styles: number
  images: number
  fonts: number
  fetch: number
  others: number
  total: number
}> = memo(({ scripts, styles, images, fonts, fetch: fetches, others, total }) => {
  if (total === 0) return null
  const items = [
    { label: 'JS', value: scripts, color: 'var(--warning, #FF9500)' },
    { label: 'CSS', value: styles, color: 'var(--accent, #007AFF)' },
    { label: 'Img', value: images, color: 'var(--success, #34C759)' },
    { label: 'Font', value: fonts, color: 'var(--purple, #AF52DE)' },
    { label: 'Fetch', value: fetches, color: 'var(--mint, #00C7BE)' },
    { label: 'Other', value: others, color: 'var(--text-tertiary)' },
  ].filter((i) => i.value > 0)

  return (
    <div className="perf-resource-breakdown">
      {items.map((item) => (
        <div key={item.label} className="perf-resource-item">
          <span className="perf-resource-dot" style={{ background: item.color }} />
          <span className="perf-resource-label">{item.label}</span>
          <span className="perf-resource-count">{item.value}</span>
        </div>
      ))}
    </div>
  )
})

ResourceBreakdown.displayName = 'ResourceBreakdown'

const SystemInfoRow: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
}> = memo(({ icon, label, value }) => (
  <div className="perf-system-row">
    <div className="perf-system-row-icon">{icon}</div>
    <span className="perf-system-row-label">{label}</span>
    <span className="perf-system-row-value">{value}</span>
  </div>
))

SystemInfoRow.displayName = 'SystemInfoRow'

function PerfPanelInner() {
  const panelOpen = usePerformanceStore((s) => s.panelOpen)
  const setPanelOpen = usePerformanceStore((s) => s.setPanelOpen)
  const currentFps = usePerformanceStore((s) => s.currentFps)
  const fpsHistory = usePerformanceStore((s) => s.fpsHistory)
  const usedJsHeapSize = usePerformanceStore((s) => s.usedJsHeapSize)
  const totalJsHeapSize = usePerformanceStore((s) => s.totalJsHeapSize)
  const jsHeapSizeLimit = usePerformanceStore((s) => s.jsHeapSizeLimit)
  const domNodes = usePerformanceStore((s) => s.domNodes)
  const documentSize = usePerformanceStore((s) => s.documentSize)
  const jsEventListeners = usePerformanceStore((s) => s.jsEventListeners)
  const frameTime = usePerformanceStore((s) => s.frameTime)
  const pageLoadTime = usePerformanceStore((s) => s.pageLoadTime)
  const domContentLoaded = usePerformanceStore((s) => s.domContentLoaded)
  const firstPaint = usePerformanceStore((s) => s.firstPaint)
  const firstContentfulPaint = usePerformanceStore((s) => s.firstContentfulPaint)
  const totalResources = usePerformanceStore((s) => s.totalResources)
  const scriptResources = usePerformanceStore((s) => s.scriptResources)
  const styleResources = usePerformanceStore((s) => s.styleResources)
  const imageResources = usePerformanceStore((s) => s.imageResources)
  const fontResources = usePerformanceStore((s) => s.fontResources)
  const fetchResources = usePerformanceStore((s) => s.fetchResources)
  const otherResources = usePerformanceStore((s) => s.otherResources)
  const totalResourceSize = usePerformanceStore((s) => s.totalResourceSize)
  const longTaskCount = usePerformanceStore((s) => s.longTaskCount)
  const lastLongTaskTime = usePerformanceStore((s) => s.lastLongTaskTime)
  const batteryLevel = usePerformanceStore((s) => s.batteryLevel)
  const batteryCharging = usePerformanceStore((s) => s.batteryCharging)
  const batterySupported = usePerformanceStore((s) => s.batterySupported)
  const connectionType = usePerformanceStore((s) => s.connectionType)
  const connectionDownlink = usePerformanceStore((s) => s.connectionDownlink)
  const connectionRtt = usePerformanceStore((s) => s.connectionRtt)
  const connectionSupported = usePerformanceStore((s) => s.connectionSupported)

  const fpsColor = getFpsColor(currentFps)
  const panelRef = useRef<HTMLDivElement>(null)

  const cpuUtil = frameTime > 0 ? Math.min(100, (frameTime / 16.67) * 100) : 0
  const memPct = getMemPercent(usedJsHeapSize, jsHeapSizeLimit || totalJsHeapSize)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelOpen) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [panelOpen, setPanelOpen])

  if (!panelOpen) return null

  return createPortal(
    <div className="perf-overlay" onClick={() => setPanelOpen(false)}>
      <div
        ref={panelRef}
        className="perf-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="perf-panel-header">
          <div className="perf-panel-title">
            <Activity size={14} />
            <span>System Performance</span>
          </div>
          <button className="perf-close-btn" onClick={() => setPanelOpen(false)}>
            <X size={14} />
          </button>
        </div>

        <div className="perf-panel-body">
          {/* ── Frame & Render ── */}
          <div className="perf-fps-section">
            <div className="perf-fps-header">
              <span className="perf-section-title">FPS</span>
              <span className="perf-fps-value" style={{ color: fpsColor }}>
                {isFinite(currentFps) ? currentFps : '\u2014'}
              </span>
            </div>
            <FpsSparkline history={fpsHistory} currentFps={currentFps} />
          </div>

          <div className="perf-stats-grid">
            <StatCard
              icon={<Clock size={13} />}
              label="Frame Time"
              value={formatMs(frameTime)}
              color="var(--accent)"
            />
            <StatCard
              icon={<Gauge size={13} />}
              label="CPU Est."
              value={cpuUtil.toFixed(1) + '%'}
              sub={`Target: 16.67 ms`}
              color={getUtilColor(cpuUtil)}
            />
            <StatCard
              icon={<Monitor size={13} />}
              label="DOM Nodes"
              value={domNodes.toLocaleString()}
              color="var(--text-secondary)"
            />
            <StatCard
              icon={<Layers size={13} />}
              label="Doc Size"
              value={formatBytes(documentSize)}
              color="var(--text-secondary)"
            />
          </div>

          {/* ── Memory ── */}
          {jsHeapSizeLimit > 0 && (
            <ProgressBar
              label="JS Heap"
              used={formatBytes(usedJsHeapSize)}
              total={formatBytes(jsHeapSizeLimit)}
              pct={memPct}
            />
          )}

          {/* ── Page Load ── */}
          {pageLoadTime > 0 && (
            <div className="perf-section">
              <SectionHeader icon={<Timer size={12} />} title="Page Load" />
              <div className="perf-stats-grid">
                <StatCard icon={<Globe size={13} />} label="FP" value={formatMs(firstPaint)} color="var(--text-secondary)" />
                <StatCard icon={<Globe size={13} />} label="FCP" value={formatMs(firstContentfulPaint)} color="var(--text-secondary)" />
                <StatCard icon={<FileCode size={13} />} label="DOM Ready" value={formatMs(domContentLoaded)} color="var(--text-secondary)" />
                <StatCard icon={<ExternalLink size={13} />} label="Page Load" value={formatMs(pageLoadTime)} color="var(--text-secondary)" />
              </div>
            </div>
          )}

          {/* ── Resources ── */}
          {totalResources > 0 && (
            <div className="perf-section">
              <SectionHeader icon={<Download size={12} />} title="Resources" />
              <div className="perf-resource-summary">
                <span className="perf-resource-total">{totalResources} entries</span>
                <span className="perf-resource-size">{formatBytes(totalResourceSize)}</span>
              </div>
              <ResourceBreakdown
                scripts={scriptResources}
                styles={styleResources}
                images={imageResources}
                fonts={fontResources}
                fetch={fetchResources}
                others={otherResources}
                total={totalResources}
              />
            </div>
          )}

          {/* ── Long Tasks ── */}
          {longTaskCount > 0 && (
            <div className="perf-section">
              <SectionHeader icon={<Cpu size={12} />} title="Long Tasks" />
              <div className="perf-stats-grid">
                <StatCard icon={<Activity size={13} />} label="Count" value={String(longTaskCount)} color="var(--text-secondary)" />
                <StatCard icon={<Timer size={13} />} label="Last" value={formatMs(lastLongTaskTime)} color={longTaskCount > 5 ? 'var(--error)' : 'var(--text-secondary)'} />
              </div>
            </div>
          )}

          {/* ── System ── */}
          <div className="perf-section">
            <SectionHeader icon={<HardDrive size={12} />} title="System" />
            <div className="perf-system-list">
              <SystemInfoRow
                icon={<Code2 size={12} />}
                label="Inline handlers"
                value={String(jsEventListeners)}
              />
              {connectionSupported && (
                <SystemInfoRow
                  icon={<Wifi size={12} />}
                  label="Network"
                  value={`${connectionType}${connectionDownlink ? ' \u00b7 ' + connectionDownlink.toFixed(1) + ' Mbps' : ''}${connectionRtt ? ' \u00b7 ' + connectionRtt + 'ms RTT' : ''}`}
                />
              )}
              {batterySupported && batteryLevel !== null && (
                <SystemInfoRow
                  icon={
                    batteryCharging ? <BatteryCharging size={12} /> :
                    batteryLevel < 0.2 ? <BatteryWarning size={12} /> :
                    <Battery size={12} />
                  }
                  label="Battery"
                  value={`${Math.round(batteryLevel * 100)}%${batteryCharging ? ' (charging)' : ''}`}
                />
              )}
              {!connectionSupported && !batterySupported && (
                <div className="perf-empty">No system sensors available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function PerfMonitor() {
  const panelOpen = usePerformanceStore((s) => s.panelOpen)
  const updateMemory = usePerformanceStore((s) => s.updateMemory)
  const updateDomNodes = usePerformanceStore((s) => s.updateDomNodes)
  const updateDocumentSize = usePerformanceStore((s) => s.updateDocumentSize)
  const updateEventListeners = usePerformanceStore((s) => s.updateEventListeners)
  const updateNavTiming = usePerformanceStore((s) => s.updateNavTiming)
  const updateResources = usePerformanceStore((s) => s.updateResources)
  const updateConnection = usePerformanceStore((s) => s.updateConnection)
  const setCurrentFps = usePerformanceStore((s) => s.setCurrentFps)
  const pushFpsHistory = usePerformanceStore((s) => s.pushFpsHistory)
  const setFrameTime = usePerformanceStore((s) => s.setFrameTime)
  const pushFrameTimeHistory = usePerformanceStore((s) => s.pushFrameTimeHistory)

  const rafRef = useRef(0)
  const lastTimeRef = useRef(0)
  const frameCountRef = useRef(0)
  const fpsUpdateRef = useRef(0)
  const longTaskObserverRef = useRef<PerformanceObserver | null>(null)

  useEffect(() => {
    let running = true

    const measure = (timestamp: number) => {
      if (!running) return

      if (lastTimeRef.current > 0) {
        const delta = timestamp - lastTimeRef.current
        setFrameTime(delta)
        pushFrameTimeHistory(delta)
      }
      lastTimeRef.current = timestamp

      frameCountRef.current++
      const elapsed = timestamp - fpsUpdateRef.current
      if (elapsed >= 500) {
        const fps = elapsed > 0 ? (frameCountRef.current / elapsed) * 1000 : 0
        setCurrentFps(fps)
        pushFpsHistory(fps)
        frameCountRef.current = 0
        fpsUpdateRef.current = timestamp
      }

      rafRef.current = requestAnimationFrame(measure)
    }

    rafRef.current = requestAnimationFrame(measure)

    try {
      longTaskObserverRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration
          const state = usePerformanceStore.getState()
          usePerformanceStore.setState({
            longTaskCount: state.longTaskCount + 1,
            totalLongTaskTime: state.totalLongTaskTime + duration,
            lastLongTaskTime: duration,
          })
        }
      })
      longTaskObserverRef.current.observe({ type: 'longtask', buffered: true })
    } catch {
      // Long Task API not supported
    }

    const slowInterval = window.setInterval(() => {
      updateMemory()
      updateDomNodes()
      updateDocumentSize()
      updateEventListeners()
      updateNavTiming()
      updateResources()
      updateConnection()
    }, 3000)

    const batteryInterval = window.setInterval(async () => {
      try {
        const bm = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> }
        if (bm.getBattery) {
          const battery = await bm.getBattery()
          usePerformanceStore.setState({
            batteryLevel: battery.level,
            batteryCharging: battery.charging,
            batterySupported: true,
          })
        }
      } catch {
        // Battery API not supported
      }
    }, 10000)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
      longTaskObserverRef.current?.disconnect()
      clearInterval(slowInterval)
      clearInterval(batteryInterval)
    }
  }, [setCurrentFps, pushFpsHistory, setFrameTime, pushFrameTimeHistory, updateMemory, updateDomNodes, updateDocumentSize, updateEventListeners, updateNavTiming, updateResources, updateConnection])

  useEffect(() => {
    if (panelOpen) {
      updateMemory()
      updateDomNodes()
      updateDocumentSize()
      updateEventListeners()
      updateNavTiming()
      updateResources()
      updateConnection()
    }
  }, [panelOpen, updateMemory, updateDomNodes, updateDocumentSize, updateEventListeners, updateNavTiming, updateResources, updateConnection])

  return (
    <ErrorBoundary>
      <PerfPanelInner />
    </ErrorBoundary>
  )
}
