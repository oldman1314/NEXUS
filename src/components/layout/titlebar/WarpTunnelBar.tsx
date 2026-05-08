import { useRef, useEffect, memo, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRemoteToolsAnimationStore } from '@/stores/useRemoteToolsAnimationStore'
import type { WarpTunnelState } from '@/types'
import { useWarpTunnelAnimation } from '@/hooks/useWarpTunnelAnimation'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import './warp-tunnel-bar.css'

const WARP_SIGNAL_SIZE = 22

const WARP_SPEECH: Record<WarpTunnelState, string[]> = {
  idle: ['Ready! ✨', 'Standing by~', 'Awaiting signal... 📡'],
  connecting: ['Tunneling... 🌀', 'Establishing link~', 'Warp drive charging! ⚡'],
  connected: ['Warp speed! 🚀', 'Tunnel stable!', 'Connected! 🌐'],
  error: ['Connection lost! 💥', 'Tunnel collapsed! 🆘', 'Signal jammed! ⚠️'],
}

const WARP_SLEEP_SPEECH = ['*static* 💤', '*zzz* 😴', 'Hibernating... 🥱']

const COMBO_TEXTS = ['', '3 Combo! 🌀', '5 Combo! 🌀🌀', '10 Combo! 🚀🌀🌀🌀']

function getSpeech(state: WarpTunnelState): string {
  const options = WARP_SPEECH[state] || WARP_SPEECH.idle
  return options[Math.floor(Math.random() * options.length)]
}

