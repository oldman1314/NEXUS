import { useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import type { Environment } from '@/types'
import Tooltip from '@/components/common/Tooltip'

interface EnvSidebarItemProps {
  env: Environment
  isSelected: boolean
  isActive: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export default function EnvSidebarItem({
  env,
  isSelected,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
}: EnvSidebarItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete()
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 5000)
    }
  }

  return (
    <div
      className={`env-sidebar-item ${isSelected ? 'active' : ''}`}
      onClick={onSelect}
    >
      <span className="env-name">{env.name}</span>
      {isActive && <span className="env-active-badge">Active</span>}
      <div className="env-sidebar-item-actions">
        <Tooltip content="Duplicate">
          <span
            className="env-sidebar-action"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
          >
            <Copy size={12} />
          </span>
        </Tooltip>
        {env.id !== 'default' && (
          <Tooltip content={confirmDelete ? 'Click again to confirm' : 'Delete'}>
            <span
              className={`env-sidebar-action ${confirmDelete ? 'delete-confirm' : ''}`}
              onClick={handleDeleteClick}
            >
              {confirmDelete ? <Trash2 size={12} /> : <Trash2 size={12} />}
            </span>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
