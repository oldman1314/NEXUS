import { useRef, useEffect, useCallback, useState } from 'react'
import { useAnimationStore } from '@/stores/useAnimationStore'

const IDLE_SLEEP_THRESHOLD = 20000

export function useDroneIdle() {
  const droneState = useAnimationStore((s) => s.droneState)
  const requestStatus = useAnimationStore((s) => s.requestStatus)
  const [isSleeping, setIsSleeping] = useState(false)
  const lastActivityRef = useRef<number>(Date.now())
  const idleTimerRef = useRef<number>(0)

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setIsSleeping(false)
    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = window.setTimeout(() => {
      setIsSleeping(true)
    }, IDLE_SLEEP_THRESHOLD)
  }, [])

  useEffect(() => {
    if (droneState === 'launching' || droneState === 'flying' || droneState === 'landing' || droneState === 'crashed') {
      setIsSleeping(false)
      clearTimeout(idleTimerRef.current)
      return
    }
    if (droneState === 'idle') {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = window.setTimeout(() => {
        setIsSleeping(true)
      }, IDLE_SLEEP_THRESHOLD)
      return
    }
    resetIdleTimer()
  }, [droneState, resetIdleTimer])

  useEffect(() => {
    if (requestStatus === 'pending' || requestStatus === 'success' || requestStatus === 'error') {
      resetIdleTimer()
    }
  }, [requestStatus, resetIdleTimer])

  useEffect(() => {
    const handler = () => resetIdleTimer()
    window.addEventListener('mousemove', handler, { passive: true })
    window.addEventListener('keydown', handler, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [resetIdleTimer])

  useEffect(() => {
    return () => {
      clearTimeout(idleTimerRef.current)
    }
  }, [])

  return { isSleeping, resetIdleTimer }
}
