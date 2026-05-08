import React from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown } from 'lucide-react'
import type { Column, SortState, FilterState } from '../types'
import { ColumnFilterPopup } from '../ColumnFilterPopup'
import { CheckboxSelectMenu, type CheckboxMode } from './CheckboxSelectMenu'

interface DataTableHeaderProps {
  visibleCols: Column[]
  gtc: string
  sortState: SortState
  filterState: FilterState
  allSelected: boolean
  someSelected: boolean
  headerScrolled: boolean
  checkboxMenuOpen: boolean
  checkboxMode: CheckboxMode
  checkboxDropdownRef: React.RefObject<HTMLButtonElement | null>
  viewContainerRef: React.RefObject<HTMLDivElement | null>
  colValues: { map: Map<string, string[]>; countMap: Map<string, Map<string, number>> }
  onSort: (key: string) => void
  onFilter: (key: string, value: string | string[] | { min?: number | string; max?: number | string } | null) => void
  onCheckboxChange: () => void
  onToggleCheckboxMenu: () => void
  onCheckboxModeChange: (mode: CheckboxMode) => void
  onCloseCheckboxMenu: () => void
  onResizeStart: (e: React.MouseEvent, key: string) => void
}

export function DataTableHeader({
  visibleCols, gtc, sortState, filterState, allSelected, someSelected,
  headerScrolled, checkboxMenuOpen, checkboxMode, checkboxDropdownRef,
  viewContainerRef, colValues, onSort, onFilter, onCheckboxChange,
  onToggleCheckboxMenu, onCheckboxModeChange, onCloseCheckboxMenu, onResizeStart,
}: DataTableHeaderProps) {
  const sortIcon = (key: string) => {
    const i = sortState.findIndex((s) => s.key === key)
    if (i === -1) return null
    return sortState[i].direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  const sortOrder = (key: string) => {
    const i = sortState.findIndex((s) => s.key === key)
    return i >= 0 ? i + 1 : null
  }

  const getColValues = (key: string) => colValues.map.get(key) || []
  const getValueCounts = (key: string) => colValues.countMap.get(key)

  const [activeFilter, setActiveFilter] = React.useState<string | null>(null)

  return (
    <>
      <div className={`dt-table-header-row${headerScrolled ? ' scrolled' : ''}`} style={{ gridTemplateColumns: gtc, '--dt-grid-columns': gtc } as React.CSSProperties} role="row">
        {visibleCols.map((col) => (
          <div
            key={col.key}
            className={'dt-table-header-cell' + (col.key === 'checkbox' ? ' checkbox' : '')}
            role="columnheader"
          >
            <div className="dt-table-header-content">
              {col.key === 'checkbox' ? (
                <div className="dt-checkbox-header">
                  <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected }} onChange={onCheckboxChange} onClick={(e) => e.stopPropagation()} />
                  <button
                    ref={checkboxDropdownRef as React.LegacyRef<HTMLButtonElement>}
                    type="button"
                    className={'dt-checkbox-dropdown' + (checkboxMenuOpen ? ' open' : '')}
                    onClick={(e) => { e.stopPropagation(); onToggleCheckboxMenu() }}
                    tabIndex={-1}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              ) : (
                <React.Fragment>
                  <div className="dt-table-header-sort-area" onClick={() => col.sortable && onSort(col.key)}>
                    <span className="dt-table-header-label">{col.title}</span>
                    {col.sortable && (
                      <span className={'dt-sort-icon' + (!sortIcon(col.key) ? ' dt-sort-icon-inactive' : '')}>
                        {sortIcon(col.key) || <ChevronsUpDown size={14} />}
                      </span>
                    )}
                    {sortOrder(col.key) && <span className="dt-sort-order">{sortOrder(col.key)}</span>}
                  </div>
                  {col.filterable && (
                    <ColumnFilterPopup
                      column={col}
                      filterValue={filterState[col.key] || null}
                      values={getColValues(col.key)}
                      valueCounts={getValueCounts(col.key)}
                      isOpen={activeFilter === col.key}
                      onOpen={() => setActiveFilter(col.key)}
                      onClose={() => setActiveFilter(null)}
                      onApply={(v) => { onFilter(col.key, v); setActiveFilter(null) }}
                      onClear={() => { onFilter(col.key, null); setActiveFilter(null) }}
                      containerRef={viewContainerRef}
                    />
                  )}
                </React.Fragment>
              )}
            </div>
            {col.resizable && col.key !== 'checkbox' && (
              <div className="dt-resize-handle" onMouseDown={(e) => onResizeStart(e, col.key)} onClick={(e) => e.stopPropagation()} />
            )}
          </div>
        ))}
      </div>
      <CheckboxSelectMenu
        isOpen={checkboxMenuOpen}
        onClose={onCloseCheckboxMenu}
        triggerRef={checkboxDropdownRef}
        containerRef={viewContainerRef}
        checkboxMode={checkboxMode}
        onModeChange={onCheckboxModeChange}
      />
    </>
  )
}
