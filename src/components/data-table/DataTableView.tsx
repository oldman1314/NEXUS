import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useDataTableStore } from '@/stores/useDataTableStore'
import { useDataTableData } from '@/hooks/useDataTableData'
import { useFilteredData } from '@/hooks/useFilteredData'
import { useUrlSync } from '@/hooks/useUrlSync'
import { toast } from '@/stores/useToastStore'
import type { MergedTestCase, ColumnFilter, ColumnConfig } from '@/types/data-table'
import { DataTableToolbar } from './DataTableToolbar'
import { DataTable } from './DataTable'
import { DataTablePagination } from './DataTablePagination'
import { RowDrawer } from './RowDrawer'
import { FilterTags } from './FilterTags'

const HEADER_EXTRA = 90
const CELL_EXTRA = 32
const CHECKBOX_WIDTH = 52

let canvasCtx: CanvasRenderingContext2D | null = null

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (canvasCtx) return canvasCtx
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvasCtx = canvas.getContext('2d')
  return canvasCtx
}

function measureTextWidth(text: string, font = '500 13px var(--font-sans, sans-serif)'): number {
  const ctx = getCanvasContext()
  if (!ctx) {
    let width = 0
    for (const char of text) {
      const code = char.charCodeAt(0)
      const isCJK = (code >= 0x4E00 && code <= 0x9FFF) ||
        (code >= 0x3000 && code <= 0x303F) ||
        (code >= 0xFF00 && code <= 0xFFEF)
      width += isCJK ? 14 : 8
    }
    return width
  }
  ctx.font = font
  return ctx.measureText(text).width
}

const COLUMN_MIN_WIDTHS: Record<string, number> = {
  checkbox: 52,
  id: 100,
  title: 140,
  result: 100,
  testPriority: 90,
  testContent: 120,
  testEnvironment: 110,
  executed: 100,
  duration: 100,
  executedTime: 160,
  executedBy: 120,
  stepResultCount: 90,
  defectURI: 120,
  assignee: 120,
  caseStatus: 110,
  automation: 140,
  featureCluster: 100,
  featureName: 120,
  testStepCount: 90,
  prerequisites: 140,
  priority: 90,
  createdAt: 150,
  updatedAt: 150,
}



function calcProportionalWidths(
  data: MergedTestCase[],
  columns: ColumnConfig[],
  containerWidth: number
): Record<string, number> {
  if (data.length === 0 || containerWidth <= 0) return {}
  const visibleCols = columns.filter((c) => c.visible)
  if (visibleCols.length === 0) return {}

  const widths: Record<string, number> = {}
  const rawWeights: Record<string, number> = {}
  const sampleSize = Math.min(data.length, 80)
  const sample = data.slice(0, sampleSize)

  let totalWeight = 0

  for (const col of visibleCols) {
    if (col.key === 'checkbox') {
      rawWeights[col.key] = CHECKBOX_WIDTH
      widths[col.key] = CHECKBOX_WIDTH
      continue
    }

    const colMinWidth = COLUMN_MIN_WIDTHS[col.key] || 80
    const headerWidth = measureTextWidth(col.label || '') * 1.2 + HEADER_EXTRA
    let p95Width = 0

    const colWidths: number[] = []
    for (const row of sample) {
      const val = row[col.key as keyof MergedTestCase]
      if (val == null) continue
      const str = String(val)
      const longestLine = str.split('\n').reduce((max, line) =>
        Math.max(max, measureTextWidth(line)), 0)
      colWidths.push(longestLine + CELL_EXTRA)
    }

    if (colWidths.length > 0) {
      colWidths.sort((a, b) => a - b)
      const idx = Math.floor(colWidths.length * 0.9)
      p95Width = colWidths[Math.min(idx, colWidths.length - 1)]
    }

    const weight = Math.max(headerWidth, p95Width, colMinWidth, 80)
    rawWeights[col.key] = weight
    totalWeight += weight
  }

  const fixedTotal = CHECKBOX_WIDTH
  const nonFixedWeight = totalWeight - fixedTotal
  const availableWidth = containerWidth - fixedTotal - 20

  const useNaturalWidth = nonFixedWeight > availableWidth

  for (const col of visibleCols) {
    if (col.key === 'checkbox') continue
    const ratio = rawWeights[col.key] / nonFixedWeight
    const colMinWidth = COLUMN_MIN_WIDTHS[col.key] || 80
    const minPx = Math.max(colMinWidth, 60)

    if (useNaturalWidth) {
      widths[col.key] = Math.max(minPx, rawWeights[col.key])
    } else {
      const px = Math.max(minPx, Math.floor(availableWidth * ratio))
      widths[col.key] = px
    }
  }

  return widths
}

