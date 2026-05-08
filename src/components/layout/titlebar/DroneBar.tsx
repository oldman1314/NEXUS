import { useRef, useEffect, memo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAnimationStore } from '@/stores/useAnimationStore'
import type { DroneState } from '@/types'
import { useDroneAnimation } from '@/hooks/useDroneAnimation'
import { useDroneIdle } from '@/hooks/useDroneIdle'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import './drone-bar.css'

const DRONE_SIZE = 22

const DRONE_SPEECH: Record<string, string[]> = {
  idle: ['Ready! ✨', 'Standing by~', 'Let\'s go! 🚀'],
  launching: ['Taking off! 🛫', 'Up up up!', 'Here we go~ 🎉'],
  flying: ['Flying to server... 📡', 'On my way~', 'Almost there! ✈️'],
  hovering: ['Fetching data... 📦', 'Hang tight...', 'Downloading... ⬇️'],
  landing: ['Got the package! 🎁', 'Mission complete!', 'Coming home~ 🏠'],
  crashed: ['Oops! 💥', 'Mayday! 🆘', 'Engine failure! ⚠️'],
}

const DRONE_SLEEP_SPEECH = ['*snore* 💤', '*zzz* 😴', 'So tired... 🥱']

const COMBO_TEXTS = ['', '3 Combo! 🔥', '5 Combo! 🔥🔥', '10 Combo! 🚀🔥🔥🔥']

function getSpeech(state: DroneState): string {
  const options = DRONE_SPEECH[state] || DRONE_SPEECH.idle
  return options[Math.floor(Math.random() * options.length)]
}




const DroneSVG: React.FC<{ state: DroneState; error: boolean; flying: boolean; sleeping: boolean; httpStatus?: number }> = memo(({ state, error, flying, sleeping, httpStatus }) => {
  const isHovering = state === 'hovering'
  const isLanding = state === 'landing'
  const isCrashed = state === 'crashed'
  const is500 = httpStatus === 500

  let packageFill = error
    ? 'var(--error, #FF3B30)'
    : isHovering
      ? 'var(--warning, #FF9500)'
      : 'var(--accent, #007AFF)'

  if (httpStatus === 201 && isLanding && !error) packageFill = 'var(--warning, #FFD60A)'
  if (is500) packageFill = 'var(--error, #FF3B30)'

  const bodyFill = error ? 'var(--error, #FF3B30)' : 'var(--accent, #007AFF)'

  return (
    <svg
      className={`drone-svg ${flying ? 'drone-svg--flying' : ''} ${isCrashed ? 'drone-svg--crashed' : ''} ${sleeping ? 'drone-svg--sleeping' : ''} ${is500 ? 'drone-svg--error500' : ''}`}
      width={DRONE_SIZE}
      height={DRONE_SIZE}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="drone-body-group">
        <rect className="drone-arm" x="5" y="15" width="26" height="2" rx="1" fill={bodyFill} opacity="0.45" />
        <rect className="drone-arm" x="15" y="5" width="2" height="26" rx="1" fill={bodyFill} opacity="0.45" />
        <rect className="drone-hull" x="12" y="12" width="8" height="8" rx="2.5" fill={bodyFill} />
        <circle className="drone-led" cx="16" cy="16" r="1.8" fill="white" opacity="0.9" />
      </g>
      <g className="drone-propeller drone-propeller-tl">
        <ellipse cx="8" cy="8" rx="5.5" ry="1.5" fill={bodyFill} opacity="0.3" />
      </g>
      <g className="drone-propeller drone-propeller-tr">
        <ellipse cx="24" cy="8" rx="5.5" ry="1.5" fill={bodyFill} opacity="0.3" />
      </g>
      <g className="drone-propeller drone-propeller-bl">
        <ellipse cx="8" cy="24" rx="5.5" ry="1.5" fill={bodyFill} opacity="0.3" />
      </g>
      <g className="drone-propeller drone-propeller-br">
        <ellipse cx="24" cy="24" rx="5.5" ry="1.5" fill={bodyFill} opacity="0.3" />
      </g>
      <g className="drone-package-group">
        <line className="drone-rope" x1="16" y1="20" x2="16" y2="25" stroke={bodyFill} strokeWidth="0.8" opacity="0.4" />
        <rect className="drone-package" x="12.5" y="25" width="7" height="5.5" rx="1.2" fill={packageFill} opacity={isLanding ? 0.75 : 0.55} />
        {isLanding && !error && httpStatus === 201 && (
          <circle cx="16" cy="27.5" r="2" fill="none" stroke="white" strokeWidth="0.6" opacity="0.6" className="drone-package-star" />
        )}
        {isLanding && !error && httpStatus !== 201 && (
          <>
            <rect x="14.5" y="27" width="3" height="0.8" rx="0.2" fill="white" opacity="0.5" />
            <rect x="14.5" y="28.2" width="2" height="0.8" rx="0.2" fill="white" opacity="0.35" />
          </>
        )}
        {isLanding && error && httpStatus !== 201 && (
          <>
            <line x1="14" y1="27" x2="18" y2="30" stroke="white" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
            <line x1="18" y1="27" x2="14" y2="30" stroke="white" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
          </>
        )}
        <line x1="16" y1="25.5" x2="16" y2="30" stroke="white" strokeWidth="0.6" opacity="0.3" />
      </g>
    </svg>
  )
})

