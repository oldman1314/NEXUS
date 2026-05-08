import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode, AccentColor, VisualStyle, FontFamily } from '@/types'
import { storage } from '@/stores/storage'
import { startFPSMonitoring, getCurrentTier } from '@/utils/performanceTier'
import { perfProfiler } from '@/utils/performanceProfiler'

let transitionTimer: ReturnType<typeof setTimeout> | null = null
let backdropFilterTimer: ReturnType<typeof setTimeout> | null = null
let fontTransitionTimer: ReturnType<typeof setTimeout> | null = null

const TRANSITION_DURATION = 300
const BACKDROP_RESTORE_DELAY = 350
const LARGE_DOM_THRESHOLD = 500

function hasLargeDOM(): boolean {
  const responseBody = document.querySelector('.response-body')
  if (responseBody && responseBody.childElementCount > 50) return true
  const jsonViewer = document.querySelector('.json-viewer')
  if (jsonViewer && jsonViewer.childElementCount > 50) return true
  const dtView = document.querySelector('.dt-view')
  if (dtView && dtView.childElementCount > 50) return true
  return document.querySelectorAll('.jv-line').length > LARGE_DOM_THRESHOLD
}

function skipLargeDataRendering(): HTMLDivElement[] {
  const containers: HTMLDivElement[] = []
  const selectors = '.json-viewer, .response-body, .dt-view'
  document.querySelectorAll(selectors).forEach((el) => {
    if (el instanceof HTMLDivElement) {
      el.style.setProperty('content-visibility', 'hidden', 'important')
      containers.push(el)
    }
  })
  return containers
}

function restoreLargeDataRendering(containers: HTMLDivElement[]) {
  containers.forEach((el) => {
    el.style.removeProperty('content-visibility')
  })
}

function scheduleBackdropFilterActivation() {
  if (backdropFilterTimer) {
    clearTimeout(backdropFilterTimer)
  }
  document.documentElement.classList.add('backdrop-filter-pending')
  const delay = hasLargeDOM() ? 0 : BACKDROP_RESTORE_DELAY
  if (delay === 0) {
    document.documentElement.classList.remove('backdrop-filter-pending')
    return
  }
  backdropFilterTimer = setTimeout(() => {
    document.documentElement.classList.remove('backdrop-filter-pending')
    backdropFilterTimer = null
  }, delay)
}

function clearBackdropFilterPending() {
  if (backdropFilterTimer) {
    clearTimeout(backdropFilterTimer)
    backdropFilterTimer = null
  }
  document.documentElement.classList.remove('backdrop-filter-pending')
}

const ACCENT_MAP: Record<AccentColor, { light: string; dark: string }> = {
  blue: { light: '#007aff', dark: '#0a84ff' },
  purple: { light: '#af52de', dark: '#bf5af2' },
  indigo: { light: '#5856d6', dark: '#5e5ce6' },
  pink: { light: '#ff2d55', dark: '#ff375f' },
  rose: { light: '#ff6482', dark: '#ff6b8a' },
  red: { light: '#ff3b30', dark: '#ff453a' },
  orange: { light: '#ff9500', dark: '#ff9f0a' },
  green: { light: '#34c759', dark: '#30d158' },
  mint: { light: '#00c7be', dark: '#63e6be' },
  teal: { light: '#5ac8fa', dark: '#64d2ff' },
  cyan: { light: '#32ade6', dark: '#70d7ff' },
}

const ACCENT_END_MAP: Record<AccentColor, { light: string; dark: string }> = {
  blue: { light: '#5ac8fa', dark: '#64d2ff' },
  purple: { light: '#d9a7ff', dark: '#e0aaff' },
  indigo: { light: '#9c92ff', dark: '#a8a4ff' },
  pink: { light: '#ff7eb3', dark: '#ff7eb3' },
  rose: { light: '#ffa0b4', dark: '#ffa0b4' },
  red: { light: '#ff6961', dark: '#ff6b6b' },
  orange: { light: '#ffcc00', dark: '#ffd60a' },
  green: { light: '#7ee787', dark: '#63e6be' },
  mint: { light: '#7af5ca', dark: '#7af5ca' },
  teal: { light: '#80e0ff', dark: '#80e0ff' },
  cyan: { light: '#a0e8ff', dark: '#a0e8ff' },
}

