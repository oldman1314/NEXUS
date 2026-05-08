import { useEffect, useMemo, useRef, useState } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'

interface StarConfig {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
}

function generateStars(): StarConfig[] {
  const count = 8 + Math.floor(Math.random() * 3)
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    duration: 1000 + Math.random() * 2000,
    delay: Math.random() * 3000,
  }))
}

export default function DarkModeStars() {
  const resolvedMode = useThemeStore((s) => s.resolvedMode)
  const [stars, setStars] = useState<StarConfig[]>([])
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDark = resolvedMode === 'dark'

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (isDark) {
      setStars(generateStars())
      timerRef.current = setTimeout(() => {
        setVisible(true)
        timerRef.current = null
      }, 100)
    } else {
      setVisible(false)
      timerRef.current = setTimeout(() => {
        setStars([])
        timerRef.current = null
      }, 600)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isDark])

  const starElements = useMemo(() => {
    if (stars.length === 0) return null

    return stars.map((star) => (
      <div
        key={star.id}
        className="dm-star"
        style={{
          left: `${star.left}%`,
          top: `${star.top}%`,
          width: `${star.size}px`,
          height: `${star.size}px`,
          animationDuration: `${star.duration}ms`,
          animationDelay: `${star.delay}ms`,
        }}
      />
    ))
  }, [stars])

  if (!isDark && stars.length === 0) return null

  return (
    <div className={`dm-stars-container${visible ? ' dm-stars-container--visible' : ''}`} aria-hidden="true">
      {starElements}
    </div>
  )
}