const WarpSignalSVG: React.FC<{ state: WarpTunnelState; error: boolean; sleeping: boolean }> = memo(({ state, error, sleeping }) => {
  const isConnecting = state === 'connecting'
  const isConnected = state === 'connected'
  const isError = state === 'error'

  const signalColor = error
    ? 'var(--error, #FF3B30)'
    : isConnected
      ? 'var(--success, #34C759)'
      : 'var(--accent, #007AFF)'

  return (
    <svg
      className={`warp-svg ${sleeping ? 'warp-svg--sleeping' : ''}`}
      width={WARP_SIGNAL_SIZE}
      height={WARP_SIGNAL_SIZE}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="warp-signal-body">
        <path d="M18 6 L28 18 L18 30 L8 18 Z" stroke={signalColor} strokeWidth="1.2" fill="none" opacity="0.6" />
        <path d="M18 10 L24 18 L18 26 L12 18 Z" fill={signalColor} opacity={isConnecting || isConnected ? 0.3 : 0.15} />
        <circle cx="18" cy="18" r="2.5" fill={signalColor} opacity={isError ? 0.4 : 0.8} />
        {isConnecting && (
          <>
            <circle cx="18" cy="18" r="5" stroke={signalColor} strokeWidth="0.6" fill="none" opacity="0.3" className="warp-signal-ring" />
            <circle cx="18" cy="18" r="8" stroke={signalColor} strokeWidth="0.4" fill="none" opacity="0.15" className="warp-signal-ring-outer" />
          </>
        )}
        {isConnected && (
          <>
            <line x1="14" y1="18" x2="10" y2="18" stroke={signalColor} strokeWidth="0.8" opacity="0.5" />
            <line x1="22" y1="18" x2="26" y2="18" stroke={signalColor} strokeWidth="0.8" opacity="0.5" />
            <line x1="18" y1="14" x2="18" y2="10" stroke={signalColor} strokeWidth="0.8" opacity="0.5" />
            <line x1="18" y1="22" x2="18" y2="26" stroke={signalColor} strokeWidth="0.8" opacity="0.5" />
          </>
        )}
        {isError && (
          <>
            <line x1="15" y1="15" x2="21" y2="21" stroke="var(--error)" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
            <line x1="21" y1="15" x2="15" y2="21" stroke="var(--error)" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  )
})

WarpSignalSVG.displayName = 'WarpSignalSVG'

const LocalGateway: React.FC<{ state: WarpTunnelState }> = memo(({ state }) => {
  const isActive = state === 'connected'
  const isConnecting = state === 'connecting'
  const isError = state === 'error'

  return (
    <div className={`local-gateway ${isActive ? 'local-gateway--active' : ''} ${isConnecting ? 'local-gateway--connecting' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="var(--text-tertiary)" strokeWidth="1" opacity="0.3" />
        <circle cx="10" cy="10" r="6" className="gateway-ring" stroke="var(--accent)" strokeWidth="0.8" opacity="0.2" fill="none" />
        <circle cx="10" cy="10" r="6" className={`gateway-ring ${isConnecting ? 'gateway-ring--fast' : 'gateway-ring--spinning'}`} stroke="var(--accent)" strokeWidth="0.5" opacity="0.15" fill="none" strokeDasharray="3 3" />
        <text x="10" y="13.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--text-tertiary)" opacity="0.5" fontFamily="var(--font-mono)">&gt;_</text>
        <circle cx="10" cy="3" r="1.2" fill={isError ? 'var(--error)' : isActive ? 'var(--success)' : 'var(--accent)'} className={`gateway-led gateway-led--top ${isError ? 'gateway-led--error' : ''}`} />
        <circle cx="17" cy="10" r="1.2" fill={isError ? 'var(--error)' : isActive ? 'var(--success)' : 'var(--accent)'} className={`gateway-led gateway-led--right ${isError ? 'gateway-led--error' : ''}`} />
        <circle cx="10" cy="17" r="1.2" fill={isError ? 'var(--error)' : isActive ? 'var(--success)' : 'var(--accent)'} className={`gateway-led gateway-led--bottom ${isError ? 'gateway-led--error' : ''}`} />
        <circle cx="3" cy="10" r="1.2" fill={isError ? 'var(--error)' : isActive ? 'var(--success)' : 'var(--accent)'} className={`gateway-led gateway-led--left ${isError ? 'gateway-led--error' : ''}`} />
        {(isActive || isConnecting) && (
          <circle cx="10" cy="10" r="12" fill="none" stroke="var(--accent)" strokeWidth="0.5" opacity="0.15" className="gateway-glow gateway-glow--on" />
        )}
      </svg>
    </div>
  )
})

LocalGateway.displayName = 'LocalGateway'

const RemoteBeacon: React.FC<{ state: WarpTunnelState; activeSessions: number }> = memo(({ state, activeSessions }) => {
  const isActive = state === 'connected'
  const isConnecting = state === 'connecting'
  const isError = state === 'error'
  const isIdle = state === 'idle'

  const beaconColor = isError ? 'var(--error)' : isActive ? 'var(--success)' : 'var(--accent)'

  return (
    <div className={`remote-beacon ${isActive ? 'remote-beacon--active' : ''} ${isConnecting ? 'remote-beacon--searching' : ''}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="2" width="14" height="18" rx="2" stroke="var(--text-tertiary)" strokeWidth="1" opacity="0.3" fill="none" />
        <rect x="6" y="4" width="10" height="3" rx="1" fill={beaconColor} opacity={isActive ? 0.5 : 0.15} />
        <rect x="6" y="9" width="10" height="3" rx="1" fill={beaconColor} opacity={isActive ? 0.5 : 0.15} />
        <rect x="6" y="14" width="10" height="3" rx="1" fill={beaconColor} opacity={isActive ? 0.5 : 0.15} />
        <circle cx="8" cy="5.5" r="0.8" fill={isActive ? 'var(--success)' : beaconColor} opacity={isActive ? 0.9 : 0.4} className={isIdle ? 'beacon-breathe' : ''} />
        <circle cx="8" cy="10.5" r="0.8" fill={isActive ? 'var(--success)' : beaconColor} opacity={isActive ? 0.9 : 0.4} className={isIdle ? 'beacon-breathe' : ''} />
        <circle cx="8" cy="15.5" r="0.8" fill={isActive ? 'var(--success)' : beaconColor} opacity={isActive ? 0.9 : 0.4} className={isIdle ? 'beacon-breathe' : ''} />
        {isConnecting && (
          <>
            <rect x="6" y="4" width="10" height="3" rx="1" fill={beaconColor} opacity="0.3" className="beacon-unit-flash" />
            <rect x="6" y="9" width="10" height="3" rx="1" fill={beaconColor} opacity="0.3" className="beacon-unit-flash beacon-unit-flash--2" />
          </>
        )}
        {isActive && !isError && (
          <>
            <line x1="14" y1="5" x2="14.5" y2="5" stroke={beaconColor} strokeWidth="0.8" opacity="0.6" strokeLinecap="round" className="beacon-data-led" />
            <line x1="15" y1="5" x2="15.5" y2="5" stroke={beaconColor} strokeWidth="0.8" opacity="0.6" strokeLinecap="round" className="beacon-data-led beacon-data-led--2" />
            <line x1="14" y1="10" x2="14.5" y2="10" stroke={beaconColor} strokeWidth="0.8" opacity="0.6" strokeLinecap="round" className="beacon-data-led beacon-data-led--3" />
            <line x1="15" y1="10" x2="15.5" y2="10" stroke={beaconColor} strokeWidth="0.8" opacity="0.6" strokeLinecap="round" className="beacon-data-led beacon-data-led--4" />
          </>
        )}
        {isError && (
          <>
            <line x1="7" y1="4.5" x2="9" y2="6.5" stroke="var(--error)" strokeWidth="0.8" opacity="0.7" strokeLinecap="round" />
            <line x1="9" y1="4.5" x2="7" y2="6.5" stroke="var(--error)" strokeWidth="0.8" opacity="0.7" strokeLinecap="round" />
            <circle cx="11" cy="1" r="0.6" fill="var(--error)" opacity="0.5" className="beacon-spark beacon-spark--1" />
            <circle cx="13" cy="1.5" r="0.5" fill="var(--error)" opacity="0.4" className="beacon-spark beacon-spark--2" />
          </>
        )}
      </svg>
      {activeSessions > 0 && (
        <div className="beacon-count">{activeSessions}</div>
      )}
    </div>
  )
})

RemoteBeacon.displayName = 'RemoteBeacon'

const WarpTunnelLines: React.FC<{ state: WarpTunnelState; hasTarget: boolean }> = memo(({ state, hasTarget }) => {
  const lineClass = state === 'connecting'
    ? 'warp-tunnel-line--connecting'
    : state === 'connected'
      ? 'warp-tunnel-line--connected'
      : state === 'error'
        ? 'warp-tunnel-line--error'
        : ''

  const unreachableClass = !hasTarget && state === 'idle' ? 'warp-tunnel-line--unreachable' : ''

  return (
    <div className="warp-tunnel-lines">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`warp-tunnel-line warp-tunnel-line--${i} ${lineClass} ${unreachableClass}`} />
      ))}
    </div>
  )
})

