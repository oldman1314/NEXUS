import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import type { Environment } from '@/types'
import EnvSidebarItem from './EnvSidebarItem'

interface EnvSidebarProps {
  environments: Environment[]
  selectedEnvId: string
  activeEnvId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export default function EnvSidebar({
  environments,
  selectedEnvId,
  activeEnvId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
}: EnvSidebarProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isAdding])

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (trimmed) {
      onAdd(trimmed)
    }
    setNewName('')
    setIsAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') {
      setIsAdding(false)
      setNewName('')
    }
  }

  return (
    <div className="env-sidebar">
      <div className="env-sidebar-list">
        {environments.map((env) => (
          <EnvSidebarItem
            key={env.id}
            env={env}
            isSelected={selectedEnvId === env.id}
            isActive={activeEnvId === env.id}
            onSelect={() => onSelect(env.id)}
            onDuplicate={() => onDuplicate(env.id)}
            onDelete={() => onDelete(env.id)}
          />
        ))}
        {isAdding && (
          <div style={{ padding: '4px 0' }}>
            <input
              ref={inputRef}
              className="env-sidebar-new-input"
              placeholder="Environment name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleCreate}
            />
          </div>
        )}
      </div>
      <button className="env-sidebar-add-btn" onClick={() => setIsAdding(true)}>
        <Plus size={14} />
        New Environment
      </button>
    </div>
  )
}
