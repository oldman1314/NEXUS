import { create } from 'zustand'
import type { DroneState } from '@/types'
import { getCurrentTier } from '@/utils/performanceTier'

type RequestStatus = 'idle' | 'pending' | 'success' | 'error'

const VALID_TRANSITIONS: Record<DroneState, DroneState[]> = {
  idle: ['launching', 'flying'],
  launching: ['flying'],
  flying: ['hovering'],
  hovering: ['landing', 'crashed'],
  landing: ['idle'],
  crashed: ['idle'],
}

function canTransition(from: DroneState, to: DroneState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

interface AnimationState {
  droneState: DroneState
  droneError: boolean
  requestStatus: RequestStatus
  urlFlash: 'none' | 'success' | 'error'
  particleBurst: boolean
  errorMessage: string
  httpStatus: number
  comboCount: number
  showComboText: boolean
  comboLevel: number
  requestId: string
  _timers: number[]
  _pendingResult: { ok: boolean; httpStatus?: number; errorMessage?: string; requestId: string } | null
  _lastSuccessTime: number
  _comboTimeoutId: number | null
}

interface AnimationActions {
  startRequest: () => void
  endRequest: (ok: boolean, httpStatus?: number, errorMessage?: string) => void
  cancelRequest: () => void
  triggerParticleBurst: () => void
  resetCombo: () => void
  cleanup: () => void
}

type AnimationStore = AnimationState & AnimationActions

const initialState: AnimationState = {
  droneState: 'idle',
  droneError: false,
  requestStatus: 'idle',
  urlFlash: 'none',
  particleBurst: false,
  errorMessage: '',
  httpStatus: 0,
  comboCount: 0,
  showComboText: false,
  comboLevel: 0,
  requestId: '',
  _timers: [],
  _pendingResult: null,
  _lastSuccessTime: 0,
  _comboTimeoutId: null,
}

const COMBO_TIMEOUT = 30000

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

function getComboLevel(combo: number): number {
  if (combo >= 10) return 3
  if (combo >= 5) return 2
  if (combo >= 3) return 1
  return 0
}

function clearTimers(timers: number[]): void {
  timers.forEach(clearTimeout)
}

function schedule(timers: number[], fn: () => void, delay: number): number {
  const id = window.setTimeout(fn, delay)
  timers.push(id)
  return id
}

function safeTransition(current: DroneState, next: DroneState): DroneState {
  if (canTransition(current, next)) return next
  if (current === next) return current
  return current
}

function handleSuccessEffects(set: (partial: Partial<AnimationStore> | ((s: AnimationStore) => Partial<AnimationStore>)) => void, get: () => AnimationStore) {
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

function applyPendingResult(get: () => AnimationStore, set: (partial: Partial<AnimationStore> | ((s: AnimationStore) => Partial<AnimationStore>)) => void) {
  const { _pendingResult, requestId, _timers } = get()
  if (!_pendingResult) return

  if (_pendingResult.requestId !== requestId) {
    set({ _pendingResult: null })
    return
  }

  const result = _pendingResult
  set({ _pendingResult: null })

  const next: Partial<AnimationStore> = {
    requestStatus: result.ok ? 'success' : 'error',
    droneError: !result.ok,
    urlFlash: result.ok ? 'success' : 'error',
    httpStatus: result.httpStatus ?? 0,
  }

  const currentDroneState = get().droneState
  if (result.ok) {
    next.droneState = safeTransition(currentDroneState, 'landing')
  } else {
    next.droneState = safeTransition(currentDroneState, 'crashed')
    next.errorMessage = result.errorMessage || 'Request Failed'
  }

  set(next)

  if (result.ok) {
    handleSuccessEffects(set, get)
    schedule(_timers, () => set({ droneState: 'idle', droneError: false, errorMessage: '', urlFlash: 'none', httpStatus: 0, requestStatus: 'idle' }), 1500)
  } else {
    schedule(_timers, () => set({ droneState: 'idle', droneError: false, errorMessage: '', urlFlash: 'none', httpStatus: 0, requestStatus: 'idle' }), 1800)
  }
}

export const useAnimationStore = create<AnimationStore>()((set, get) => ({
  ...initialState,

  startRequest: () => {
    const { _timers } = get()
    clearTimers(_timers)
    set({ _timers: [], _pendingResult: null })

    const simplify = shouldSimplifyAnimations()
    const disableDecorative = shouldDisableDecorativeAnimations()
    const newRequestId = crypto.randomUUID()

    set({
      requestStatus: 'pending',
      droneError: false,
      urlFlash: 'none',
      errorMessage: '',
      httpStatus: 0,
      requestId: newRequestId,
    })

    if (disableDecorative) {
      set({ droneState: 'idle' })
      return
    }

    if (simplify) {
      requestAnimationFrame(() => {
        set((s) => ({ droneState: safeTransition(s.droneState, 'flying') }))
        const timers: number[] = []
        schedule(timers, () => {
          set((s) => ({ droneState: safeTransition(s.droneState, 'hovering') }))
          if (get()._pendingResult) {
            schedule(timers, () => applyPendingResult(get, set), 400)
          }
        }, 1000)
        set({ _timers: timers })
      })
    } else {
      requestAnimationFrame(() => {
        set((s) => ({ droneState: safeTransition(s.droneState, 'launching') }))
      })

      const timers: number[] = []
      schedule(timers, () => {
        set((s) => ({ droneState: safeTransition(s.droneState, 'flying') }))
      }, 600)

      schedule(timers, () => {
        set((s) => ({ droneState: safeTransition(s.droneState, 'hovering') }))
        if (get()._pendingResult) {
          schedule(timers, () => applyPendingResult(get, set), 800)
        }
      }, 2000)
      set({ _timers: timers })
    }
  },

  endRequest: (ok: boolean, httpStatus?: number, errorMessage?: string) => {
    const { droneState, requestId, _timers } = get()
    const disableDecorative = shouldDisableDecorativeAnimations()

    if (droneState === 'launching' || droneState === 'flying') {
      set({
        _pendingResult: { ok, httpStatus, errorMessage, requestId },
      })
      return
    }

    const next: Partial<AnimationStore> = {
      requestStatus: ok ? 'success' : 'error',
      droneError: !ok,
      httpStatus: httpStatus ?? 0,
    }

    if (disableDecorative) {
      next.droneState = 'idle'
      next.urlFlash = 'none'
    } else if (ok) {
      next.droneState = safeTransition(droneState, 'landing')
    } else {
      next.droneState = safeTransition(droneState, 'crashed')
      next.errorMessage = errorMessage || 'Request Failed'
    }

    set(next)

    if (ok) {
      handleSuccessEffects(set, get)
    }

    if (disableDecorative) {
      schedule(_timers, () => set({ droneState: 'idle', droneError: false, errorMessage: '', urlFlash: 'none', httpStatus: 0, requestStatus: 'idle' }), 100)
    } else if (ok) {
      schedule(_timers, () => set({ droneState: 'idle', droneError: false, errorMessage: '', urlFlash: 'none', httpStatus: 0, requestStatus: 'idle' }), 1500)
    } else {
      schedule(_timers, () => set({ droneState: 'idle', droneError: false, errorMessage: '', urlFlash: 'none', httpStatus: 0, requestStatus: 'idle' }), 1800)
    }
  },

  cancelRequest: () => {
    const { requestStatus, _timers } = get()
    if (requestStatus === 'pending') {
      clearTimers(_timers)
      const currentDroneState = get().droneState
      set({
        _timers: [],
        _pendingResult: null,
        requestStatus: 'error',
        droneState: shouldDisableDecorativeAnimations() ? 'idle' : safeTransition(currentDroneState, 'crashed'),
        droneError: true,
        errorMessage: 'Cancelled',
        httpStatus: 0,
      })
      const newTimers: number[] = []
      schedule(newTimers, () => set({ droneState: 'idle', droneError: false, errorMessage: '', httpStatus: 0, requestStatus: 'idle' }), shouldDisableDecorativeAnimations() ? 100 : 1500)
      set({ _timers: newTimers })
    }
  },

  triggerParticleBurst: () => {
    if (shouldDisableDecorativeAnimations()) {
      return
    }
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
    set({ _timers: [], _pendingResult: null, _comboTimeoutId: null })
  },
}))