WarpTunnelLines.displayName = 'WarpTunnelLines'

const WarpParticles: React.FC<{ state: WarpTunnelState; hasTarget: boolean }> = memo(({ state, hasTarget }) => {
  const idleStyles = useMemo(() => [
    { '--fly-end': `${72 + Math.random() * 28}%` } as React.CSSProperties,
    { '--fly-end': `${65 + Math.random() * 30}%` } as React.CSSProperties,
    { '--fly-end': `${70 + Math.random() * 30}%` } as React.CSSProperties,
  ], [])

  const connectingStyles = useMemo(() => [
    { '--fly-end': `${85 + Math.random() * 15}%` } as React.CSSProperties,
    { '--fly-end': `${88 + Math.random() * 12}%` } as React.CSSProperties,
    { '--fly-end': `${82 + Math.random() * 18}%` } as React.CSSProperties,
  ], [])

  const connectedStyles = useMemo(() => [
    { '--fly-end': `${90 + Math.random() * 10}%` } as React.CSSProperties,
    { '--fly-end': `${92 + Math.random() * 8}%` } as React.CSSProperties,
    { '--fly-end': `${88 + Math.random() * 12}%` } as React.CSSProperties,
  ], [])

  const blockedStyles = useMemo(() => [
    { '--fly-peak': `${38 + Math.random() * 14}%` } as React.CSSProperties,
    { '--fly-peak': `${42 + Math.random() * 16}%` } as React.CSSProperties,
    { '--fly-peak': `${35 + Math.random() * 18}%` } as React.CSSProperties,
  ], [])

  if (!hasTarget && state === 'idle') {
    return (
      <>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`warp-particle warp-particle--blocked warp-particle--${i}`} style={blockedStyles[i - 1]} />
        ))}
      </>
    )
  }

  const particleClass = state === 'connecting'
    ? 'warp-particle--connecting'
    : state === 'connected'
      ? 'warp-particle--connected'
      : state === 'error'
        ? 'warp-particle--error'
        : 'warp-particle--idle'

  const styles = state === 'connecting'
    ? connectingStyles
    : state === 'connected'
      ? connectedStyles
      : idleStyles

  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className={`warp-particle ${particleClass} warp-particle--${i}`} style={styles[i - 1]}>
          {state === 'connected' && <div className="warp-particle-trail" />}
          {state === 'connecting' && <div className="warp-particle-glow" />}
        </div>
      ))}
    </>
  )
})

