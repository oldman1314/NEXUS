interface PerformanceMetric {
  operation: string
  startTime: number
  domUpdateTime: number
  firstPaintTime: number
  endTime: number
  duration: number
  fpsDrop: number
}

const PERFORMANCE_THRESHOLD = 100

class PerformanceProfiler {
  private metrics: PerformanceMetric[] = []
  private currentMetric: PerformanceMetric | null = null
  private fpsBefore: number = 60
  private isEnabled: boolean = true
  private frameCount: number = 0
  private lastFpsUpdate: number = performance.now()
  private currentFps: number = 60
  private fpsMonitoringActive: boolean = false

  constructor() {
    this.isEnabled = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? process.env.NODE_ENV === 'development'
    this.startFPSMonitoring()
  }

  private startFPSMonitoring(): void {
    if (this.fpsMonitoringActive) return

    const measureFrame = (timestamp: number) => {
      this.frameCount++
      const elapsed = timestamp - this.lastFpsUpdate

      if (elapsed >= 500) {
        this.currentFps = (this.frameCount / elapsed) * 1000
        this.frameCount = 0
        this.lastFpsUpdate = timestamp
      }

      this.fpsMonitoringActive = true
      requestAnimationFrame(measureFrame)
    }

    requestAnimationFrame(measureFrame)
  }

  private getRealTimeFPS(): number {
    if (this.frameCount === 0) return this.currentFps

    const now = performance.now()
    const elapsed = now - this.lastFpsUpdate
    if (elapsed === 0) return this.currentFps

    return (this.frameCount / elapsed) * 1000
  }

  startMeasure(operation: string): void {
    if (!this.isEnabled) return

    this.fpsBefore = this.getRealTimeFPS()

    this.currentMetric = {
      operation,
      startTime: performance.now(),
      domUpdateTime: 0,
      firstPaintTime: 0,
      endTime: 0,
      duration: 0,
      fpsDrop: 0
    }

    console.log(
      `%c[Perf] ⏱️ ${operation} started`,
      'color: #007aff; font-weight: bold;'
    )
  }

  markDOMUpdateComplete(): void {
    if (!this.isEnabled || !this.currentMetric) return

    this.currentMetric.domUpdateTime = performance.now()
    const elapsed = this.currentMetric.domUpdateTime - this.currentMetric.startTime

    console.log(
      `%c[Perf] ✅ DOM updated in ${elapsed.toFixed(2)}ms`,
      'color: #34c759; font-weight: normal;'
    )
  }

  markFirstPaint(): void {
    if (!this.isEnabled || !this.currentMetric) return

    requestAnimationFrame(() => {
      if (this.currentMetric) {
        this.currentMetric.firstPaintTime = performance.now()
        const paintElapsed = this.currentMetric.firstPaintTime - this.currentMetric.startTime

        console.log(
          `%c[Perf] 🎨 First paint in ${paintElapsed.toFixed(2)}ms`,
          'color: #af52de; font-weight: normal;'
        )

        this.endMeasure()
      }
    })
  }

