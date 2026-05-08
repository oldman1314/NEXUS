import { useState, useMemo } from 'react'
import { Plus, Search, Check, Globe } from 'lucide-react'
import type { Environment, EnvironmentVariable } from '@/types'
import EnvVariableRow from './EnvVariableRow'
import EnvEmptyState from './EnvEmptyState'

interface EnvEditorProps {
  environment: Environment
  isActive: boolean
  onUpdate: (id: string, updates: Partial<Environment>) => void
  onSetActive: (id: string) => void
}

export default function EnvEditor({ environment, isActive, onUpdate, onSetActive }: EnvEditorProps) {
  const [search, setSearch] = useState('')
  const [localBaseUrl, setLocalBaseUrl] = useState(environment.baseUrl || '')

  const filteredVariables = useMemo(() => {
    if (!search.trim()) return environment.variables
    const q = search.toLowerCase()
    return environment.variables.filter((v) =>
      v.key.toLowerCase().includes(q) ||
      v.value.toLowerCase().includes(q)
    )
  }, [environment.variables, search])

  const allKeys = useMemo(
    () => environment.variables.map((v) => v.key),
    [environment.variables]
  )

  const handleAddVariable = () => {
    const newVar: EnvironmentVariable = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
    }
    onUpdate(environment.id, {
      variables: [...environment.variables, newVar],
    })
  }

  const handleUpdateVariable = (varId: string, updates: Partial<EnvironmentVariable>) => {
    onUpdate(environment.id, {
      variables: environment.variables.map((v) =>
        v.id === varId ? { ...v, ...updates } : v
      ),
    })
  }

  const handleDeleteVariable = (varId: string) => {
    onUpdate(environment.id, {
      variables: environment.variables.filter((v) => v.id !== varId),
    })
  }

  const handleBaseUrlBlur = () => {
    const trimmed = localBaseUrl.replace(/\/$/, '')
    if (trimmed !== (environment.baseUrl || '')) {
      onUpdate(environment.id, { baseUrl: trimmed || undefined })
    }
  }

  return (
    <div className="env-content">
      <div className="env-content-header">
        <input
          className="env-title-input"
          value={environment.name}
          onChange={(e) => onUpdate(environment.id, { name: e.target.value })}
          placeholder="Environment name"
        />
        {isActive ? (
          <span className="env-active-indicator">
            <Check size={12} />
            Active
          </span>
        ) : (
          <button className="env-btn-set-active" onClick={() => onSetActive(environment.id)}>
            Set Active
          </button>
        )}
      </div>

      <div className="env-base-url">
        <div className="env-base-url-label">
          <Globe size={12} />
          <span>Base URL</span>
          <span className="env-base-url-hint">{'{{base_url}}'}</span>
          <label className="env-base-url-toggle">
            <input
              type="checkbox"
              checked={environment.baseUrlEnabled !== false}
              onChange={(e) => onUpdate(environment.id, { baseUrlEnabled: e.target.checked })}
            />
            <span className="env-toggle-slider" />
          </label>
        </div>
        <input
          type="text"
          placeholder="https://api.example.com"
          value={localBaseUrl}
          onChange={(e) => setLocalBaseUrl(e.target.value)}
          onBlur={handleBaseUrlBlur}
          disabled={environment.baseUrlEnabled === false}
        />
      </div>

      <div className="env-editor">
        <div className="env-editor-search">
          <Search size={12} />
          <input
            placeholder={`Search ${environment.variables.length} variables...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredVariables.length > 0 && (
          <div className="env-editor-header">
            <span>Variable</span>
            <span>Value</span>
            <span>Actions</span>
          </div>
        )}

        {filteredVariables.length === 0 ? (
          <EnvEmptyState onAdd={handleAddVariable} />
        ) : (
          filteredVariables.map((variable) => (
            <EnvVariableRow
              key={variable.id}
              variable={variable}
              allKeys={allKeys}
              onUpdate={handleUpdateVariable}
              onDelete={handleDeleteVariable}
              onAddNext={handleAddVariable}
            />
          ))
        )}

        {filteredVariables.length > 0 && (
          <button className="env-add-row-btn" onClick={handleAddVariable}>
            <Plus size={14} />
            Add Variable
          </button>
        )}
      </div>
    </div>
  )
}