WarpParticles.displayName = 'WarpParticles'

const WarpSpeechBubble: React.FC<{
  tunnelState: WarpTunnelState
  isSleeping: boolean
  signalRef: React.RefObject<HTMLDivElement | null>
}> = memo(({ tunnelState, isSleeping, signalRef }) => {
  const [speechText, setSpeechText] = useState('')
  const [speechVisible, setSpeechVisible] = useState(false)
  const [sleepBubblePos, setSleepBubblePos] = useState({ top: 0, left: 0 })
  const [portalContainer] = useState(() => {
    const el = document.createElement('div')
    el.className = 'warp-sleep-portal'
    return el
  })

  useEffect(() => {
    document.body.appendChild(portalContainer)
    return () => {
      portalContainer.remove()
    }
  }, [portalContainer])

  useEffect(() => {
    if (tunnelState === 'idle' && !isSleeping) {
      const text = getSpeech(tunnelState)
      setSpeechText(text)
      setSpeechVisible(true)

      const timer = window.setTimeout(() => {
        setSpeechVisible(false)
      }, 2000)

      return () => clearTimeout(timer)
    }

    if (isSleeping && tunnelState === 'idle') {
      const showSpeech = () => {
        const text = WARP_SLEEP_SPEECH[Math.floor(Math.random() * WARP_SLEEP_SPEECH.length)]
        setSpeechText(text)
        setSpeechVisible(true)

        if (signalRef.current) {
          const rect = signalRef.current.getBoundingClientRect()
          setSleepBubblePos({
            top: rect.top + rect.height / 2,
            left: rect.right + 6,
          })
        }

        const hideTimer = window.setTimeout(() => {
          setSpeechVisible(false)
        }, 3000)

        return hideTimer
      }

      let hideTimer = showSpeech()
      const loopTimer = window.setInterval(() => {
        if (hideTimer) clearTimeout(hideTimer)
        hideTimer = showSpeech()
      }, 8000)

      return () => {
        clearTimeout(hideTimer)
        clearInterval(loopTimer)
      }
    }

    const text = getSpeech(tunnelState)
    setSpeechText(text)
    setSpeechVisible(true)

    const timer = window.setTimeout(() => {
      setSpeechVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [tunnelState, isSleeping, signalRef])

  if (isSleeping && tunnelState === 'idle' && speechVisible) {
    return createPortal(
      <div
        className="warp-speech warp-speech--sleeping warp-speech--portal warp-speech--visible"
        style={{
          position: 'fixed',
          top: sleepBubblePos.top,
          left: sleepBubblePos.left,
        }}
      >
        {speechText}
      </div>,
      portalContainer
    )
  }

  if (!speechVisible) return null

  return (
    <div className={`warp-speech warp-speech--visible ${isSleeping ? 'warp-speech--sleeping' : ''}`}>
      {speechText}
    </div>
  )
})

WarpSpeechBubble.displayName = 'WarpSpeechBubble'

const WarpCrashEffect: React.FC<{
  isError: boolean
  errorMessage: string
  flightDist: number
}> = memo(({ isError, errorMessage, flightDist }) => {
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
          className="warp-crash-smoke"
          style={{
            left: flightDist + WARP_SIGNAL_SIZE / 2 + smoke.x,
            top: WARP_SIGNAL_SIZE / 2 + smoke.y,
            width: smoke.size,
            height: smoke.size,
            animationDelay: smoke.delay,
          }}
        />
      ))}
      <div
        className="warp-spark"
        style={{
          left: flightDist + WARP_SIGNAL_SIZE / 2 - 6,
          top: WARP_SIGNAL_SIZE / 2 - 4,
        }}
      />
      <div
        className="warp-spark"
        style={{
          left: flightDist + WARP_SIGNAL_SIZE / 2 + 4,
          top: WARP_SIGNAL_SIZE / 2 + 2,
          animationDelay: '100ms',
        }}
      />
      {errorMessage && (
        <div
          className="warp-crash-text"
          style={{ left: flightDist + WARP_SIGNAL_SIZE / 2 }}
        >
          {errorMessage}
        </div>
      )}
    </>
  )
})

