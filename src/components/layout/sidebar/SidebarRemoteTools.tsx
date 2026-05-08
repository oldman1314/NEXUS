import { useState, useRef, useEffect } from 'react'
import { Plus, LayoutGrid, Trash2, Check, X } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'
import { useRemoteToolsStore } from '@/stores/useRemoteToolsStore'
import './sidebar-remote-tools.css'

export default function SidebarRemoteTools() {
  const layoutPanels = useRemoteToolsStore((s) => s.layoutPanels)
  const activeLayoutPanelId = useRemoteToolsStore((s) => s.activeLayoutPanelId)
  const addLayoutPanel = useRemoteToolsStore((s) => s.addLayoutPanel)
  const removeLayoutPanel = useRemoteToolsStore((s) => s.removeLayoutPanel)
  const switchLayoutPanel = useRemoteToolsStore((s) => s.switchLayoutPanel)
  const renameLayoutPanel = useRemoteToolsStore((s) => s.renameLayoutPanel)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleRenameConfirm = () => {
    if (editingId && editName.trim()) {
      renameLayoutPanel(editingId, editName.trim())
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

  const handleDelete = (e: React.MouseEvent, panelId: string) => {
    e.stopPropagation()
    if (layoutPanels.length <= 1) return
    removeLayoutPanel(panelId)
  }

  const getPanelCount = (panelId: string) => {
    const panel = layoutPanels.find((p) => p.id === panelId)
    if (!panel) return 0
    let count = 0
    const countNodes = (node: unknown) => {
      if (!node || typeof node !== 'object') return
      const n = node as Record<string, unknown>
      if (n.type === 'panel') { count++; return }
      if (Array.isArray(n.children)) {
        (n.children as unknown[]).forEach(countNodes)
      }
    }
    countNodes(panel.layout.root)
    return count
  }

  return (
    <div className="sidebar-section sidebar-section-remote-tools">
      <div className="section-header">
        <span>Layout Panels</span>
        <div className="section-actions">
          <Tooltip content="New Layout Panel">
            <button className="icon-btn" onClick={() => addLayoutPanel()}>
              <Plus size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {layoutPanels.map((panel) => (
          <div
            key={panel.id}
            className={`rt-panel-item ${panel.id === activeLayoutPanelId ? 'active' : ''}`}
            onClick={() => switchLayoutPanel(panel.id)}
            onDoubleClick={() => {
              setEditingId(panel.id)
              setEditName(panel.name)
            }}
          >
            <LayoutGrid size={14} className="rt-panel-item-icon" />
            {editingId === panel.id ? (
              <div className="rt-panel-item-edit" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={editInputRef}
                  className="rt-panel-item-edit-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={handleRenameConfirm}
                />
                <button className="rt-panel-item-edit-btn" onMouseDown={(e) => { e.preventDefault(); handleRenameConfirm() }}>
                  <Check size={12} />
                </button>
                <button className="rt-panel-item-edit-btn" onMouseDown={(e) => { e.preventDefault(); handleRenameCancel() }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <span className="rt-panel-item-name" title={panel.name}>{panel.name}</span>
                <span className="rt-panel-item-count">{getPanelCount(panel.id)}</span>
                {layoutPanels.length > 1 && (
                  <Tooltip content="Delete">
                    <button
                      className="rt-panel-item-delete"
                      onClick={(e) => handleDelete(e, panel.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}
