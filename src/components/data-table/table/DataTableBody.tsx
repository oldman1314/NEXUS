import React, { useCallback } from 'react'
import type { Column, DataTableRow as DataTableRowType, Density } from '../types'
import { DataTableRow } from '../DataTableRow'
import { DataRowDetail } from '../DataRowDetail'
import { ContextMenu } from '../ContextMenu'

interface DataTableBodyProps {
  data: DataTableRowType[]
  visibleCols: Column[]
  gtc: string
  selectedIds: Set<string>
  expandedId: string | null
  density: Density
  searchQuery: string
  onToggleSelect: (id: string) => void
  onCellClick: (row: DataTableRowType, columnKey: string) => void
  onContextMenu: (e: React.MouseEvent, row: DataTableRowType) => void
  onColumnVisibilityChange: (key: string, visible: boolean) => void
  onKeyDown: (e: React.KeyboardEvent, row: DataTableRowType) => void
}

export function DataTableBody({
  data, visibleCols, gtc, selectedIds, expandedId, density,
  searchQuery, onToggleSelect, onCellClick, onContextMenu,
  onColumnVisibilityChange, onKeyDown,
}: DataTableBodyProps) {
  const [contextMenuState, setContextMenuState] = React.useState<{ x: number; y: number; row: DataTableRowType } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent, row: DataTableRowType) => {
    e.preventDefault()
    setContextMenuState({ x: e.clientX, y: e.clientY, row })
  }, [])

  return (
    <>
      {data.map((row, index) => (
        <div key={row.id}>
          <div
            className={'dt-card-row' + (selectedIds.has(row.id) ? ' selected' : '') + (row.entering ? ' entering' : '')}
            style={{ gridTemplateColumns: gtc, '--dt-grid-columns': gtc, '--row-index': index } as React.CSSProperties}
            data-row-id={row.id}
            role="row"
            tabIndex={0}
            onKeyDown={(e) => onKeyDown(e, row)}
            onContextMenu={(e) => handleContextMenu(e, row)}
            onClick={() => onCellClick(row, 'title')}
          >
            {visibleCols.map((col) => (
              <div
                key={col.key}
                className={'dt-table-cell' + (col.key === 'checkbox' ? ' checkbox' : '') + (col.key === 'title' ? ' title-cell' : '')}
                role="cell"
                onClick={(e) => {
                  if (col.key === 'checkbox') e.stopPropagation()
                }}
              >
                <DataTableRow row={row} column={col} density={density} searchQuery={searchQuery} isSelected={selectedIds.has(row.id)} onToggleSelect={() => onToggleSelect(row.id)} />
              </div>
            ))}
          </div>
          {expandedId === row.id && <DataRowDetail row={row} visibleColumns={visibleCols as any} onColumnVisibilityChange={onColumnVisibilityChange} />}
        </div>
      ))}

      {contextMenuState && (
        <ContextMenu
          x={contextMenuState.x} y={contextMenuState.y} row={contextMenuState.row}
          onClose={() => setContextMenuState(null)}
          onAction={() => { onContextMenu({ preventDefault() {} , clientX: contextMenuState.x, clientY: contextMenuState.y } as React.MouseEvent, contextMenuState.row); setContextMenuState(null) }}
        />
      )}
    </>
  )
}
