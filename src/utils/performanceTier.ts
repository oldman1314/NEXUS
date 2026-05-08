export type PerformanceTier = 1 | 2 | 3

interface FPSMonitor {
  frames: number[]
  lastTime: number
  rafId: number | null
  sampleInterval: number
  debounceCount: number
  pendingTier: PerformanceTier | null
}

const fpsMonitor: FPSMonitor = {
  frames: [],
  lastTime: performance.now(),
  rafId: null,
  sampleInterval: 3,
  debounceCount: 0,
  pendingTier: null,
}

const DEBOUNCE_THRESHOLD = 3

function measureFPS(): void {
  const now = performance.now()
  const delta = now - fpsMonitor.lastTime

  fpsMonitor.frames.push(now)

  if (fpsMonitor.frames.length % fpsMonitor.sampleInterval !== 0) {
    fpsMonitor.rafId = requestAnimationFrame(measureFPS)
    return
  }

  if (delta >= 1000) {
    const fps = (fpsMonitor.frames.length / delta) * 1000
    fpsMonitor.frames = []
    fpsMonitor.lastTime = now

    updatePerformanceTier(fps)
  }

  fpsMonitor.rafId = requestAnimationFrame(measureFPS)
}

let currentTier: PerformanceTier = 1

function updatePerformanceTier(fps: number): void {
  let newTier: PerformanceTier

  if (fps >= 55) {
    newTier = 1
  } else if (fps >= 40) {
    newTier = 2
  } else {
    newTier = 3
  }

  if (newTier !== currentTier) {
    if (newTier === fpsMonitor.pendingTier) {
      fpsMonitor.debounceCount++
    } else {
      fpsMonitor.pendingTier = newTier
      fpsMonitor.debounceCount = 1
    }

    if (fpsMonitor.debounceCount >= DEBOUNCE_THRESHOLD) {
      currentTier = newTier
      fpsMonitor.pendingTier = null
      fpsMonitor.debounceCount = 0
      applyPerformanceTier(newTier)
    }
  } else {
    fpsMonitor.pendingTier = null
    fpsMonitor.debounceCount = 0
  }
}

function applyPerformanceTier(tier: PerformanceTier): void {
  const html = document.documentElement

  html.removeAttribute('data-performance-tier')

  if (tier > 1) {
    html.setAttribute('data-performance-tier', String(tier))
  }

  console.log(`[Performance] Tier updated to ${tier} (FPS: ${getCurrentFPS()})`)
}

function getCurrentFPS(): number {
  if (fpsMonitor.frames.length === 0) return 60
  const delta = performance.now() - fpsMonitor.lastTime
  return (fpsMonitor.frames.length / Math.max(delta, 1)) * 1000
}

export function startFPSMonitoring(): void {
  if (!fpsMonitor.rafId) {
    fpsMonitor.lastTime = performance.now()
    fpsMonitor.frames = []
    fpsMonitor.debounceCount = 0
    fpsMonitor.pendingTier = null
    fpsMonitor.rafId = requestAnimationFrame(measureFPS)
  }
}

export function getCurrentTier(): PerformanceTier {
  return currentTier
}
