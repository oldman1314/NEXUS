import { useEffect, useRef, useState } from 'react'
import './context-menu.css'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  shortcut?: string
  danger?: boolean
  disabled?: boolean
  action?: () => void
  submenu?: ContextMenuItem[]
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [submenuOpenIndex, setSubmenuOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let adjustedX = x
    let adjustedY = y
    if (rect.width + x > vw) adjustedX = vw - rect.width - 8
    if (rect.height + y > vh) adjustedY = vh - rect.height - 8
    if (adjustedX < 0) adjustedX = 8
    if (adjustedY < 0) adjustedY = 8
    menuRef.current.style.left = `${adjustedX}px`
    menuRef.current.style.top = `${adjustedY}px`
  }, [x, y])

  return (
    <div className="context-menu-overlay" onContextMenu={(e) => e.preventDefault()}>
      <div ref={menuRef} className="context-menu" style={{ left: x, top: y }}>
        {items.map((item, i) => {
          if (item.label === '---') {
            return <div key={i} className="context-menu-separator" />
          }
          return (
            <div
              key={i}
              className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''} ${item.submenu ? 'context-menu-submenu' : ''}`}
              onClick={() => {
                if (item.disabled) return
                if (item.submenu) return
                item.action?.()
                onClose()
              }}
              onMouseEnter={() => item.submenu ? setSubmenuOpenIndex(i) : setSubmenuOpenIndex(null)}
              onMouseLeave={() => setSubmenuOpenIndex(null)}
            >
              {item.icon && <span className="context-menu-item-icon">{item.icon}</span>}
              <span className="context-menu-item-label">{item.label}</span>
              {item.shortcut && <span className="context-menu-item-shortcut">{item.shortcut}</span>}
              {item.submenu && submenuOpenIndex === i && (
                <div className="context-menu-submenu-panel">
                  {item.submenu.map((sub, si) => (
                    <div
                      key={si}
                      className={`context-menu-item ${sub.danger ? 'danger' : ''} ${sub.disabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (sub.disabled) return
                        sub.action?.()
                        onClose()
                      }}
                    >
                      {sub.icon && <span className="context-menu-item-icon">{sub.icon}</span>}
                      <span className="context-menu-item-label">{sub.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