DroneSVG.displayName = 'DroneSVG'

const LandingPad: React.FC<{ state: DroneState }> = memo(({ state }) => {
  const isActive = state === 'idle' || state === 'launching' || state === 'landing'
  const isWaiting = state === 'flying' || state === 'hovering'

  return (
    <div className={`landing-pad ${isActive ? 'landing-pad--active' : ''} ${isWaiting ? 'landing-pad--waiting' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="var(--text-tertiary)" strokeWidth="1" opacity="0.3" />
        <circle cx="10" cy="10" r="6" stroke="var(--text-tertiary)" strokeWidth="0.5" opacity="0.2" />
        <text x="10" y="13.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--text-tertiary)" opacity="0.4">H</text>
        <circle cx="10" cy="3" r="1.2" fill={isWaiting ? 'var(--warning)' : 'var(--success)'} className={`pad-light pad-light--top ${isActive ? 'pad-light--on' : ''} ${isWaiting ? 'pad-light--waiting' : ''}`} />
        <circle cx="17" cy="10" r="1.2" fill={isWaiting ? 'var(--warning)' : 'var(--success)'} className={`pad-light pad-light--right ${isActive ? 'pad-light--on' : ''} ${isWaiting ? 'pad-light--waiting' : ''}`} />
        <circle cx="10" cy="17" r="1.2" fill={isWaiting ? 'var(--warning)' : 'var(--success)'} className={`pad-light pad-light--bottom ${isActive ? 'pad-light--on' : ''} ${isWaiting ? 'pad-light--waiting' : ''}`} />
        <circle cx="3" cy="10" r="1.2" fill={isWaiting ? 'var(--warning)' : 'var(--success)'} className={`pad-light pad-light--left ${isActive ? 'pad-light--on' : ''} ${isWaiting ? 'pad-light--waiting' : ''}`} />
      </svg>
    </div>
  )
})

LandingPad.displayName = 'LandingPad'

const NetworkStationIcon: React.FC<{ state: DroneState; httpStatus?: number }> = memo(({ state, httpStatus }) => {
  const isActive = state === 'hovering' || state === 'flying' || state === 'crashed'
  const isSearching = state === 'idle' || state === 'launching'
  const is500 = httpStatus === 500

  return (
    <div className={`network-station ${isActive ? 'network-station--active' : ''} ${isSearching ? 'network-station--searching' : ''} ${is500 ? 'network-station--smoke' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="9" y="10" width="2" height="7" rx="0.5" fill="var(--text-tertiary)" opacity="0.4" />
        <rect x="7" y="16" width="6" height="2" rx="0.5" fill="var(--text-tertiary)" opacity="0.3" />
        <line x1="10" y1="10" x2="6" y2="5" stroke="var(--text-tertiary)" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <line x1="10" y1="10" x2="14" y2="5" stroke="var(--text-tertiary)" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <circle cx="6" cy="5" r="1.5" fill="var(--accent)" opacity="0.5" />
        <circle cx="14" cy="5" r="1.5" fill="var(--accent)" opacity="0.5" />
        {isSearching && (
          <path d="M5 2 Q10 -1 15 2" stroke="var(--text-tertiary)" strokeWidth="0.6" fill="none" opacity="0.25" className="station-search-signal" />
        )}
        {isActive && !is500 && (
          <>
            <path d="M3 3 Q6 0 10 2" stroke="var(--accent)" strokeWidth="0.8" fill="none" opacity="0.6" className="station-signal station-signal--1" />
            <path d="M10 2 Q14 0 17 3" stroke="var(--accent)" strokeWidth="0.8" fill="none" opacity="0.6" className="station-signal station-signal--2" />
            <path d="M1 1 Q5 -2 10 0" stroke="var(--accent)" strokeWidth="0.6" fill="none" opacity="0.3" className="station-signal station-signal--3" />
            <path d="M10 0 Q15 -2 19 1" stroke="var(--accent)" strokeWidth="0.6" fill="none" opacity="0.3" className="station-signal station-signal--4" />
          </>
        )}
        {is500 && (
          <>
            <path d="M3 1 Q6 -2 10 1" stroke="var(--error)" strokeWidth="0.6" fill="none" opacity="0.5" className="station-smoke station-smoke--1" />
            <path d="M7 0 Q10 -3 13 0" stroke="var(--error)" strokeWidth="0.6" fill="none" opacity="0.5" className="station-smoke station-smoke--2" />
            <path d="M10 1 Q14 -2 17 1" stroke="var(--error)" strokeWidth="0.6" fill="none" opacity="0.5" className="station-smoke station-smoke--3" />
          </>
        )}
      </svg>
    </div>
  )
})

NetworkStationIcon.displayName = 'NetworkStationIcon'

const DroneSpeechBubble: React.FC<{
  droneState: DroneState
  isSleeping: boolean
  droneRef: React.RefObject<HTMLDivElement | null>
}> = memo(({ droneState, isSleeping, droneRef }) => {
  const [speechText, setSpeechText] = useState('')
  const [speechVisible, setSpeechVisible] = useState(false)
  const [sleepBubblePos, setSleepBubblePos] = useState({ top: 0, left: 0 })
  const [portalContainer] = useState(() => {
    const el = document.createElement('div')
    el.className = 'drone-sleep-portal'
    return el
  })

  useEffect(() => {
    document.body.appendChild(portalContainer)
    return () => {
      portalContainer.remove()
    }
  }, [portalContainer])

  useEffect(() => {
    if (droneState === 'idle' && !isSleeping) {
      const text = getSpeech(droneState)
      setSpeechText(text)
      setSpeechVisible(true)

      const timer = window.setTimeout(() => {
        setSpeechVisible(false)
      }, 2000)

      return () => clearTimeout(timer)
    }

    if (isSleeping && droneState === 'idle') {
      const showSpeech = () => {
        const text = DRONE_SLEEP_SPEECH[Math.floor(Math.random() * DRONE_SLEEP_SPEECH.length)]
        setSpeechText(text)
        setSpeechVisible(true)

        if (droneRef.current) {
          const droneRect = droneRef.current.getBoundingClientRect()
          setSleepBubblePos({
            top: droneRect.top + droneRect.height / 2,
            left: droneRect.right + 6,
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

    const text = getSpeech(droneState)
    setSpeechText(text)
    setSpeechVisible(true)

    const timer = window.setTimeout(() => {
      setSpeechVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [droneState, isSleeping, droneRef])

  if (isSleeping && droneState === 'idle' && speechVisible) {
    return createPortal(
      <div
        className="drone-speech drone-speech--sleeping drone-speech--portal drone-speech--visible"
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
    <div className={`drone-speech drone-speech--visible ${isSleeping ? 'drone-speech--sleeping' : ''}`}>
      {speechText}
    </div>
  )
})

DroneSpeechBubble.displayName = 'DroneSpeechBubble'

const DroneCrashEffect: React.FC<{
  isCrashed: boolean
  errorMessage: string
  flightDist: number
}> = memo(({ isCrashed, errorMessage, flightDist }) => {
  if (!isCrashed) return null

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
          className="drone-crash-smoke"
          style={{
            left: flightDist + DRONE_SIZE / 2 + smoke.x,
            top: DRONE_SIZE / 2 + smoke.y,
            width: smoke.size,
            height: smoke.size,
            animationDelay: smoke.delay,
          }}
        />
      ))}
      {errorMessage && (
        <div
          className="drone-crash-text"
          style={{ left: flightDist + DRONE_SIZE / 2 }}
        >
          {errorMessage}
        </div>
      )}
    </>
  )
})

DroneCrashEffect.displayName = 'DroneCrashEffect'

export default function DroneBar() {
  const droneState = useAnimationStore((s) => s.droneState)
  const droneError = useAnimationStore((s) => s.droneError)
  const errorMessage = useAnimationStore((s) => s.errorMessage)
  const httpStatus = useAnimationStore((s) => s.httpStatus)
  const showComboText = useAnimationStore((s) => s.showComboText)
  const comboLevel = useAnimationStore((s) => s.comboLevel)
  const cleanup = useAnimationStore((s) => s.cleanup)

  const padRef = useRef<HTMLDivElement>(null)
  const stationRef = useRef<HTMLDivElement>(null)
  const droneRef = useRef<HTMLDivElement>(null)

  const { flightDistRef } = useDroneAnimation(droneRef, padRef, stationRef)
  const { isSleeping } = useDroneIdle()

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const isCrashed = droneState === 'crashed'
  const isFlying = droneState === 'flying' || droneState === 'landing'

  return (
    <ErrorBoundary>
      <div className="drone-bar">
        {showComboText && comboLevel > 0 && (
          <div className={`combo-display combo-level-${comboLevel}`}>
            {COMBO_TEXTS[comboLevel]}
          </div>
        )}

        <div className="drone-bar__pad" ref={padRef}>
          <LandingPad state={droneState} />
        </div>

        <div className="drone-bar__flight-area">
          <div
            ref={droneRef}
            className="drone-position"
            style={{
              transform: 'translate3d(0,0,0) scale(1)',
              opacity: 0.85,
            }}
          >
            <div className={`drone-bob ${droneState === 'idle' || droneState === 'hovering' ? 'drone-bob--active' : ''} ${isSleeping && droneState === 'idle' ? 'drone-bob--sleeping' : ''}`}>
              <DroneSVG state={droneState} error={droneError} flying={isFlying} sleeping={isSleeping && droneState === 'idle'} httpStatus={httpStatus} />
              <DroneSpeechBubble droneState={droneState} isSleeping={isSleeping} droneRef={droneRef} />
            </div>
          </div>

          <DroneCrashEffect
            isCrashed={isCrashed}
            errorMessage={errorMessage}
            flightDist={flightDistRef.current}
          />
        </div>

        <div className="drone-bar__station" ref={stationRef}>
          <NetworkStationIcon state={droneState} httpStatus={httpStatus} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
