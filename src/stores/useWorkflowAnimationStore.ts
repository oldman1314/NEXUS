import { create } from 'zustand'

type CircuitState = 'idle' | 'running' | 'success' | 'error'
type RocketState = 'idle' | 'launching' | 'flying' | 'returning'

const COMBO_TIMEOUT = 30000

function getComboLevel(combo: number): number {
  if (combo >= 10) return 3
  if (combo >= 5) return 2
  if (combo >= 3) return 1
  return 0
}

export interface WorkflowAnimationState {
  circuitState: CircuitState
  nodeCount: number
  executedNodeCount: number
  rocketState: RocketState
  isWorkflowRunning: boolean
  nodeProgress: number
  comboCount: number
  showComboText: boolean
  comboLevel: number
  _lastSuccessTime: number
  _comboTimeoutId: number | null
  _timers: number[]

  setCircuitState: (state: CircuitState) => void
  setNodeCount: (count: number) => void
  setExecutedNodeCount: (count: number) => void
  setRocketState: (state: RocketState) => void
  setWorkflowRunning: (running: boolean) => void
  setNodeProgress: (executed: number, total: number) => void
  triggerCombo: () => void
  resetCombo: () => void
  resetAnimation: () => void
  cleanup: () => void
}

function schedule(timers: number[], fn: () => void, delay: number): number {
  const id = window.setTimeout(() => {
    const idx = timers.indexOf(id)
    if (idx !== -1) timers.splice(idx, 1)
    fn()
  }, delay)
  timers.push(id)
  return id
}

function clearTimers(timers: number[]): void {
  timers.forEach(clearTimeout)
}

export const useWorkflowAnimationStore = create<WorkflowAnimationState>((set, get) => ({
  circuitState: 'idle',
  nodeCount: 0,
  executedNodeCount: 0,
  rocketState: 'idle',
  isWorkflowRunning: false,
  nodeProgress: 0,
  comboCount: 0,
  showComboText: false,
  comboLevel: 0,
  _lastSuccessTime: 0,
  _comboTimeoutId: null,
  _timers: [],

  setCircuitState: (state) => set({ circuitState: state }),

  setNodeCount: (count) => set({ nodeCount: count }),

  setExecutedNodeCount: (count) => set({ executedNodeCount: count }),

  setRocketState: (state) => set({ rocketState: state }),

  setWorkflowRunning: (running) => set({ isWorkflowRunning: running }),

  setNodeProgress: (executed, total) => set({
    executedNodeCount: executed,
    nodeCount: total,
    nodeProgress: total > 0 ? (executed / total) * 100 : 0,
  }),

  triggerCombo: () => {
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
  },

  resetCombo: () => {
    const { _comboTimeoutId } = get()
    if (_comboTimeoutId) clearTimeout(_comboTimeoutId)
    set({ comboCount: 0, showComboText: false, comboLevel: 0, _lastSuccessTime: 0, _comboTimeoutId: null })
  },

  resetAnimation: () => {
    const { _timers, _comboTimeoutId } = get()
    clearTimers(_timers)
    if (_comboTimeoutId) clearTimeout(_comboTimeoutId)
    set({
      circuitState: 'idle',
      nodeCount: 0,
      executedNodeCount: 0,
      rocketState: 'idle',
      isWorkflowRunning: false,
      nodeProgress: 0,
      comboCount: 0,
      showComboText: false,
      comboLevel: 0,
      _lastSuccessTime: 0,
      _comboTimeoutId: null,
      _timers: [],
    })
  },

  cleanup: () => {
    const { _timers, _comboTimeoutId } = get()
    clearTimers(_timers)
    if (_comboTimeoutId) clearTimeout(_comboTimeoutId)
    set({ _timers: [], _comboTimeoutId: null })
  },
}))
