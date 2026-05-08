import { useRef, useLayoutEffect, useEffect } from 'react'
import { useAnimationStore } from '@/stores/useAnimationStore'

interface AnimTarget {
  x: number
  y: number
  scale: number
  rotate: number
  opacity: number
}

const STATE_TARGETS: Record<string, (dist: number) => AnimTarget> = {
  idle: () => ({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.85 }),
  launching: () => ({ x: 0, y: -10, scale: 1.05, rotate: 0, opacity: 1 }),
  flying: (d) => ({ x: d, y: -4, scale: 1, rotate: 0, opacity: 1 }),
  hovering: (d) => ({ x: d, y: 0, scale: 1, rotate: 0, opacity: 1 }),
  landing: () => ({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }),
  crashed: (d) => ({ x: d, y: 18, scale: 0.15, rotate: 220, opacity: 0 }),
}

const STATE_DURATIONS: Record<string, number> = {
  idle: 500,
  launching: 600,
  flying: 1400,
  hovering: 300,
  landing: 1200,
  crashed: 800,
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
function easeInCubic(t: number) { return t * t * t }

const STATE_EASING: Record<string, (t: number) => number> = {
  idle: easeOutCubic,
  launching: easeOutCubic,
  flying: easeInOutCubic,
  hovering: easeOutCubic,
  landing: easeOutCubic,
  crashed: easeInCubic,
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export function useDroneAnimation(
  droneRef: React.RefObject<HTMLDivElement | null>,
  padRef: React.RefObject<HTMLDivElement | null>,
  stationRef: React.RefObject<HTMLDivElement | null>,
) {
  const droneState = useAnimationStore((s) => s.droneState)
  const flightDistRef = useRef(200)
  const animRef = useRef(0)
  const currentPosRef = useRef<AnimTarget>({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.85 })
  const lastStateRef = useRef<string>('')

  useLayoutEffect(() => {
    const calculate = () => {
      if (!padRef.current || !stationRef.current) return
      const padRect = padRef.current.getBoundingClientRect()
      const stationRect = stationRef.current.getBoundingClientRect()
      const dist = stationRect.left - padRect.left
      if (dist > 0) flightDistRef.current = dist
    }
    calculate()
    window.addEventListener('resize', calculate)
    return () => window.removeEventListener('resize', calculate)
  }, [padRef, stationRef])

  useEffect(() => {
    const el = droneRef.current
    if (!el) return

    const dist = flightDistRef.current
    const target = STATE_TARGETS[droneState]?.(dist)
    if (!target) return

    if (lastStateRef.current === droneState) return
    lastStateRef.current = droneState

    cancelAnimationFrame(animRef.current)

    const from: AnimTarget = { ...currentPosRef.current }
    const duration = STATE_DURATIONS[droneState] || 500
    const easing = STATE_EASING[droneState] || easeOutCubic
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const rawT = Math.min(elapsed / duration, 1)
      const t = easing(rawT)

      const x = lerp(from.x, target.x, t)
      const y = lerp(from.y, target.y, t)
      const s = lerp(from.scale, target.scale, t)
      const r = lerp(from.rotate, target.rotate, t)
      const o = lerp(from.opacity, target.opacity, t)

      currentPosRef.current = { x, y, scale: s, rotate: r, opacity: o }

      el.style.transform = `translate3d(${x}px,${y}px,0) scale(${s}) rotate(${r}deg)`
      el.style.opacity = String(o)

      if (rawT < 1) {
        animRef.current = requestAnimationFrame(tick)
      }
    }

    animRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(animRef.current)
  }, [droneState, droneRef])

  return { flightDistRef }
}