WarpCrashEffect.displayName = 'WarpCrashEffect'

export default function WarpTunnelBar() {
  const tunnelState = useRemoteToolsAnimationStore((s) => s.tunnelState)
  const activeSessions = useRemoteToolsAnimationStore((s) => s.activeSessions)
  const errorMessage = useRemoteToolsAnimationStore((s) => s.errorMessage)
  const showComboText = useRemoteToolsAnimationStore((s) => s.showComboText)
  const comboLevel = useRemoteToolsAnimationStore((s) => s.comboLevel)
  const cleanup = useRemoteToolsAnimationStore((s) => s.cleanup)

  const gatewayRef = useRef<HTMLDivElement>(null)
  const beaconRef = useRef<HTMLDivElement>(null)
  const signalRef = useRef<HTMLDivElement>(null)

  const { flightDistRef } = useWarpTunnelAnimation(signalRef, gatewayRef, beaconRef)

  const [isSleeping, setIsSleeping] = useState(false)
  const lastActivityRef = useRef<number>(Date.now())
  const idleTimerRef = useRef<number>(0)

  useEffect(() => {
    if (tunnelState === 'connecting' || tunnelState === 'error') {
      setIsSleeping(false)
      clearTimeout(idleTimerRef.current)
      return
    }
    if (tunnelState === 'idle') {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = window.setTimeout(() => { setIsSleeping(true) }, 20000)
      return
    }
    lastActivityRef.current = Date.now()
    setIsSleeping(false)
  }, [tunnelState])

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

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const isError = tunnelState === 'error'
  const hasTarget = activeSessions > 0

  return (
    <ErrorBoundary>
      <div className="warp-tunnel-bar">
        {showComboText && comboLevel > 0 && (
          <div className={`combo-display combo-level-${comboLevel}`}>
            {COMBO_TEXTS[comboLevel]}
          </div>
        )}

        <div className="warp-tunnel-bar__gateway" ref={gatewayRef}>
          <LocalGateway state={tunnelState} />
        </div>

        <div className="warp-tunnel-bar__flight-area">
          <WarpTunnelLines state={tunnelState} hasTarget={hasTarget} />
          <WarpParticles state={tunnelState} hasTarget={hasTarget} />

          <div
            ref={signalRef}
            className="warp-signal-position"
            style={{
              transform: 'translate3d(0,0,0) scale(1)',
              opacity: 0.85,
            }}
          >
            <div className={`warp-signal-bob ${tunnelState === 'idle' || tunnelState === 'connecting' ? 'warp-signal-bob--active' : ''} ${isSleeping && tunnelState === 'idle' ? 'warp-signal-bob--sleeping' : ''}`}>
              <WarpSignalSVG state={tunnelState} error={isError} sleeping={isSleeping && tunnelState === 'idle'} />
              <WarpSpeechBubble tunnelState={tunnelState} isSleeping={isSleeping} signalRef={signalRef} />
            </div>
          </div>

          <WarpCrashEffect
            isError={isError}
            errorMessage={errorMessage}
            flightDist={flightDistRef.current}
          />
        </div>

        <div className="warp-tunnel-bar__beacon" ref={beaconRef}>
          <RemoteBeacon state={tunnelState} activeSessions={activeSessions} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
