import React, { useLayoutEffect, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MousePointerClick } from 'lucide-react'

type CheckboxMode = 'page' | 'all' | 'filtered' | 'invert'

const CHECKBOX_MODE_LABELS: Record<CheckboxMode, string> = {
  page: '当前页',
  all: '全选所有数据',
  filtered: '全选过滤数据',
  invert: '反选过滤数据',
}

interface CheckboxSelectMenuProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  checkboxMode: CheckboxMode
  onModeChange: (mode: CheckboxMode) => void
}

export function CheckboxSelectMenu({ isOpen, onClose, triggerRef, containerRef, checkboxMode, onModeChange }: CheckboxSelectMenuProps) {
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ visibility: 'hidden' })

  useEffect(() => {
    if (!isOpen) return
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dt-checkbox-dropdown') && !target.closest('.dt-checkbox-dropdown-menu')) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen, onClose])

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return
    const container = containerRef.current
    const btnRect = triggerRef.current.getBoundingClientRect()
    const menuW = 180
    const menuH = 200
    let left: number
    let top: number
    if (container) {
      const containerRect = container.getBoundingClientRect()
      left = btnRect.left + btnRect.width / 2 - containerRect.left - menuW / 2
      top = btnRect.bottom - containerRect.top + 6
      if (left < 8) left = 8
      if (left + menuW > containerRect.width - 8) left = containerRect.width - menuW - 8
      if (top + menuH > containerRect.height - 8) {
        top = btnRect.top - containerRect.top - menuH - 6
      }
      setMenuStyle({ position: 'absolute', left, top, visibility: 'visible' })
    } else {
      left = btnRect.left + btnRect.width / 2 - menuW / 2
      top = btnRect.bottom + 6
      if (left < 8) left = 8
      if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8
      if (top + menuH > window.innerHeight - 8) top = btnRect.top - menuH - 6
      setMenuStyle({ position: 'fixed', left, top, visibility: 'visible' })
    }
  }, [isOpen, triggerRef, containerRef])

  if (!isOpen) return null

  return createPortal(
    <div className="dt-checkbox-dropdown-menu" style={menuStyle} onClick={(e) => e.stopPropagation()}>
      <div className="dt-checkbox-dropdown-title">
        <MousePointerClick size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        点击行为
      </div>
      {(['page', 'all', 'filtered', 'invert'] as CheckboxMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          className={'dt-checkbox-dropdown-item' + (checkboxMode === mode ? ' active' : '')}
          onClick={() => { onModeChange(mode); onClose() }}
        >
          <span className="dt-checkbox-dropdown-radio">
            {checkboxMode === mode && <span className="dt-checkbox-dropdown-radio-dot" />}
          </span>
          {CHECKBOX_MODE_LABELS[mode]}
        </button>
      ))}
      <div className="dt-checkbox-dropdown-hint">
        选择后点击 ☑ 执行对应操作
      </div>
    </div>,
    containerRef.current || document.body
  )
}

export type { CheckboxMode }
