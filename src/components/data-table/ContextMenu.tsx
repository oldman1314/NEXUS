import { useEffect, useRef } from 'react'
import { Eye, Copy, Maximize2, CheckSquare } from 'lucide-react'
import type { DataTableRow } from './types'

interface ContextMenuProps {
  x: number
  y: number
  row: DataTableRow
  onClose: () => void
  onAction: (action: string) => void
}

export function ContextMenu({ x, y, row, onClose, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8
      }

      menuRef.current.style.left = `${adjustedX}px`
      menuRef.current.style.top = `${adjustedY}px`
    }
  }, [x, y])

  const menuItems = [
    { action: 'view', label: 'View Details', icon: <Eye size={14} />, shortcut: 'Enter' },
    { action: 'select', label: 'Select Row', icon: <CheckSquare size={14} />, shortcut: 'Space' },
    { action: 'copy-id', label: 'Copy ID', icon: <Copy size={14} />, shortcut: 'Ctrl+C' },
    { action: 'copy-title', label: 'Copy Title', icon: <Copy size={14} /> },
    { type: 'divider' as const },
    { action: 'expand', label: 'Expand Row', icon: <Maximize2 size={14} />, shortcut: 'E' },
  ]

  const handleAction = (action: string) => {
    if (action === 'copy-id') {
      navigator.clipboard.writeText(String(row.id))
    } else if (action === 'copy-title') {
      navigator.clipboard.writeText(row.title || '')
    }
    onAction(action)
    onClose()
  }

  return (
    <div className="dt-context-menu" ref={menuRef} style={{ left: x, top: y }}>
      {menuItems.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={index} className="dt-context-divider" />
        }
        return (
          <button
            key={item.action}
            className="dt-context-item"
            onClick={() => handleAction(item.action!)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.shortcut && (
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--dt-text-dim)', fontFamily: 'var(--font-mono)' }}>
                {item.shortcut}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
