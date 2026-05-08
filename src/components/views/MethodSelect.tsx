import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import Popover from '@/components/common/Popover'
import type { HttpMethod } from '@/types'
import { HTTP_METHODS, METHOD_COLORS } from '@/constants/http'
import './method-select.css'

interface MethodSelectProps {
  value: HttpMethod
  onChange: (method: HttpMethod) => void
}

export default function MethodSelect({ value, onChange }: MethodSelectProps) {
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !listRef.current) return
    const activeEl = listRef.current.querySelector('[data-active]')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [open])

  const currentColor = METHOD_COLORS[value]

  const handleSelect = useCallback((method: HttpMethod) => {
    onChange(method)
    setOpen(false)
  }, [onChange])

  return (
    <Popover
      trigger={
        <button className="method-select-trigger" type="button" style={{ color: currentColor.color, borderColor: currentColor.color + '66' }}>
          <span className="method-select-value">{value}</span>
          <ChevronDown size={14} className="method-select-chevron" />
        </button>
      }
      placement="bottom-start"
      open={open}
      onOpenChange={setOpen}
    >
      <div className="method-select-dropdown" ref={listRef} role="listbox">
        {HTTP_METHODS.map((method) => {
          const colors = METHOD_COLORS[method]
          const isActive = method === value
          return (
            <button
              key={method}
              type="button"
              role="option"
              aria-selected={isActive}
              data-active={isActive || undefined}
              className={`method-option ${isActive ? 'method-option--active' : ''}`}
              style={{ color: colors.color }}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(method)
              }}
            >
              <span className="method-option-dot" style={{ background: colors.color }} />
              <span className="method-option-label">{method}</span>
              {isActive && <span className="method-option-check">✓</span>}
            </button>
          )
        })}
      </div>
    </Popover>
  )
}