const FONT_SANS_MAP: Record<FontFamily, string> = {
  harmonyos: "'Inter', 'HarmonyOS Sans SC', 'PingFang SC', 'MiSans', 'Microsoft YaHei', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
  lxgw: "'LXGW WenKai', 'Inter', 'HarmonyOS Sans SC', 'PingFang SC', 'MiSans', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
  misans: "'Inter', 'MiSans', 'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
  noto: "'Inter', 'Noto Sans SC', 'HarmonyOS Sans SC', 'PingFang SC', 'MiSans', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
  sarasa: "'Sarasa Gothic SC', 'Inter', 'HarmonyOS Sans SC', 'PingFang SC', 'MiSans', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
}

const FONT_MONO_MAP: Record<FontFamily, string> = {
  harmonyos: "'Sarasa Gothic SC', 'SF Mono', SFMono-Regular, ui-monospace, 'Cascadia Code', 'Noto Sans Mono CJK SC', monospace",
  lxgw: "'LXGW WenKai Mono', 'Sarasa Gothic SC', 'SF Mono', SFMono-Regular, ui-monospace, 'Cascadia Code', monospace",
  misans: "'Sarasa Gothic SC', 'SF Mono', SFMono-Regular, ui-monospace, 'Cascadia Code', 'Noto Sans Mono CJK SC', monospace",
  noto: "'Noto Sans Mono CJK SC', 'Sarasa Gothic SC', 'SF Mono', SFMono-Regular, ui-monospace, 'Cascadia Code', monospace",
  sarasa: "'Sarasa Gothic SC', 'SF Mono', SFMono-Regular, ui-monospace, 'Cascadia Code', 'Noto Sans Mono CJK SC', monospace",
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeTransition() {
  const el = document.documentElement
  if (transitionTimer) {
    clearTimeout(transitionTimer)
  }
  if (hasLargeDOM()) {
    el.classList.remove('theme-transitioning')
    return
  }
  el.classList.add('theme-transitioning')
  transitionTimer = setTimeout(() => {
    el.classList.remove('theme-transitioning')
    transitionTimer = null
  }, TRANSITION_DURATION)
}

function applyVisualStyle(style: VisualStyle) {
  if (style === 'classic') {
    document.documentElement.removeAttribute('data-visual-style')
  } else {
    document.documentElement.setAttribute('data-visual-style', style)
  }
}

function applyFontFamily(font: FontFamily) {
  const el = document.documentElement
  if (fontTransitionTimer) clearTimeout(fontTransitionTimer)
  el.classList.add('font-transitioning')
  el.style.setProperty('--font-sans', FONT_SANS_MAP[font])
  el.style.setProperty('--font-mono', FONT_MONO_MAP[font])
  el.setAttribute('data-font', font)
  fontTransitionTimer = setTimeout(() => {
    el.classList.remove('font-transitioning')
    fontTransitionTimer = null
  }, 300)
}

function applyAccentSync(color: AccentColor, mode: 'light' | 'dark', visualStyle: VisualStyle) {
  const el = document.documentElement
  const value = ACCENT_MAP[color][mode]

  el.style.setProperty('--accent', value)
  el.style.setProperty('--accent-hover', mode === 'dark' ? lighten(value, 20) : darken(value, 15))
  el.style.setProperty('--accent-light', hexToRgba(value, mode === 'dark' ? 0.15 : 0.1))

  if (visualStyle === 'immersive') {
    const endValue = ACCENT_END_MAP[color][mode]
    el.style.setProperty('--accent-start', value)
    el.style.setProperty('--accent-end', endValue)
    el.style.setProperty('--accent-glow', hexToRgba(value, mode === 'dark' ? 0.35 : 0.2))
  } else {
    el.style.setProperty('--accent-start', value)
    el.style.setProperty('--accent-end', value)
    el.style.setProperty('--accent-glow', mode === 'dark' ? hexToRgba(value, 0.4) : 'transparent')
  }
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function darken(hex: string, amount: number) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function lighten(hex: string, amount: number) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

interface ThemeState {
  mode: ThemeMode
  resolvedMode: 'light' | 'dark'
  accentColor: AccentColor
  visualStyle: VisualStyle
  fontFamily: FontFamily
  setMode: (mode: ThemeMode) => void
  setAccentColor: (color: AccentColor) => void
  setVisualStyle: (style: VisualStyle) => void
  setFontFamily: (font: FontFamily) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedMode: getSystemTheme(),
      accentColor: 'blue',
      visualStyle: 'classic',
      fontFamily: 'harmonyos',
      setMode: (mode) => {
        perfProfiler.startMeasure('setMode')

        const resolved = mode === 'system' ? getSystemTheme() : mode
        const isImmersive = get().visualStyle === 'immersive'
        const isLargeDOM = hasLargeDOM()

        const skippedContainers = isLargeDOM ? skipLargeDataRendering() : []
        applyThemeTransition()

        document.documentElement.setAttribute('data-theme', resolved)
        applyAccentSync(get().accentColor, resolved, get().visualStyle)

        if (isImmersive) {
          scheduleBackdropFilterActivation()
        }

        if (isLargeDOM) {
          requestAnimationFrame(() => {
            restoreLargeDataRendering(skippedContainers)
          })
        }

        perfProfiler.markDOMUpdateComplete()
        perfProfiler.markFirstPaint()

        set({ mode, resolvedMode: resolved })
      },
      setAccentColor: (color) => {
        perfProfiler.startMeasure('setAccentColor')

        applyAccentSync(color, get().resolvedMode, get().visualStyle)

        requestAnimationFrame(() => {
          perfProfiler.markDOMUpdateComplete()
          perfProfiler.markFirstPaint()
        })

        set({ accentColor: color })
      },
      setVisualStyle: (style) => {
        perfProfiler.startMeasure('setVisualStyle')

        applyThemeTransition()

        if (style === 'immersive') {
          scheduleBackdropFilterActivation()
        } else {
          clearBackdropFilterPending()
        }

        applyVisualStyle(style)
        applyAccentSync(get().accentColor, get().resolvedMode, style)

        if (style === 'immersive') {
          const tier = getCurrentTier()
          if (tier > 1) {
            document.documentElement.setAttribute('data-performance-tier', String(tier))
          }
        } else {
          document.documentElement.removeAttribute('data-performance-tier')
        }

        perfProfiler.markDOMUpdateComplete()
        perfProfiler.markFirstPaint()

        set({ visualStyle: style })
      },
      setFontFamily: (font) => {
        applyFontFamily(font)
        set({ fontFamily: font })
      },
      toggle: () => {
        perfProfiler.startMeasure('toggle')

        const { resolvedMode } = get()
        const newMode = resolvedMode === 'dark' ? 'light' : 'dark'
        const isImmersive = get().visualStyle === 'immersive'
        const isLargeDOM = hasLargeDOM()

        const skippedContainers = isLargeDOM ? skipLargeDataRendering() : []
        applyThemeTransition()

        document.documentElement.setAttribute('data-theme', newMode)
        applyAccentSync(get().accentColor, newMode, get().visualStyle)

        if (isImmersive) {
          scheduleBackdropFilterActivation()
        }

        if (isLargeDOM) {
          requestAnimationFrame(() => {
            restoreLargeDataRendering(skippedContainers)
          })
        }

        perfProfiler.markDOMUpdateComplete()
        perfProfiler.markFirstPaint()

        set({ mode: newMode, resolvedMode: newMode })
      },
    }),
    {
      name: 'theme-storage',
      storage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.mode === 'system' ? getSystemTheme() : state.mode
          document.documentElement.setAttribute('data-theme', resolved)
          applyVisualStyle(state.visualStyle)
          applyAccentSync(state.accentColor, resolved, state.visualStyle)
          applyFontFamily(state.fontFamily)
          state.resolvedMode = resolved
        }
      },
    }
  )
)

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const store = useThemeStore.getState()
  if (store.mode === 'system') {
    const resolved = e.matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', resolved)
    applyAccentSync(store.accentColor, resolved, store.visualStyle)
    useThemeStore.setState({ resolvedMode: resolved })
  }
})

applyVisualStyle('classic')

if (typeof window !== 'undefined') {
  startFPSMonitoring()
}
