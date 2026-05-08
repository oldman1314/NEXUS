import { create } from 'zustand'
import type { WarpTunnelState } from '@/types'
import { getCurrentTier } from '@/utils/performanceTier'

const COMBO_TIMEOUT = 30000

function getComboLevel(combo: number): number {
  if (combo >= 10) return 3
  if (combo >= 5) return 2
  if (combo >= 3) return 1
  return 0
}

function shouldSimplifyAnimations(): boolean {
  try {
    return getCurrentTier() >= 2
  } catch {
    return false
  }
}

function shouldDisableDecorativeAnimations(): boolean {
  try {
    return getCurrentTier() === 3
  } catch {
    return false
  }
}

function schedule(timers: number[], fn: () => void, delay: number): number {
  const id = window.setTimeout(fn, delay)
  timers.push(id)
  return id
}

function clearTimers(timers: number[]): void {
  timers.forEach(clearTimeout)
}

interface RemoteToolsAnimationState {
  tunnelState: WarpTunnelState
  activeSessions: number
  errorMessage: string
  comboCount: number
  showComboText: boolean
  comboLevel: number
  particleBurst: boolean
  _timers: number[]
  _lastSuccessTime: number
  _comboTimeoutId: number | null
}

interface RemoteToolsAnimationActions {
  startConnecting: () => void
  connectionSuccess: () => void
  connectionError: (message?: string) => void
  setActiveSessions: (count: number) => void
  triggerParticleBurst: () => void
  resetCombo: () => void
  cleanup: () => void
}

type RemoteToolsAnimationStore = RemoteToolsAnimationState & RemoteToolsAnimationActions

const initialState: RemoteToolsAnimationState = {
  tunnelState: 'idle',
  activeSessions: 0,
  errorMessage: '',
  comboCount: 0,
  showComboText: false,
  comboLevel: 0,
  particleBurst: false,
  _timers: [],
  _lastSuccessTime: 0,
  _comboTimeoutId: null,
}

function handleComboEffects(set: (partial: Partial<RemoteToolsAnimationStore> | ((s: RemoteToolsAnimationStore) => Partial<RemoteToolsAnimationStore>)) => void, get: () => RemoteToolsAnimationStore) {
  const now = Date.now()
  const { comboCount, _lastSuccessTime, _timers, _comboTimeoutId } = get()

  const newCombo = (now - _lastSuccessTime < COMBO_TIMEOUT) ? comboCount + 1 : 1

  if (_comboTimeoutId) clearTimeout(_comboTimeoutId)
  const comboTid = window.setTimeout(() => {
    set({ comboCount: 0 })
  }, COMBO_TIMEOUT)

  const comboLevel = getComboLevel(newCombo)

  set({
    comboCount: newCombo,
    showComboText: comboLevel > 0,
    comboLevel,
    _lastSuccessTime: now,
    _comboTimeoutId: comboTid,
  })

  schedule(_timers, () => set({ showComboText: false, comboLevel: 0 }), 2000)
}

export const useRemoteToolsAnimationStore = create<RemoteToolsAnimationStore>()((set, get) => ({
  ...initialState,

  startConnecting: () => {
    const { _timers } = get()
    clearTimers(_timers)
    set({ _timers: [], tunnelState: 'connecting', errorMessage: '' })
  },

  connectionSuccess: () => {
    const { _timers } = get()
    const disableDecorative = shouldDisableDecorativeAnimations()
    const simplify = shouldSimplifyAnimations()

    set({ tunnelState: 'connected', errorMessage: '' })

    handleComboEffects(set, get)

    const resetDelay = disableDecorative ? 100 : simplify ? 1000 : 1500
    schedule(_timers, () => set({ tunnelState: 'idle' }), resetDelay)
  },

  connectionError: (message?: string) => {
    const { _timers } = get()
    const disableDecorative = shouldDisableDecorativeAnimations()

    set({
      tunnelState: 'error',
      errorMessage: message || 'Connection Failed',
    })

    const resetDelay = disableDecorative ? 100 : 1800
    schedule(_timers, () => set({ tunnelState: 'idle', errorMessage: '' }), resetDelay)
  },

  setActiveSessions: (count: number) => set({ activeSessions: count }),

  triggerParticleBurst: () => {
    if (shouldDisableDecorativeAnimations()) return
    set({ particleBurst: true })
    const { _timers } = get()
    schedule(_timers, () => set({ particleBurst: false }), 700)
  },

  resetCombo: () => {
    const { _comboTimeoutId } = get()
    if (_comboTimeoutId) clearTimeout(_comboTimeoutId)
    set({ comboCount: 0, showComboText: false, comboLevel: 0, _lastSuccessTime: 0, _comboTimeoutId: null })
  },

  cleanup: () => {
    const { _timers, _comboTimeoutId } = get()
    clearTimers(_timers)
    if (_comboTimeoutId) clearTimeout(_comboTimeoutId)
    set({ _timers: [], _comboTimeoutId: null })
  },
}))
