import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import {
  useFloating,
  autoUpdate,
  offset as floatingOffset,
  flip,
  shift,
  useInteractions,
  useHover,
  useFocus,
  useRole,
  useDismiss,
  safePolygon,
  FloatingPortal,
  useTransitionStatus,
} from '@floating-ui/react'
import './tooltip.css'

type Placement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: ReactNode
  shortcut?: string
  placement?: Placement
  delay?: number
  children: ReactNode
}

export default function Tooltip({
  content,
  shortcut,
  placement = 'top',
  delay = 300,
  children,
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset(8),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift({ padding: 8 }),
    ],
  })

  const { isMounted, status } = useTransitionStatus(context, {
    duration: {
      open: 150,
      close: 100,
    },
  })

  const hover = useHover(context, {
    move: false,
    delay: { open: delay, close: 0 },
    handleClose: safePolygon({ buffer: 1 }),
  })
  const focus = useFocus(context)
  const role = useRole(context, { role: 'tooltip' })
  const dismiss = useDismiss(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    role,
    dismiss,
  ])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    },
    [open]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [handleKeyDown])

  const showTooltip = content != null && content !== ''

  const originOffset = 4
  const originMap: Record<string, { tx: string; ty: string }> = {
    top: { tx: '0', ty: `${originOffset}px` },
    bottom: { tx: '0', ty: `-${originOffset}px` },
    left: { tx: `${originOffset}px`, ty: '0' },
    right: { tx: `-${originOffset}px`, ty: '0' },
  }
  const origin = originMap[placement] ?? originMap.top

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </div>
      {showTooltip && isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              '--tooltip-tx': origin.tx,
              '--tooltip-ty': origin.ty,
            } as React.CSSProperties}
            className={`tooltip ${status === 'open' ? 'tooltip-enter' : 'tooltip-exit'}`}
            {...getFloatingProps()}
          >
            <div className="tooltip-content">
              {typeof content === 'string' ? (
                <span className="tooltip-text">{content}</span>
              ) : (
                content
              )}
              {shortcut && <kbd className="tooltip-shortcut">{shortcut}</kbd>}
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
