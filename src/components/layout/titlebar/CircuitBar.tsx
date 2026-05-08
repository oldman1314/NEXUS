import { useRef, useEffect, useLayoutEffect, memo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useWorkflowAnimationStore } from '@/stores/useWorkflowAnimationStore'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import './circuit-bar.css'

type CircuitState = 'idle' | 'running' | 'success' | 'error'

interface AnimTarget {
  x: number
  y: number
  scale: number
  opacity: number
}

const STATE_TARGETS: Record<string, (dist: number) => AnimTarget> = {
  idle: () => ({ x: 0, y: 0, scale: 1, opacity: 0.85 }),
  launching: () => ({ x: 0, y: -6, scale: 1.05, opacity: 1 }),
  flying: (d) => ({ x: d, y: -2, scale: 1, opacity: 1 }),
  hovering: (d) => ({ x: d, y: 0, scale: 1, opacity: 1 }),
  returning: () => ({ x: 0, y: 0, scale: 1, opacity: 0.85 }),
}

const STATE_DURATIONS: Record<string, number> = {
  idle: 500,
  launching: 600,
  flying: 1400,
  hovering: 300,
  returning: 1200,
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }

const STATE_EASING: Record<string, (t: number) => number> = {
  idle: easeOutCubic,
  launching: easeOutCubic,
  flying: easeInOutCubic,
  hovering: easeOutCubic,
  returning: easeOutCubic,
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function useCircuitAnimation(
  signalRef: React.RefObject<HTMLDivElement | null>,
  stationRef: React.RefObject<HTMLDivElement | null>,
  receiverRef: React.RefObject<HTMLDivElement | null>,
) {
  const rocketState = useWorkflowAnimationStore((s) => s.rocketState)
  const flightDistRef = useRef(200)
  const animRef = useRef(0)
  const currentPosRef = useRef<AnimTarget>({ x: 0, y: 0, scale: 1, opacity: 0.85 })
  const lastStateRef = useRef<string>('')

  useLayoutEffect(() => {
    const calculate = () => {
      if (!stationRef.current || !receiverRef.current) return
      const stationRect = stationRef.current.getBoundingClientRect()
      const receiverRect = receiverRef.current.getBoundingClientRect()
      const dist = receiverRect.left - stationRect.left
      if (dist > 0) flightDistRef.current = dist
    }
    calculate()
    window.addEventListener('resize', calculate)
    return () => window.removeEventListener('resize', calculate)
  }, [stationRef, receiverRef])

  useEffect(() => {
    const el = signalRef.current
    if (!el) return

    const dist = flightDistRef.current
    const target = STATE_TARGETS[rocketState]?.(dist)
    if (!target) return

    if (lastStateRef.current === rocketState) return
    lastStateRef.current = rocketState

    cancelAnimationFrame(animRef.current)

    const from: AnimTarget = { ...currentPosRef.current }
    const duration = STATE_DURATIONS[rocketState] || 500
    const easing = STATE_EASING[rocketState] || easeOutCubic
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const rawT = Math.min(elapsed / duration, 1)
      const t = easing(rawT)

      const x = lerp(from.x, target.x, t)
      const y = lerp(from.y, target.y, t)
      const s = lerp(from.scale, target.scale, t)
      const o = lerp(from.opacity, target.opacity, t)

      currentPosRef.current = { x, y, scale: s, opacity: o }

      el.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`
      el.style.opacity = String(o)

      if (rawT < 1) {
        animRef.current = requestAnimationFrame(tick)
      }
    }

    animRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(animRef.current)
  }, [rocketState, signalRef])

  return { flightDistRef }
}

const CIRCUIT_SPEECH: Record<CircuitState, string[]> = {
  idle: ['Ready! ✨', 'Standing by~', 'Circuit ready ⚡'],
  running: ['Executing... ⚡', 'Energy flowing~', 'Processing... 🔌'],
  success: ['Complete! 🎉', 'All nodes green! ✅', 'Circuit closed! '],
  error: ['Short circuit! 💥', 'Node failed! 🆘', 'Circuit broken! ⚠️'],
}

const CIRCUIT_SLEEP_SPEECH = ['*standby* 💤', '*zzz* 😴', 'Low power... 🥱']

const COMBO_TEXTS = ['', '3 Combo! ⚡', '5 Combo! ⚡⚡', '10 Combo! 🚀⚡⚡⚡']

function getSpeech(state: CircuitState): string {
  const options = CIRCUIT_SPEECH[state] || CIRCUIT_SPEECH.idle
  return options[Math.floor(Math.random() * options.length)]
}

const CircuitStation: React.FC<{ circuitState: CircuitState }> = memo(({ circuitState }) => {
  const isRunning = circuitState === 'running'
  const isSuccess = circuitState === 'success'
  const isError = circuitState === 'error'

  return (
    <div className={`circuit-station ${isRunning ? 'circuit-station--active' : ''} ${isSuccess ? 'circuit-station--success' : ''} ${isError ? 'circuit-station--error' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="var(--text-tertiary)" strokeWidth="1" opacity="0.3" />
        <circle cx="10" cy="10" r="6" stroke="var(--text-tertiary)" strokeWidth="0.5" opacity="0.2" />
        <text x="10" y="13.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--text-tertiary)" opacity="0.4">C</text>
        <circle cx="10" cy="3" r="1.2" fill={isError ? 'var(--error)' : isRunning ? 'var(--accent)' : 'var(--success)'} className={`circuit-led circuit-led--top ${isRunning ? 'circuit-led--on' : ''}`} />
        <circle cx="17" cy="10" r="1.2" fill={isError ? 'var(--error)' : isRunning ? 'var(--accent)' : 'var(--success)'} className={`circuit-led circuit-led--right ${isRunning ? 'circuit-led--on' : ''}`} />
        <circle cx="10" cy="17" r="1.2" fill={isError ? 'var(--error)' : isRunning ? 'var(--accent)' : 'var(--success)'} className={`circuit-led circuit-led--bottom ${isRunning ? 'circuit-led--on' : ''}`} />
        <circle cx="3" cy="10" r="1.2" fill={isError ? 'var(--error)' : isRunning ? 'var(--accent)' : 'var(--success)'} className={`circuit-led circuit-led--left ${isRunning ? 'circuit-led--on' : ''}`} />
      </svg>
    </div>
  )
})

CircuitStation.displayName = 'CircuitStation'

const EnergySignal: React.FC<{ circuitState: CircuitState }> = memo(({ circuitState }) => {
  const isRunning = circuitState === 'running'
  const isSuccess = circuitState === 'success'
  const isError = circuitState === 'error'

  const signalColor = isError
    ? 'var(--error, #FF3B30)'
    : isSuccess
      ? 'var(--success, #34C759)'
      : 'var(--accent, #007AFF)'

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <g className="energy-pulse-group">
        <rect x="4" y="8" width="14" height="6" rx="1.5" stroke={signalColor} strokeWidth="1" fill="none" opacity="0.6" />
        <rect x="7" y="10" width="3" height="2" rx="0.5" fill={signalColor} opacity="0.5" />
        <rect x="11" y="10" width="3" height="2" rx="0.5" fill={signalColor} opacity={isRunning ? '0.8' : '0.3'} className="energy-chip energy-chip--1" />
        <circle cx="10" cy="11" r="1" fill="white" opacity="0.7" />
      </g>
      {isRunning && (
        <g className="energy-sparks">
          <circle cx="3" cy="11" r="0.8" fill={signalColor} opacity="0.6" className="energy-spark energy-spark--1" />
          <circle cx="19" cy="11" r="0.8" fill={signalColor} opacity="0.6" className="energy-spark energy-spark--2" />
        </g>
      )}
    </svg>
  )
})

EnergySignal.displayName = 'EnergySignal'

const CircuitSpeechBubble: React.FC<{
  circuitState: CircuitState
  isSleeping: boolean
  signalRef: React.RefObject<HTMLDivElement | null>
}> = memo(({ circuitState, isSleeping, signalRef }) => {
  const [speechText, setSpeechText] = useState('')
  const [speechVisible, setSpeechVisible] = useState(false)
  const [sleepBubblePos, setSleepBubblePos] = useState({ top: 0, left: 0 })
  const [portalContainer] = useState(() => {
    const el = document.createElement('div')
    el.className = 'circuit-sleep-portal'
    return el
  })

  useEffect(() => {
    document.body.appendChild(portalContainer)
    return () => { portalContainer.remove() }
  }, [portalContainer])

  useEffect(() => {
    if (circuitState === 'idle' && !isSleeping) {
      const text = getSpeech(circuitState)
      setSpeechText(text)
      setSpeechVisible(true)
      const timer = window.setTimeout(() => { setSpeechVisible(false) }, 2000)
      return () => clearTimeout(timer)
    }

    if (isSleeping && circuitState === 'idle') {
      const showSpeech = () => {
        const text = CIRCUIT_SLEEP_SPEECH[Math.floor(Math.random() * CIRCUIT_SLEEP_SPEECH.length)]
        setSpeechText(text)
        setSpeechVisible(true)

        if (signalRef.current) {
          const rect = signalRef.current.getBoundingClientRect()
          setSleepBubblePos({ top: rect.top + rect.height / 2, left: rect.right + 6 })
        }

        const hideTimer = window.setTimeout(() => { setSpeechVisible(false) }, 3000)
        return hideTimer
      }

      let hideTimer = showSpeech()
      const loopTimer = window.setInterval(() => {
        if (hideTimer) clearTimeout(hideTimer)
        hideTimer = showSpeech()
      }, 8000)

      return () => { clearTimeout(hideTimer); clearInterval(loopTimer) }
    }

    const text = getSpeech(circuitState)
    setSpeechText(text)
    setSpeechVisible(true)
    const timer = window.setTimeout(() => { setSpeechVisible(false) }, 2000)
    return () => clearTimeout(timer)
  }, [circuitState, isSleeping, signalRef])

  if (isSleeping && circuitState === 'idle' && speechVisible) {
    return createPortal(
      <div className="circuit-speech circuit-speech--sleeping circuit-speech--portal circuit-speech--visible" style={{ position: 'fixed', top: sleepBubblePos.top, left: sleepBubblePos.left }}>
        {speechText}
      </div>,
      portalContainer
    )
  }

  if (!speechVisible) return null

  return (
    <div className={`circuit-speech circuit-speech--visible ${isSleeping ? 'circuit-speech--sleeping' : ''}`}>
      {speechText}
    </div>
  )
})

CircuitSpeechBubble.displayName = 'CircuitSpeechBubble'

const ReceiverStation: React.FC<{ circuitState: CircuitState; nodeCount: number; executedNodeCount: number }> = memo(({ circuitState, nodeCount, executedNodeCount }) => {
  const isActive = circuitState === 'running'
  const isSuccess = circuitState === 'success'
  const isError = circuitState === 'error'
  const isSearching = circuitState === 'idle'

  return (
    <div className={`receiver-station ${isActive ? 'receiver-station--active' : ''} ${isSearching ? 'receiver-station--searching' : ''} ${isError ? 'receiver-station--error' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="9" y="10" width="2" height="7" rx="0.5" fill="var(--text-tertiary)" opacity="0.4" />
        <rect x="7" y="16" width="6" height="2" rx="0.5" fill="var(--text-tertiary)" opacity="0.3" />
        <line x1="10" y1="10" x2="6" y2="5" stroke="var(--text-tertiary)" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <line x1="10" y1="10" x2="14" y2="5" stroke="var(--text-tertiary)" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <circle cx="6" cy="5" r="1.5" fill={isError ? 'var(--error)' : isSuccess ? 'var(--success)' : 'var(--accent)'} opacity="0.5" />
        <circle cx="14" cy="5" r="1.5" fill={isError ? 'var(--error)' : isSuccess ? 'var(--success)' : 'var(--accent)'} opacity="0.5" />
        {isSearching && (
          <path d="M5 2 Q10 -1 15 2" stroke="var(--text-tertiary)" strokeWidth="0.6" fill="none" opacity="0.25" className="receiver-search-signal" />
        )}
        {isActive && !isError && (
          <>
            <path d="M3 3 Q6 0 10 2" stroke="var(--accent)" strokeWidth="0.8" fill="none" opacity="0.6" className="receiver-signal receiver-signal--1" />
            <path d="M10 2 Q14 0 17 3" stroke="var(--accent)" strokeWidth="0.8" fill="none" opacity="0.6" className="receiver-signal receiver-signal--2" />
            <path d="M1 1 Q5 -2 10 0" stroke="var(--accent)" strokeWidth="0.6" fill="none" opacity="0.3" className="receiver-signal receiver-signal--3" />
            <path d="M10 0 Q15 -2 19 1" stroke="var(--accent)" strokeWidth="0.6" fill="none" opacity="0.3" className="receiver-signal receiver-signal--4" />
          </>
        )}
        {isError && (
          <>
            <path d="M3 1 Q6 -2 10 1" stroke="var(--error)" strokeWidth="0.6" fill="none" opacity="0.5" className="receiver-smoke receiver-smoke--1" />
            <path d="M7 0 Q10 -3 13 0" stroke="var(--error)" strokeWidth="0.6" fill="none" opacity="0.5" className="receiver-smoke receiver-smoke--2" />
            <path d="M10 1 Q14 -2 17 1" stroke="var(--error)" strokeWidth="0.6" fill="none" opacity="0.5" className="receiver-smoke receiver-smoke--3" />
          </>
        )}
      </svg>
      {nodeCount > 0 && (
        <div className="receiver-count">{executedNodeCount}/{nodeCount}</div>
      )}
    </div>
  )
})

ReceiverStation.displayName = 'ReceiverStation'

const CircuitCrashEffect: React.FC<{ isError: boolean; flightDist: number }> = memo(({ isError, flightDist }) => {
  if (!isError) return null

  const smokePositions = [
    { x: -4, y: 2, delay: '0ms', size: 6 },
    { x: 3, y: 4, delay: '100ms', size: 5 },
    { x: -1, y: 6, delay: '200ms', size: 7 },
  ]

  return (
    <>
      {smokePositions.map((smoke, i) => (
        <div
          key={i}
          className="circuit-crash-smoke"
          style={{ left: flightDist + 11 + smoke.x, top: 11 + smoke.y, width: smoke.size, height: smoke.size, animationDelay: smoke.delay }}
        />
      ))}
    </>
  )
})

CircuitCrashEffect.displayName = 'CircuitCrashEffect'

export default function CircuitBar() {
  const circuitState = useWorkflowAnimationStore((s) => s.circuitState)
  const nodeCount = useWorkflowAnimationStore((s) => s.nodeCount)
  const executedNodeCount = useWorkflowAnimationStore((s) => s.executedNodeCount)
  const showComboText = useWorkflowAnimationStore((s) => s.showComboText)
  const comboLevel = useWorkflowAnimationStore((s) => s.comboLevel)

  const stationRef = useRef<HTMLDivElement>(null)
  const signalRef = useRef<HTMLDivElement>(null)
  const receiverRef = useRef<HTMLDivElement>(null)

  const { flightDistRef } = useCircuitAnimation(signalRef, stationRef, receiverRef)

  const [isSleeping, setIsSleeping] = useState(false)
  const lastActivityRef = useRef<number>(Date.now())
  const idleTimerRef = useRef<number>(0)

  useEffect(() => {
    if (circuitState === 'running' || circuitState === 'error') {
      setIsSleeping(false)
      clearTimeout(idleTimerRef.current)
      return
    }
    if (circuitState === 'idle') {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = window.setTimeout(() => { setIsSleeping(true) }, 20000)
      return
    }
    lastActivityRef.current = Date.now()
    setIsSleeping(false)
  }, [circuitState])

  useEffect(() => {
    const handler = () => {
      lastActivityRef.current = Date.now()
      setIsSleeping(false)
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = window.setTimeout(() => { setIsSleeping(true) }, 20000)
    }
    window.addEventListener('mousemove', handler, { passive: true })
    window.addEventListener('keydown', handler, { passive: true })
    return () => { window.removeEventListener('mousemove', handler); window.removeEventListener('keydown', handler) }
  }, [])

  const isError = circuitState === 'error'

  return (
    <ErrorBoundary>
      <div className="circuit-bar">
        {showComboText && comboLevel > 0 && (
          <div className={`combo-display combo-level-${comboLevel}`}>
            {COMBO_TEXTS[comboLevel]}
          </div>
        )}

        <div className="circuit-bar__station" ref={stationRef}>
          <CircuitStation circuitState={circuitState} />
        </div>

        <div className="circuit-bar__flight-area">
          <div
            ref={signalRef}
            className="signal-position"
            style={{ transform: 'translate3d(0,0,0) scale(1)', opacity: 0.85 }}
          >
            <div className={`signal-bob ${circuitState === 'idle' || circuitState === 'running' ? 'signal-bob--active' : ''} ${isSleeping && circuitState === 'idle' ? 'signal-bob--sleeping' : ''}`}>
              <EnergySignal circuitState={circuitState} />
              <CircuitSpeechBubble circuitState={circuitState} isSleeping={isSleeping} signalRef={signalRef} />
            </div>
          </div>

          <CircuitCrashEffect isError={isError} flightDist={flightDistRef.current} />
        </div>

        <div className="circuit-bar__receiver" ref={receiverRef}>
          <ReceiverStation circuitState={circuitState} nodeCount={nodeCount} executedNodeCount={executedNodeCount} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
