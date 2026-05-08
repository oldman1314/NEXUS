import { useState } from 'react'
import { X, Table2, Plus } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useDataTableStore } from '@/stores/useDataTableStore'
import type { DataTable } from '@/types/data-table'
import './dialog.css'

interface NewDataTableDialogProps {
  onClose: () => void
  onCreate: (table: DataTable) => void
}

export default function NewDataTableDialog({ onClose, onCreate }: NewDataTableDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const setView = useUIStore((s) => s.setView)
  const setMode = useDataTableStore((s) => s.setMode)
  const reset = useDataTableStore((s) => s.reset)

  const handleCreate = () => {
    if (!name.trim()) return

    const newTable: DataTable = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
      name: name.trim(),
      description: description.trim(),
      mode: 'simple',
      projectId: '',
      testRunId: '',
      data: [],
      filters: {},
      columnVisibility: {},
      columnWidths: {},
      sortState: [],
      pageSize: 20,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    reset()
    setMode('simple')
    onCreate(newTable)
    setView('data-table')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Table2 size={18} /> 新建数据表格</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">表格名称 <span className="form-required">*</span></label>
            <input
              className="form-input"
              type="text"
              placeholder="请输入表格名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">描述（可选）</label>
            <textarea
              className="form-textarea"
              placeholder="请输入表格描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="dialog-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              <Plus size={14} />
              创建表格
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
