import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useFloating,
  autoUpdate,
  offset as floatingOffset,
  shift,
  useInteractions,
  useHover,
  useRole,
  useDismiss,
  safePolygon,
  FloatingPortal,
  useTransitionStatus,
} from '@floating-ui/react'
import { wisdomQuotes } from '@/data/wisdom-quotes'
import './sidebar-wisdom.css'

const UPDATE_INTERVAL = 2 * 60 * 60 * 1000
const FADE_DURATION = 600
const MAX_MANUAL_SWITCH = 3

function getInitialIndex(): number {
  const now = Date.now()
  return Math.floor((now / UPDATE_INTERVAL) % wisdomQuotes.length)
}

export default function SidebarWisdom() {
  const [quoteIndex, setQuoteIndex] = useState(getInitialIndex)
  const [opacity, setOpacity] = useState(1)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [manualCount, setManualCount] = useState(0)
  const fadeTimerRef = useRef<number | null>(null)

  const currentQuote = wisdomQuotes[quoteIndex]
  const canSwitch = manualCount < MAX_MANUAL_SWITCH

  const switchToNext = useCallback(() => {
    if (!canSwitch) return
    setOpacity(0)
    fadeTimerRef.current = window.setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % wisdomQuotes.length)
      setOpacity(1)
      setManualCount((prev) => prev + 1)
    }, FADE_DURATION)
  }, [canSwitch])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOpacity(0)
      fadeTimerRef.current = window.setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % wisdomQuotes.length)
        setOpacity(1)
      }, FADE_DURATION)
    }, UPDATE_INTERVAL)

    return () => {
      clearInterval(timer)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [])

  const { refs, floatingStyles, context } = useFloating({
    open: hoverOpen,
    onOpenChange: setHoverOpen,
    placement: 'right-start',
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset(12),
      shift({ padding: 8 }),
    ],
  })

  const { isMounted, status } = useTransitionStatus(context, {
    duration: { open: 200, close: 150 },
  })

  const hover = useHover(context, {
    move: false,
    delay: { open: 200, close: 0 },
    handleClose: safePolygon({ buffer: 1 }),
  })
  const role = useRole(context, { role: 'tooltip' })
  const dismiss = useDismiss(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    role,
    dismiss,
  ])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hoverOpen) {
        setHoverOpen(false)
      }
    },
    [hoverOpen]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      <div className="sidebar-wisdom">
        <div
          ref={refs.setReference}
          className={`wisdom-content ${canSwitch ? 'wisdom-content--clickable' : ''}`}
          {...getReferenceProps({
            onClick: canSwitch ? switchToNext : undefined,
          })}
          aria-label={currentQuote.text}
        >
          <span
            className="wisdom-text"
            style={{ opacity }}
          >
            {currentQuote.text}
          </span>
        </div>
      </div>
      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              '--wisdom-card-tx': '-4px',
            } as React.CSSProperties}
            className={`wisdom-card-wrapper ${status === 'open' ? 'wisdom-card-enter' : 'wisdom-card-exit'}`}
            {...getFloatingProps()}
          >
            <div className="wisdom-card">
              <p className="wisdom-card-explanation">{currentQuote.explanation}</p>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
