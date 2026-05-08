import { useRef, useLayoutEffect, useEffect } from 'react'
import { useRemoteToolsAnimationStore } from '@/stores/useRemoteToolsAnimationStore'
import type { WarpTunnelState } from '@/types'

interface AnimTarget {
  x: number
  y: number
  scale: number
  opacity: number
}

const STATE_TARGETS: Record<WarpTunnelState, (dist: number) => AnimTarget> = {
  idle: () => ({ x: 0, y: 0, scale: 1, opacity: 0.85 }),
  connecting: (d) => ({ x: d * 0.5, y: -3, scale: 1.05, opacity: 1 }),
  connected: (d) => ({ x: d, y: 0, scale: 1, opacity: 1 }),
  error: (d) => ({ x: d * 0.5, y: 4, scale: 0.9, opacity: 0.6 }),
}

const STATE_DURATIONS: Record<WarpTunnelState, number> = {
  idle: 500,
  connecting: 1200,
  connected: 800,
  error: 600,
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
function easeOutExpo(t: number) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }

const STATE_EASING: Record<WarpTunnelState, (t: number) => number> = {
  idle: easeOutCubic,
  connecting: easeInOutCubic,
  connected: easeOutExpo,
  error: easeOutCubic,
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export function useWarpTunnelAnimation(
  signalRef: React.RefObject<HTMLDivElement | null>,
  gatewayRef: React.RefObject<HTMLDivElement | null>,
  beaconRef: React.RefObject<HTMLDivElement | null>,
) {
  const tunnelState = useRemoteToolsAnimationStore((s) => s.tunnelState)
  const flightDistRef = useRef(200)
  const animRef = useRef(0)
  const currentPosRef = useRef<AnimTarget>({ x: 0, y: 0, scale: 1, opacity: 0.85 })
  const lastStateRef = useRef<string>('')

  useLayoutEffect(() => {
    const calculate = () => {
      if (!gatewayRef.current || !beaconRef.current) return
      const gatewayRect = gatewayRef.current.getBoundingClientRect()
      const beaconRect = beaconRef.current.getBoundingClientRect()
      const dist = beaconRect.left - gatewayRect.left
      if (dist > 0) flightDistRef.current = dist
    }
    calculate()
    window.addEventListener('resize', calculate)
    return () => window.removeEventListener('resize', calculate)
  }, [gatewayRef, beaconRef])

  useEffect(() => {
    const el = signalRef.current
    if (!el) return

    const dist = flightDistRef.current
    const target = STATE_TARGETS[tunnelState]?.(dist)
    if (!target) return

    if (lastStateRef.current === tunnelState) return
    lastStateRef.current = tunnelState

    cancelAnimationFrame(animRef.current)

    const from: AnimTarget = { ...currentPosRef.current }
    const duration = STATE_DURATIONS[tunnelState] || 500
    const easing = STATE_EASING[tunnelState] || easeOutCubic
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
  }, [tunnelState, signalRef])

  return { flightDistRef }
}
