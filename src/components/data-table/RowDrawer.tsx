import { useEffect, useLayoutEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DataTableRow } from './types'
import { DataRowDetail } from './DataRowDetail'

interface RowDrawerProps {
  row: DataTableRow | null
  allRows: DataTableRow[]
  allDataCount: number
  visibleColumns: Set<string>
  onClose: () => void
  onNavigate: (row: DataTableRow) => void
  onColumnVisibilityChange: (key: string, visible: boolean) => void
}

export function RowDrawer({
  row,
  allRows,
  allDataCount,
  visibleColumns,
  onClose,
  onNavigate,
  onColumnVisibilityChange,
}: RowDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (row) {
      drawerRef.current?.focus()
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [row])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (!row) return
        const currentIndex = allRows.findIndex((r) => r.id === row.id)
        const nextIndex = e.key === 'ArrowUp'
          ? Math.max(0, currentIndex - 1)
          : Math.min(allRows.length - 1, currentIndex + 1)
        if (nextIndex !== currentIndex) {
          onNavigate(allRows[nextIndex])
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [row, allRows, onClose, onNavigate])

  if (!row) return null

  const currentIndex = allRows.findIndex((r) => r.id === row.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < allRows.length - 1
  const isFiltered = allDataCount > allRows.length

  return (
    <>
      <div className="dt-drawer-overlay" onClick={onClose} />
      <div
        className="dt-drawer"
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="dt-drawer-header">
          <div className="dt-drawer-title">
            <span className="dt-drawer-id">#{row.id}</span>
            <span className="dt-drawer-sep">|</span>
            <span className="dt-drawer-name">{row.title || 'Untitled'}</span>
            {isFiltered && (
              <span className="dt-drawer-filtered-badge">filtered</span>
            )}
          </div>
          <div className="dt-drawer-nav">
            <button
              className="dt-drawer-nav-btn"
              onClick={() => hasPrev && onNavigate(allRows[currentIndex - 1])}
              disabled={!hasPrev}
              title="Previous row (↑)"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="dt-drawer-nav-btn"
              onClick={() => hasNext && onNavigate(allRows[currentIndex + 1])}
              disabled={!hasNext}
              title="Next row (↓)"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="dt-drawer-close"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="dt-drawer-body">
          <DataRowDetail
            row={row}
            visibleColumns={visibleColumns}
            onColumnVisibilityChange={onColumnVisibilityChange}
          />
        </div>
      </div>
    </>
  )
}
