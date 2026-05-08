import { useRef, useEffect } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import type { Column } from './types'

interface ColumnVisibilityPopupProps {
  columns: Column[]
  visibleColumns: Set<string>
  onChange: (key: string, visible: boolean) => void
  onClose: () => void
}

export function ColumnVisibilityPopup({
  columns,
  visibleColumns,
  onChange,
  onClose,
}: ColumnVisibilityPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const toggleableColumns = columns.filter((c) => c.key !== 'checkbox')

  return (
    <div className="dt-col-visibility-popup" ref={popupRef}>
      <div className="dt-col-visibility-header">
        <span>Columns</span>
        <button onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      {toggleableColumns.map((col) => {
        const isVisible = visibleColumns.has(col.key)
        return (
          <div
            key={col.key}
            className="dt-col-visibility-item"
            onClick={() => onChange(col.key, !isVisible)}
          >
            <span
              className={`dt-col-filter-checkbox ${isVisible ? 'checked' : ''}`}
            >
              {isVisible && <Eye size={10} />}
            </span>
            <span className="dt-col-filter-select-label">{col.title}</span>
            {!isVisible && <EyeOff size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
          </div>
        )
      })}
    </div>
  )
}