export function DataTableView() {
  useUrlSync()

  const store = useDataTableStore()
  const { fetchData } = useDataTableData()
  const { filteredData, paginatedData, totalPages } = useFilteredData()

  const [drawerRow, setDrawerRow] = useState<MergedTestCase | null>(null)
  const autoWidthsApplied = useRef(false)
  const tableContainerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<HTMLDivElement | null>(null)
  const drawerOpenRef = useRef(false)

  const {
    mode, density, projectId, testRunId,
    loading, loadingProgress, loadingProgressCurrent, loadingProgressTotal,
    data, columns, filters, sortState, searchQuery,
    selectedRows, columnWidths, pageSize, currentPage,
    queryHistory, activePresetId,
    setMode, setDensity, setProjectId, setTestRunId,
    toggleRowSelection, toggleAllRows, clearSelection,
    invertSelection, selectFiltered,
    setColumnVisible, setFilter, removeFilter, clearFilters,
    toggleSort, addQueryHistory, setPageSize, setCurrentPage, setSearchQuery,
    setColumnWidth, savePreset, applyPreset,
  } = store

  const visibleColumns = useMemo(
    () => new Set(columns.filter((c) => c.visible).map((c) => c.key)),
    [columns]
  )

  useEffect(() => {
    if (data.length > 0 && !autoWidthsApplied.current) {
      const container = tableContainerRef.current || document.querySelector('.dt-main-workspace')
      const containerWidth = container ? container.clientWidth : window.innerWidth - 40
      const optimal = calcProportionalWidths(data, columns, containerWidth)
      for (const [key, width] of Object.entries(optimal)) {
        setColumnWidth(key, width)
      }
      autoWidthsApplied.current = true
    }
    if (data.length === 0) {
      autoWidthsApplied.current = false
    }
  }, [data, columns, setColumnWidth])

  useEffect(() => {
    const container = tableContainerRef.current || document.querySelector('.dt-main-workspace')
    if (!container) return

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        if (drawerOpenRef.current) return
        for (const entry of entries) {
          const newWidth = entry.contentRect.width
          if (newWidth > 0 && data.length > 0) {
            const optimal = calcProportionalWidths(data, columns, newWidth)
            for (const [key, width] of Object.entries(optimal)) {
              setColumnWidth(key, width)
            }
          }
        }
      })
      resizeObserver.observe(container)
    } else {
      const handleResize = () => {
        const newWidth = container.clientWidth
        if (newWidth > 0 && data.length > 0) {
          const optimal = calcProportionalWidths(data, columns, newWidth)
          for (const [key, width] of Object.entries(optimal)) {
            setColumnWidth(key, width)
          }
        }
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [data, columns, setColumnWidth])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleSearch = useCallback(() => {
    if (!projectId.trim() || !testRunId.trim()) {
      toast('warning', '请输入项目ID和测试运行ID')
      return
    }
    addQueryHistory(projectId, testRunId)
    fetchData()
  }, [projectId, testRunId, addQueryHistory, fetchData])

  const handleSort = useCallback((key: string) => {
    toggleSort(key)
  }, [toggleSort])

  const handleFilter = useCallback((key: string, value: string | string[] | { min?: number | string; max?: number | string } | null) => {
    if (value === null || value === undefined || value === '') {
      removeFilter(key)
    } else {
      const col = columns.find((c) => c.key === key)
      const filterType = col?.filterType || 'text'
      setFilter({ key, type: filterType, value } as ColumnFilter)
    }
  }, [columns, setFilter, removeFilter])

  const handleToggleSelect = useCallback((id: string) => {
    toggleRowSelection(id)
  }, [toggleRowSelection])

  const handleSelectAll = useCallback(() => {
    toggleAllRows(paginatedData.map((r) => String(r.id)))
  }, [paginatedData, toggleAllRows])

  const handleSelectAllData = useCallback(() => {
    toggleAllRows(data.map((r) => String(r.id)))
  }, [data, toggleAllRows])

  const handleSelectFiltered = useCallback(() => {
    selectFiltered(filteredData.map((r) => String(r.id)))
  }, [filteredData, selectFiltered])

  const handleInvertFiltered = useCallback(() => {
    invertSelection(filteredData.map((r) => String(r.id)))
  }, [filteredData, invertSelection])

  const handleCellClick = useCallback((row: any, columnKey: string) => {
    if (columnKey === 'title' && mode === 'detailed') {
      drawerOpenRef.current = true
      setDrawerRow(row as MergedTestCase)
    }
  }, [mode])

  const handleContextMenu = useCallback((_e: React.MouseEvent, _row: any) => { }, [])

  const handleColumnResize = useCallback((key: string, width: number) => {
    autoWidthsApplied.current = true
    setColumnWidth(key, width)
  }, [setColumnWidth])

  const handleColumnVisibilityChange = useCallback((key: string, visible: boolean) => {
    setColumnVisible(key, visible)
  }, [setColumnVisible])

  const handleExport = useCallback((format: 'csv' | 'json' | 'excel') => {
    const visibleCols = columns.filter((c) => c.visible)
    const exportData = filteredData.map((row) => {
      const obj: Record<string, unknown> = {}
      visibleCols.forEach((col) => { obj[col.label] = row[col.key as keyof MergedTestCase] })
      return obj
    })
    let content: string; let mimeType: string; let extension: string
    switch (format) {
      case 'csv': {
        const sanitizeCsvCell = (val: string) => {
          let s = String(val || '').replace(/"/g, '""')
          if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
          return '"' + s + '"'
        }
        content = [visibleCols.map((c) => c.label).join(','), ...exportData.map((row) => visibleCols.map((c) => sanitizeCsvCell(String(row[c.label] || ''))).join(','))].join('\n')
        mimeType = 'text/csv'; extension = 'csv'; break
      }
      case 'json':
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'; extension = 'json'; break
      case 'excel':
        content = [visibleCols.map((c) => c.label).join('\t'), ...exportData.map((row) => visibleCols.map((c) => String(row[c.label] || '')).join('\t'))].join('\n')
        mimeType = 'application/vnd.ms-excel'; extension = 'xls'; break
    }
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeProject = (projectId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeTestRun = (testRunId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_')
    a.href = url; a.download = `export-${safeProject}-${safeTestRun}-${Date.now()}.${extension}`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }, [filteredData, columns, projectId, testRunId])

  const handleClearFilters = useCallback(() => {
    clearFilters(); setSearchQuery(''); clearSelection()
  }, [clearFilters, setSearchQuery, clearSelection])

  const handleSaveViewPreset = useCallback((name: string) => { savePreset(name) }, [savePreset])
  const handleViewPresetChange = useCallback((id: string | null) => { if (id) applyPreset(id) }, [applyPreset])

  const selectedCount = selectedRows.size
  const activeFilterCount = Object.keys(filters).length
  const sealed = false

  const adaptedColumns = useMemo(() => columns.map((c) => ({
    key: c.key,
    title: c.label,
    type: c.filterType === 'numberRange' ? 'number' as const : c.filterType === 'dateRange' ? 'date' as const : 'string' as const,
    sortable: true,
    filterable: c.filterable,
    resizable: true,
    width: columnWidths[c.key] || c.width,
  })), [columns, columnWidths])

  const progressProp = loadingProgress ? { current: loadingProgressCurrent, total: loadingProgressTotal } : null

  return (
    <div className="dt-view" ref={viewRef} data-density={density}>
      <div className="dt-layout-shell">
        <div className="dt-main-workspace" ref={tableContainerRef}>
          <DataTableToolbar
            columns={adaptedColumns}
            density={density as any}
            mode={mode as any}
            projectId={projectId}
            testRunId={testRunId}
            loading={loading}
            progress={progressProp}
            history={queryHistory.map((h) => ({ projectId: h.projectId, testRunId: h.testRunId, timestamp: Date.now() }))}
            sealed={sealed}
            selectedCount={selectedCount}
            visibleColumns={visibleColumns}
            currentViewPreset={activePresetId}
            onDensityChange={(d) => setDensity(d as any)}
            onModeChange={(m) => {
              setMode(m as any)
            }}
            onProjectIdChange={setProjectId}
            onTestRunIdChange={setTestRunId}
            onSearch={handleSearch}
            onHistorySelect={(item) => {
              setProjectId(item.projectId)
              setTestRunId(item.testRunId || '')
              fetchData(undefined, item.projectId, item.testRunId)
            }}
            onClearHistory={() => useDataTableStore.setState({ queryHistory: [] })}
            onRefresh={() => fetchData()}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onExport={handleExport}
            onClearFilters={handleClearFilters}
            onViewPresetChange={handleViewPresetChange}
            onSaveViewPreset={handleSaveViewPreset}
          />

          {activeFilterCount > 0 && (
            <FilterTags
              filters={filters}
              columns={columns}
              onRemoveFilter={removeFilter}
              onClearAll={handleClearFilters}
            />
          )}

          <DataTable
            columns={adaptedColumns}
            data={paginatedData as any[]}
            loading={loading}
            sortState={sortState as any[]}
            filterState={Object.fromEntries(Object.entries(filters).map(([k, f]) => [k, f.value])) as Record<string, string | string[] | null>}
            density={density as any}
            searchQuery={searchQuery}
            selectedIds={selectedRows as any}
            expandedId={null}
            onSort={handleSort}
            onFilter={handleFilter}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onSelectAllData={handleSelectAllData}
            onSelectFiltered={handleSelectFiltered}
            onInvertFiltered={handleInvertFiltered}
            onToggleExpand={() => { }}
            onCellClick={handleCellClick}
            onContextMenu={handleContextMenu}
            onColumnResize={handleColumnResize}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            visibleColumns={visibleColumns}
            viewContainerRef={viewRef}
          />

          {!loading && paginatedData.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredData.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>

      {mode === 'detailed' && (
        <RowDrawer
          row={drawerRow as any}
          allRows={filteredData as any[]}
          allDataCount={data.length}
          visibleColumns={visibleColumns}
          onClose={() => {
            drawerOpenRef.current = false
            setDrawerRow(null)
          }}
          onNavigate={setDrawerRow as any}
          onColumnVisibilityChange={handleColumnVisibilityChange}
        />
      )}
    </div>
  )
}