  endMeasure(): void {
    if (!this.isEnabled || !this.currentMetric) return

    this.currentMetric.endTime = performance.now()
    this.currentMetric.duration = this.currentMetric.endTime - this.currentMetric.startTime

    const fpsAfter = this.getRealTimeFPS()
    this.currentMetric.fpsDrop = Math.max(0, this.fpsBefore - fpsAfter)

    this.metrics.push(this.currentMetric)

    const { operation, duration, fpsDrop } = this.currentMetric

    const isSlow = duration > PERFORMANCE_THRESHOLD
    const emoji = isSlow ? '⚠️' : '✅'
    const color = isSlow ? '#ff3b30' : '#34c759'

    console.log(
      `%c[Perf] ${emoji} ${operation} completed in ${duration.toFixed(2)}ms (FPS: ${fpsAfter.toFixed(1)}, drop: ${fpsDrop.toFixed(1)})`,
      `color: ${color}; font-weight: bold;${isSlow ? ' background: #fff0f0; padding: 2px 4px; border-radius: 2px;' : ''}`
    )

    if (isSlow) {
      console.warn(
        `[Perf] 🚨 Performance warning: ${operation} took ${duration.toFixed(2)}ms (threshold: ${PERFORMANCE_THRESHOLD}ms)\n` +
        'Possible bottlenecks:\n' +
        '- Too many backdrop-filter elements active\n' +
        '- Complex CSS transitions on many elements\n' +
        '- Synchronous layout thrashing\n' +
        '- Consider using Performance Tier system to reduce visual complexity'
      )
    }

    this.currentMetric = null
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getLastMetric(): PerformanceMetric | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  clearMetrics(): void {
    this.metrics = []
  }

  getAverageDuration(operation?: string): number {
    const filtered = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics

    if (filtered.length === 0) return 0

    const sum = filtered.reduce((acc, m) => acc + m.duration, 0)
    return sum / filtered.length
  }

  printSummary(): void {
    if (!this.isEnabled || this.metrics.length === 0) {
      console.log('[Perf] No metrics recorded')
      return
    }

    console.group('%c📊 Performance Summary', 'color: #007aff; font-size: 14px; font-weight: bold;')

    const operations = [...new Set(this.metrics.map(m => m.operation))]

    operations.forEach(op => {
      const opMetrics = this.metrics.filter(m => m.operation === op)
      const avg = this.getAverageDuration(op)
      const max = Math.max(...opMetrics.map(m => m.duration))
      const min = Math.min(...opMetrics.map(m => m.duration))

      console.log(
        `%c${op}:`,
        'font-weight: bold;'
      )
      console.log(`  Average: ${avg.toFixed(2)}ms`)
      console.log(`  Min: ${min.toFixed(2)}ms`)
      console.log(`  Max: ${max.toFixed(2)}ms`)
      console.log(`  Count: ${opMetrics.length}`)
    })

    console.groupEnd()
  }
}

export const perfProfiler = new PerformanceProfiler()
export default perfProfiler

interface ComponentRenderStat {
  name: string
  count: number
  avgMs: number
  maxMs: number
  minMs: number
  totalMs: number
}

class ComponentRenderTracker {
  private renderTimes = new Map<string, number[]>()

  trackRender(name: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      const times = this.renderTimes.get(name) ?? []
      times.push(duration)
      this.renderTimes.set(name, times)
    }
  }

  getStats(): ComponentRenderStat[] {
    return Array.from(this.renderTimes.entries()).map(([name, times]) => ({
      name,
      count: times.length,
      avgMs: times.reduce((a, b) => a + b, 0) / times.length,
      maxMs: Math.max(...times),
      minMs: Math.min(...times),
      totalMs: times.reduce((a, b) => a + b, 0),
    }))
  }

  printComparison(before: ComponentRenderTracker, label?: string): void {
    const afterStats = this.getStats()
    const beforeStats = before.getStats()
    const beforeMap = new Map(beforeStats.map((s) => [s.name, s]))

    console.group(`%c📊 Component Render Comparison${label ? ` - ${label}` : ''}`, 'color: #007aff; font-size: 14px; font-weight: bold;')

    afterStats.forEach((after) => {
      const before = beforeMap.get(after.name)
      if (before) {
        const diff = before.avgMs - after.avgMs
        const pct = before.avgMs > 0 ? ((diff / before.avgMs) * 100).toFixed(1) : '0'
        const emoji = diff > 0 ? '🟢' : diff < 0 ? '🔴' : '⚪'
        console.log(
          `${emoji} ${after.name}: ${before.avgMs.toFixed(2)}ms → ${after.avgMs.toFixed(2)}ms (${diff > 0 ? '+' : ''}${pct}%) [${after.count} renders]`
        )
      } else {
        console.log(`🆕 ${after.name}: ${after.avgMs.toFixed(2)}ms avg [${after.count} renders]`)
      }
    })

    console.groupEnd()
  }

  clear(): void {
    this.renderTimes.clear()
  }
}

export const componentTracker = new ComponentRenderTracker()
export { ComponentRenderTracker }
