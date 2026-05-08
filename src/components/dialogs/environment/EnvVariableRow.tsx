import { useState, useRef, useEffect } from 'react'
import { Trash2, Eye, EyeOff } from 'lucide-react'
import type { EnvironmentVariable } from '@/types'
import Tooltip from '@/components/common/Tooltip'

interface EnvVariableRowProps {
  variable: EnvironmentVariable
  allKeys: string[]
  onUpdate: (id: string, updates: Partial<EnvironmentVariable>) => void
  onDelete: (id: string) => void
  onAddNext: () => void
}

export default function EnvVariableRow({
  variable,
  allKeys,
  onUpdate,
  onDelete,
  onAddNext,
}: EnvVariableRowProps) {
  const [localKey, setLocalKey] = useState(variable.key)
  const [localValue, setLocalValue] = useState(variable.value)
  const [revealed, setRevealed] = useState(false)
  const keyInputRef = useRef<HTMLInputElement>(null)

  const duplicateError = localKey !== variable.key && allKeys.includes(localKey)

  useEffect(() => {
    setLocalKey(variable.key)
    setLocalValue(variable.value)
  }, [variable.key, variable.value])

  const handleKeyBlur = () => {
    if (localKey.trim() && !duplicateError && localKey !== variable.key) {
      onUpdate(variable.id, { key: localKey.trim() })
    } else if (localKey.trim() === '') {
      setLocalKey(variable.key)
    }
  }

  const handleValueBlur = () => {
    if (localValue !== variable.value) {
      onUpdate(variable.id, { value: localValue })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleKeyBlur()
      const nextInput = keyInputRef.current?.closest('.env-var-row')
        ?.nextElementSibling?.querySelector('input') as HTMLInputElement | null
      if (nextInput) {
        nextInput.focus()
      } else {
        onAddNext()
      }
    }
  }

  return (
    <div className={`env-var-row ${variable.sensitive ? 'sensitive' : ''} ${duplicateError ? 'has-error' : ''}`}>
      <input
        ref={keyInputRef}
        type="text"
        placeholder="Variable name"
        className={duplicateError ? 'error' : ''}
        value={localKey}
        onChange={(e) => setLocalKey(e.target.value)}
        onBlur={handleKeyBlur}
        onKeyDown={handleKeyDown}
      />
      <div className="env-var-value-cell">
        <input
          type={variable.sensitive && !revealed ? 'password' : 'text'}
          placeholder="Value"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleValueBlur}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="env-var-actions">
        <Tooltip content={variable.sensitive ? 'Mark as non-sensitive' : 'Mark as sensitive'}>
          <button
            className={`env-var-btn ${variable.sensitive ? 'active' : ''}`}
            onClick={() => onUpdate(variable.id, { sensitive: !variable.sensitive })}
          >
            {variable.sensitive ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </Tooltip>
        {variable.sensitive && (
          <Tooltip content={revealed ? 'Hide value' : 'Reveal value'}>
            <button className="env-var-btn" onClick={() => setRevealed(!revealed)}>
              {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </Tooltip>
        )}
        <Tooltip content="Delete variable">
          <button className="env-var-btn delete" onClick={() => onDelete(variable.id)}>
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>
      {duplicateError && (
        <div className="env-var-error">Variable name already exists</div>
      )}
    </div>
  )
}
