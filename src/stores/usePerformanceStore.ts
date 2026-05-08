import { create } from 'zustand'

interface PerformanceState {
  panelOpen: boolean
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void

  currentFps: number
  setCurrentFps: (fps: number) => void

  fpsHistory: number[]
  pushFpsHistory: (fps: number) => void

  frameTime: number
  setFrameTime: (time: number) => void
  frameTimeHistory: number[]
  pushFrameTimeHistory: (time: number) => void

  usedJsHeapSize: number
  totalJsHeapSize: number
  jsHeapSizeLimit: number
  updateMemory: () => void

  domNodes: number
  updateDomNodes: () => void

  documentSize: number
  updateDocumentSize: () => void

  jsEventListeners: number
  updateEventListeners: () => void

  pageLoadTime: number
  domContentLoaded: number
  firstPaint: number
  firstContentfulPaint: number
  domInteractive: number
  updateNavTiming: () => void

  totalResources: number
  scriptResources: number
  styleResources: number
  imageResources: number
  fontResources: number
  fetchResources: number
  otherResources: number
  totalResourceSize: number
  updateResources: () => void

  longTaskCount: number
  totalLongTaskTime: number
  lastLongTaskTime: number
  updateLongTasks: () => void

  batteryLevel: number | null
  batteryCharging: boolean | null
  batterySupported: boolean
  updateBattery: () => void

  connectionType: string
  connectionDownlink: number | null
  connectionRtt: number
  connectionSupported: boolean
  updateConnection: () => void
}

const MAX_HISTORY = 60
const MAX_FRAME_HISTORY = 120

export const usePerformanceStore = create<PerformanceState>()((set, get) => ({
  panelOpen: false,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setPanelOpen: (open) => set({ panelOpen: open }),

  currentFps: 60,
  setCurrentFps: (fps) => set({ currentFps: Math.round(fps) }),

  fpsHistory: [],
  pushFpsHistory: (fps) => {
    const history = [...get().fpsHistory, Math.round(fps)]
    if (history.length > MAX_HISTORY) history.shift()
    set({ fpsHistory: history })
  },

  frameTime: 0,
  setFrameTime: (time) => set({ frameTime: Math.round(time * 100) / 100 }),
  frameTimeHistory: [],
  pushFrameTimeHistory: (time) => {
    const history = [...get().frameTimeHistory, Math.round(time * 100) / 100]
    if (history.length > MAX_FRAME_HISTORY) history.shift()
    set({ frameTimeHistory: history })
  },

  usedJsHeapSize: 0,
  totalJsHeapSize: 0,
  jsHeapSizeLimit: 0,
  updateMemory: () => {
    try {
      if ('memory' in performance) {
        const mem = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
        set({
          usedJsHeapSize: mem.usedJSHeapSize,
          totalJsHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit,
        })
      }
    } catch {
      // performance.memory may throw in some environments
    }
  },

  domNodes: 0,
  updateDomNodes: () => {
    try {
      set({ domNodes: document.querySelectorAll('*').length })
    } catch {
      // silently ignore
    }
  },

  documentSize: 0,
  updateDocumentSize: () => {
    try {
      set({ documentSize: document.documentElement.innerHTML.length })
    } catch {
      // silently ignore
    }
  },

  jsEventListeners: 0,
  updateEventListeners: () => {
    try {
      let count = 0
      const all = document.querySelectorAll('*')
      for (let i = 0; i < all.length; i++) {
        count += (all[i] as HTMLElement).getAttribute?.('on') ? 1 : 0
      }
      set({ jsEventListeners: count })
    } catch {
      // silently ignore
    }
  },

  pageLoadTime: 0,
  domContentLoaded: 0,
  firstPaint: 0,
  firstContentfulPaint: 0,
  domInteractive: 0,
  updateNavTiming: () => {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      if (nav) {
        set({
          pageLoadTime: Math.round(nav.loadEventEnd - nav.startTime),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          domInteractive: Math.round(nav.domInteractive - nav.startTime),
        })
      }
      const paintEntries = performance.getEntriesByType('paint')
      for (const entry of paintEntries) {
        if (entry.name === 'first-paint') {
          set({ firstPaint: Math.round(entry.startTime) })
        }
        if (entry.name === 'first-contentful-paint') {
          set({ firstContentfulPaint: Math.round(entry.startTime) })
        }
      }
    } catch {
      // silently ignore
    }
  },

  totalResources: 0,
  scriptResources: 0,
  styleResources: 0,
  imageResources: 0,
  fontResources: 0,
  fetchResources: 0,
  otherResources: 0,
  totalResourceSize: 0,
  updateResources: () => {
    try {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      let scripts = 0, styles = 0, images = 0, fonts = 0, fetches = 0, others = 0, totalSize = 0
      for (const e of entries) {
        totalSize += e.transferSize || 0
        const url = e.name.toLowerCase()
        if (e.initiatorType === 'script' || url.endsWith('.js')) scripts++
        else if (e.initiatorType === 'css' || url.endsWith('.css')) styles++
        else if (e.initiatorType === 'img' || /\.(png|jpg|jpeg|gif|svg|webp|ico)/.test(url)) images++
        else if (e.initiatorType === 'font' || /\.(woff2?|ttf|otf|eot)/.test(url)) fonts++
        else if (e.initiatorType === 'fetch' || e.initiatorType === 'xmlhttprequest') fetches++
        else others++
      }
      set({
        totalResources: entries.length,
        scriptResources: scripts,
        styleResources: styles,
        imageResources: images,
        fontResources: fonts,
        fetchResources: fetches,
        otherResources: others,
        totalResourceSize: totalSize,
      })
    } catch {
      // silently ignore
    }
  },

  longTaskCount: 0,
  totalLongTaskTime: 0,
  lastLongTaskTime: 0,
  updateLongTasks: () => {
    // long tasks are collected via PerformanceObserver in the component
  },

  batteryLevel: null,
  batteryCharging: null,
  batterySupported: false,
  updateBattery: () => {
    // battery is updated via navigator.getBattery() in the component
  },

  connectionType: 'unknown',
  connectionDownlink: null,
  connectionRtt: 0,
  connectionSupported: false,
  updateConnection: () => {
    try {
      const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection
      if (conn) {
        set({
          connectionType: conn.effectiveType || 'unknown',
          connectionDownlink: conn.downlink ?? null,
          connectionRtt: conn.rtt || 0,
          connectionSupported: true,
        })
      }
    } catch {
      // silently ignore
    }
  },
}))
