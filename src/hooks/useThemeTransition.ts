import { useState, useRef, useEffect, useCallback } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'

type ThemeAnimState = 'idle' | 'to-dark' | 'to-light'
type PageEffect = { direction: 'to-dark' | 'to-light'; key: number; fadeOut?: boolean } | null

const ANIM_STATE_DURATION = 1200
const PAGE_EFFECT_DURATION = 3500
const FADE_OUT_DURATION = 300

export function useThemeTransition() {
  const [themeAnimState, setThemeAnimState] = useState<ThemeAnimState>('idle')
  const [pageEffect, setPageEffect] = useState<PageEffect>(null)
  const animStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageEffectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resolvedMode = useThemeStore((s) => s.resolvedMode)
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const toggle = useThemeStore((s) => s.toggle)
  const accentColor = useThemeStore((s) => s.accentColor)
  const setAccentColor = useThemeStore((s) => s.setAccentColor)
  const visualStyle = useThemeStore((s) => s.visualStyle)
  const setVisualStyle = useThemeStore((s) => s.setVisualStyle)
  const fontFamily = useThemeStore((s) => s.fontFamily)
  const setFontFamily = useThemeStore((s) => s.setFontFamily)

  useEffect(() => {
    return () => {
      if (animStateTimerRef.current) clearTimeout(animStateTimerRef.current)
      if (pageEffectTimerRef.current) clearTimeout(pageEffectTimerRef.current)
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current)
    }
  }, [])

  const clearTimers = useCallback(() => {
    if (animStateTimerRef.current) {
      clearTimeout(animStateTimerRef.current)
      animStateTimerRef.current = null
    }
    if (pageEffectTimerRef.current) {
      clearTimeout(pageEffectTimerRef.current)
      pageEffectTimerRef.current = null
    }
    if (fadeOutTimerRef.current) {
      clearTimeout(fadeOutTimerRef.current)
      fadeOutTimerRef.current = null
    }
  }, [])

  const startTransition = useCallback((direction: 'to-dark' | 'to-light') => {
    clearTimers()
    setThemeAnimState(direction)
    setPageEffect({ direction, key: Date.now() })

    animStateTimerRef.current = setTimeout(() => {
      setThemeAnimState('idle')
      animStateTimerRef.current = null
    }, ANIM_STATE_DURATION)

    pageEffectTimerRef.current = setTimeout(() => {
      setPageEffect((prev) => prev ? { ...prev, fadeOut: true } : null)
      fadeOutTimerRef.current = setTimeout(() => {
        setPageEffect(null)
        fadeOutTimerRef.current = null
      }, FADE_OUT_DURATION)
      pageEffectTimerRef.current = null
    }, PAGE_EFFECT_DURATION)
  }, [clearTimers])

  const skipAnimation = useCallback(() => {
    clearTimers()
    setThemeAnimState('idle')
    setPageEffect((prev) => prev ? { ...prev, fadeOut: true } : null)
    fadeOutTimerRef.current = setTimeout(() => {
      setPageEffect(null)
      fadeOutTimerRef.current = null
    }, FADE_OUT_DURATION)
  }, [clearTimers])

  const handleThemeToggle = useCallback((targetMode: string) => {
    const direction = (targetMode === 'dark' || (targetMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
      ? 'to-dark'
      : 'to-light'

    startTransition(direction)
    setMode(targetMode as typeof mode)
  }, [mode, setMode, startTransition])

  const handleQuickToggle = useCallback(() => {
    const direction = resolvedMode === 'dark' ? 'to-light' : 'to-dark'
    startTransition(direction)
    toggle()
  }, [resolvedMode, toggle, startTransition])

  return {
    themeAnimState,
    pageEffect,
    skipAnimation,
    handleThemeToggle,
    handleQuickToggle,
    resolvedMode,
    mode,
    accentColor,
    setAccentColor,
    visualStyle,
    setVisualStyle,
    fontFamily,
    setFontFamily,
  }
}
