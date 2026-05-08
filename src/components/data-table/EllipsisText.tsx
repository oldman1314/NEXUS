import { useState, useRef, useEffect } from 'react'
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react'

interface EllipsisTextProps {
  text: string
  maxWidth?: number | string
  className?: string
  as?: 'span' | 'div'
}

export default function EllipsisText({
  text,
  maxWidth,
  className = '',
  as: Component = 'span',
}: EllipsisTextProps) {
  const [isTruncated, setIsTruncated] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const ref = useRef<HTMLElement>(null)

  const { refs, floatingStyles } = useFloating({
    open: showTooltip,
    onOpenChange: setShowTooltip,
    placement: 'top',
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  useEffect(() => {
    if (ref.current) {
      setIsTruncated(ref.current.scrollWidth > ref.current.clientWidth)
    }
  }, [text, maxWidth])

  const handleMouseEnter = () => {
    if (isTruncated) {
      setShowTooltip(true)
    }
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <>
      <Component
        ref={ref as React.RefObject<HTMLSpanElement & HTMLDivElement>}
        className={`ellipsis-text ${className}`}
        style={{
          maxWidth: maxWidth || '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: isTruncated ? 'help' : 'default',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text}
      </Component>
      {showTooltip && isTruncated && (
        <div
          ref={refs.setFloating}
          style={{
            ...floatingStyles,
            position: 'absolute',
            zIndex: 9999,
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-sans)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            maxWidth: '400px',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            pointerEvents: 'none',
          }}
        >
          {text}
        </div>
      )}
    </>
  )
}
