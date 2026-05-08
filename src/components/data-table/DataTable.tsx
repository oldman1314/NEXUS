import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import type { Column, DataTableRow as DataTableRowType, Density, FilterState, SortState } from './types'
import { DataTableHeader } from './table/DataTableHeader'
import { DataTableBody } from './table/DataTableBody'
import { DataTableEmptyState } from './table/DataTableEmptyState'
import { type CheckboxMode } from './table/CheckboxSelectMenu'

interface DataTableProps {
  columns: Column[]
  data: DataTableRowType[]
  loading: boolean
  sortState: SortState
  filterState: FilterState
  density: Density
  searchQuery: string
  selectedIds: Set<string>
  expandedId: string | null
  onSort: (key: string) => void
  onFilter: (key: string, value: string | string[] | { min?: number | string; max?: number | string } | null) => void
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onSelectAllData: () => void
  onSelectFiltered: () => void
  onInvertFiltered: () => void
  onToggleExpand: (id: string) => void
  onCellClick: (row: DataTableRowType, columnKey: string) => void
  onContextMenu: (e: React.MouseEvent, row: DataTableRowType) => void
  onColumnResize: (key: string, width: number) => void
  onColumnVisibilityChange: (key: string, visible: boolean) => void
  visibleColumns: Set<string>
  viewContainerRef: React.RefObject<HTMLDivElement | null>
}

export function DataTable(props: DataTableProps) {
  const {
    columns, data, loading, sortState, filterState, density,
    searchQuery, selectedIds, expandedId, onSort, onFilter,
    onToggleSelect, onSelectAll, onSelectAllData, onSelectFiltered, onInvertFiltered,
    onCellClick, onContextMenu, onColumnResize, onColumnVisibilityChange, visibleColumns,
    viewContainerRef,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const [checkboxMenuOpen, setCheckboxMenuOpen] = useState(false)
  const [checkboxMode, setCheckboxMode] = useState<CheckboxMode>('page')
  const checkboxDropdownRef = useRef<HTMLButtonElement>(null)

  const visibleCols = useMemo(() => columns.filter((c) => visibleColumns.has(c.key)), [columns, visibleColumns])
  const allSelected = data.length > 0 && data.every((row) => selectedIds.has(row.id))
  const someSelected = data.some((row) => selectedIds.has(row.id)) && !allSelected

  const handleCheckboxChange = useCallback(() => {
    switch (checkboxMode) {
      case 'all': onSelectAllData(); break
      case 'filtered': onSelectFiltered(); break
      case 'invert': onInvertFiltered(); break
      default: onSelectAll(); break
    }
  }, [checkboxMode, onSelectAll, onSelectAllData, onSelectFiltered, onInvertFiltered])

  const handleResizeStart = useCallback((e: React.MouseEvent, key: string) => {
    const col = columns.find((c) => c.key === key)
    if (!col) return
    setResizing({ key, startX: e.clientX, startWidth: col.width || 150 })
  }, [columns])

  useEffect(() => {
    if (!resizing) return
    const onMove = (e: MouseEvent) => {
      onColumnResize(resizing.key, Math.max(60, resizing.startWidth + e.clientX - resizing.startX))
    }
    const onUp = () => setResizing(null)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [resizing, onColumnResize])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onScroll = () => {
      setHeaderScrolled(container.scrollTop > 0)
    }
    container.addEventListener('scroll', onScroll)
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: DataTableRowType) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = data.findIndex((r) => r.id === row.id)
      const next = data[e.key === 'ArrowDown' ? Math.min(idx + 1, data.length - 1) : Math.max(idx - 1, 0)]
      if (next) (containerRef.current?.querySelector('[data-row-id="' + next.id + '"]') as HTMLElement)?.focus()
    }
  }, [data])

  const colValues = useMemo(() => {
    const map = new Map<string, string[]>()
    const countMap = new Map<string, Map<string, number>>()
    visibleCols.forEach((col) => {
      if (!col.filterable) return
      const values = new Set<string>()
      const counts = new Map<string, number>()
      data.forEach((r) => {
        const v = r[col.key]
        if (v != null) {
          const str = String(v)
          values.add(str)
          counts.set(str, (counts.get(str) || 0) + 1)
        }
      })
      map.set(col.key, Array.from(values).sort())
      countMap.set(col.key, counts)
    })
    return { map, countMap }
  }, [data, visibleCols])

  const gtc = useMemo(() => visibleCols.map((c) => {
    const w = c.width != null ? c.width : '1fr'
    return typeof w === 'number' ? w + 'px' : w
  }).join(' '), [visibleCols])

  if (loading || data.length === 0) {
    return (
      <DataTableEmptyState
        loading={loading}
        visibleCols={visibleCols}
        gtc={gtc}
        dataLength={data.length}
        searchQuery={searchQuery}
        filterState={filterState}
      />
    )
  }

  return (
    <div className="dt-table-container" ref={containerRef}>
      <DataTableHeader
        visibleCols={visibleCols}
        gtc={gtc}
        sortState={sortState}
        filterState={filterState}
        allSelected={allSelected}
        someSelected={someSelected}
        headerScrolled={headerScrolled}
        checkboxMenuOpen={checkboxMenuOpen}
        checkboxMode={checkboxMode}
        checkboxDropdownRef={checkboxDropdownRef}
        viewContainerRef={viewContainerRef}
        colValues={colValues}
        onSort={onSort}
        onFilter={onFilter}
        onCheckboxChange={handleCheckboxChange}
        onToggleCheckboxMenu={() => setCheckboxMenuOpen((v) => !v)}
        onCheckboxModeChange={setCheckboxMode}
        onCloseCheckboxMenu={() => setCheckboxMenuOpen(false)}
        onResizeStart={handleResizeStart}
      />
      <DataTableBody
        data={data}
        visibleCols={visibleCols}
        gtc={gtc}
        selectedIds={selectedIds}
        expandedId={expandedId}
        density={density}
        searchQuery={searchQuery}
        onToggleSelect={onToggleSelect}
        onCellClick={onCellClick}
        onContextMenu={onContextMenu}
        onColumnVisibilityChange={onColumnVisibilityChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
