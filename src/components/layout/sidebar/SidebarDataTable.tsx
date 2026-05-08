import { useState, useRef, useEffect } from 'react'
import { Plus, Table2, Trash2, Check, X } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'
import { useUIStore } from '@/stores/useUIStore'
import { useDataTablesStore } from '@/stores/useDataTablesStore'
import { useDataTableStore } from '@/stores/useDataTableStore'
import './sidebar-datatable.css'

export default function SidebarDataTable() {
  const setNewDataTableDialogOpen = useUIStore((s) => s.setNewDataTableDialogOpen)
  const setView = useUIStore((s) => s.setView)
  const tables = useDataTablesStore((s) => s.tables)
  const activeTableId = useDataTablesStore((s) => s.activeTableId)
  const setActiveTable = useDataTablesStore((s) => s.setActiveTable)
  const updateTable = useDataTablesStore((s) => s.updateTable)
  const deleteTable = useDataTablesStore((s) => s.deleteTable)
  const mode = useDataTableStore((s) => s.mode)
  const data = useDataTableStore((s) => s.data)
  const filters = useDataTableStore((s) => s.filters)
  const columnWidths = useDataTableStore((s) => s.columnWidths)
  const sortState = useDataTableStore((s) => s.sortState)
  const pageSize = useDataTableStore((s) => s.pageSize)
  const setMode = useDataTableStore((s) => s.setMode)
  const setData = useDataTableStore((s) => s.setData)
  const reset = useDataTableStore((s) => s.reset)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleTableClick = (tableId: string) => {
    if (editingId === tableId) return
    if (tableId === activeTableId) return

    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    if (activeTableId) {
      updateTable(activeTableId, {
        mode,
        data,
        filters,
        columnWidths,
        sortState,
        pageSize,
      })
    }

    setActiveTable(tableId)
    setView('data-table')
    setMode(table.mode)
    setData(table.data)
  }

  const handleDelete = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation()
    if (!window.confirm('确定要删除这个表格吗？此操作不可撤销。')) return

    const isActive = activeTableId === tableId
    deleteTable(tableId)

    if (isActive) {
      reset()
      setView('request')
    }
  }

  const handleDoubleClick = (e: React.MouseEvent, tableId: string, currentName: string) => {
    e.stopPropagation()
    setEditingId(tableId)
    setEditName(currentName)
  }

  const handleRenameConfirm = () => {
    if (editingId && editName.trim()) {
      updateTable(editingId, { name: editName.trim() })
    }
    setEditingId(null)
    setEditName('')
  }

  const handleRenameCancel = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameConfirm()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleRenameCancel()
    }
  }

  return (
    <div className="sidebar-section sidebar-section-datatable">
      <div className="section-header">
        <span>Data Tables</span>
        <div className="section-actions">
          <Tooltip content="New Data Table">
            <button className="icon-btn" onClick={() => setNewDataTableDialogOpen(true)}>
              <Plus size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tables.length === 0 ? (
          <div className="empty-state">
            <Table2 size={24} className="empty-state-icon" />
            <span>No data tables yet</span>
            <span className="empty-state-hint">Click + to create one</span>
          </div>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              className={'dt-table-item' + (activeTableId === table.id ? ' active' : '')}
              onClick={() => handleTableClick(table.id)}
              onDoubleClick={(e) => handleDoubleClick(e, table.id, table.name)}
            >
              <Table2 size={14} className="dt-table-item-icon" />
              {editingId === table.id ? (
                <div className="dt-table-item-edit" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={editInputRef}
                    className="dt-table-item-edit-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleRenameConfirm}
                  />
                  <button className="dt-table-item-edit-btn" onMouseDown={(e) => { e.preventDefault(); handleRenameConfirm() }}>
                    <Check size={12} />
                  </button>
                  <button className="dt-table-item-edit-btn" onMouseDown={(e) => { e.preventDefault(); handleRenameCancel() }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="dt-table-item-name">{table.name}</span>
                  <Tooltip content="Delete">
                    <button
                      className="dt-table-item-delete"
                      onClick={(e) => handleDelete(e, table.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
