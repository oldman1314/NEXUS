import { useState, useCallback, type ReactNode } from 'react'
import {
  useFloating,
  autoUpdate,
  offset as floatingOffset,
  flip,
  shift,
  useClick,
  useInteractions,
  useRole,
  useDismiss,
  FloatingPortal,
  useTransitionStatus,
} from '@floating-ui/react'
import './popover.css'

type Placement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'

interface PopoverProps {
  trigger: ReactNode
  placement?: Placement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export default function Popover({
  trigger,
  placement = 'bottom-start',
  open: controlledOpen,
  onOpenChange,
  children,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  const { refs, floatingStyles, context, update } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    strategy: 'fixed',
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset(4),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift({ padding: 8, rootBoundary: 'viewport' }),
    ],
  })

  const { isMounted, status } = useTransitionStatus(context, {
    duration: {
      open: 200,
      close: 100,
    },
  })

  const click = useClick(context)
  const role = useRole(context, { role: 'dialog' })
  const dismiss = useDismiss(context, {
    outsidePress: true,
    escapeKey: true,
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    role,
    dismiss,
  ])

  const setFloatingRef = useCallback(
    (node: HTMLElement | null) => {
      refs.setFloating(node)
      if (node && isOpen) {
        requestAnimationFrame(() => {
          update()
        })
      }
    },
    [refs, isOpen, update]
  )

  const safeStyles: React.CSSProperties = {
    ...floatingStyles,
    top: floatingStyles.top !== undefined && Number(floatingStyles.top) > 0 ? floatingStyles.top : undefined,
    left: floatingStyles.left !== undefined && Number(floatingStyles.left) > 0 ? floatingStyles.left : undefined,
  }

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {trigger}
      </div>
      {isMounted && (
        <FloatingPortal>
          <div
            ref={setFloatingRef}
            style={safeStyles}
            className={`popover ${status === 'open' ? 'popover-enter' : 'popover-exit'}`}
            {...getFloatingProps()}
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
