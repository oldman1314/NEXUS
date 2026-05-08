import { memo, useState, useCallback, useMemo } from 'react'
import { useDataTableStore } from '@/stores/useDataTableStore'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import './data-pulse-bar.css'

type PulseState = 'idle' | 'loading' | 'complete' | 'error'

const DataSource: React.FC<{ state: PulseState; hovered: boolean }> = memo(({ state, hovered }) => {
  const isActive = state === 'loading' || state === 'complete' || state === 'error'

  return (
    <div className={`pulse-source ${isActive ? 'pulse-source--active' : ''} ${hovered ? 'pulse-source--enhanced' : ''}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="3" width="14" height="16" rx="2" className="pulse-stroke" strokeWidth="1.2" opacity="0.5" />
        <line x1="7" y1="7" x2="15" y2="7" className="pulse-stroke" strokeWidth="1" opacity="0.35" />
        <line x1="7" y1="11" x2="15" y2="11" className="pulse-stroke" strokeWidth="1" opacity="0.35" />
        <line x1="7" y1="15" x2="12" y2="15" className="pulse-stroke" strokeWidth="1" opacity="0.35" />
        <circle cx="16" cy="16" r="2.5" className={`pulse-fill ${isActive ? 'pulse-source-dot--blink' : ''}`} opacity={isActive ? 0.8 : 0.3} />
      </svg>
    </div>
  )
})

DataSource.displayName = 'DataSource'

const PulsePipe: React.FC<{ state: PulseState; hovered: boolean }> = memo(({ state, hovered }) => {
  const isLoading = state === 'loading'
  const isError = state === 'error'

  const packetStyles = useMemo(() => [
    { '--fly-end': `calc(${75 + Math.random() * 25}% - 5px)`, animationDelay: '0ms' } as React.CSSProperties,
    { '--fly-end': `calc(${70 + Math.random() * 30}% - 5px)`, animationDelay: '400ms' } as React.CSSProperties,
    { '--fly-end': `calc(${68 + Math.random() * 32}% - 5px)`, animationDelay: '800ms' } as React.CSSProperties,
  ], [])

  return (
    <div className={`pulse-pipe ${isLoading ? 'pulse-pipe--loading' : ''} ${isError ? 'pulse-pipe--error' : ''} ${hovered ? 'pulse-pipe--enhanced' : ''}`}>
      <div className="pulse-pipe-track" />
      {isLoading && (
        <>
          <div className="pulse-pipe-flow" />
          {packetStyles.map((style, i) => (
            <div key={i} className="pulse-pipe-packet" style={style} />
          ))}
        </>
      )}
      {isError && (
        <>
          <div className="pulse-pipe-break pulse-pipe-break--left" />
          <div className="pulse-pipe-break pulse-pipe-break--right" />
          <div className="pulse-pipe-spark" />
        </>
      )}
    </div>
  )
})

PulsePipe.displayName = 'PulsePipe'

const DataTerminal: React.FC<{ state: PulseState; hovered: boolean }> = memo(({ state, hovered }) => {
  const isComplete = state === 'complete'
  const isError = state === 'error'
  const isIdle = state === 'idle'

  return (
    <div
      className={`pulse-terminal ${isComplete ? 'pulse-terminal--complete' : ''} ${isError ? 'pulse-terminal--error' : ''} ${isIdle ? 'pulse-terminal--idle' : ''} ${hovered ? 'pulse-terminal--enhanced' : ''}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" className="pulse-stroke" strokeWidth="1.2" opacity="0.5" />
        <rect x="5" y="6" width="14" height="10" rx="1" className="pulse-fill" opacity="0.06" />

        {isComplete && (
          <g className="pulse-terminal-chart">
            <rect x="7" y="12" width="2.5" height="4" rx="0.5" className="pulse-terminal-bar pulse-terminal-bar--1" opacity="0.9" />
            <rect x="10.5" y="9" width="2.5" height="7" rx="0.5" className="pulse-terminal-bar pulse-terminal-bar--2" opacity="0.9" />
            <rect x="14" y="11" width="2.5" height="5" rx="0.5" className="pulse-terminal-bar pulse-terminal-bar--3" opacity="0.9" />
          </g>
        )}

        {isError && (
          <g className="pulse-terminal-cross">
            <line x1="8" y1="9" x2="16" y2="15" className="pulse-stroke" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="9" x2="8" y2="15" className="pulse-stroke" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {isIdle && (
          <g className="pulse-terminal-cursor">
            <rect x="7" y="10" width="1.5" height="5" rx="0.5" className="pulse-fill" opacity="0.5" />
          </g>
        )}

        <circle cx="12" cy="19" r="1.2" className={`pulse-fill pulse-terminal-status ${isError ? 'pulse-terminal-status--blink' : ''}`} opacity={isComplete ? 0.9 : isError ? 0.7 : 0.25} />
      </svg>
    </div>
  )
})

DataTerminal.displayName = 'DataTerminal'

export default function DataPulseBar() {
  const loading = useDataTableStore((s) => s.loading)
  const data = useDataTableStore((s) => s.data)
  const error = useDataTableStore((s) => s.error)
  const [hovered, setHovered] = useState(false)

  const pulseState: PulseState = error
    ? 'error'
    : loading
      ? 'loading'
      : data.length > 0
        ? 'complete'
        : 'idle'

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => setHovered(false), [])

  return (
    <ErrorBoundary>
      <div
        className="data-pulse-bar"
        data-pulse-state={pulseState}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`data-pulse-container ${hovered ? 'data-pulse-container--enhanced' : ''}`}>
          <DataSource state={pulseState} hovered={hovered} />
          <PulsePipe state={pulseState} hovered={hovered} />
          <DataTerminal state={pulseState} hovered={hovered} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
