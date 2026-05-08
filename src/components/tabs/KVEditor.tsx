import { useState, useCallback } from 'react'
import { Plus, Trash2, AlignLeft, Table2 } from 'lucide-react'
import { useKVEditor } from '@/hooks/useKVEditor'
import type { KVPair } from '@/types'
import Tooltip from '@/components/common/Tooltip'
import './kv-editor.css'

interface KVEditorProps {
  field: 'params' | 'headers' | 'formData' | 'urlEncodedData'
  addLabel: string
  showDescription?: boolean
  showFileToggle?: boolean
  renderValueCell?: (item: KVPair, index: number, update: (i: number, u: Partial<KVPair>) => void) => React.ReactNode
  renderActions?: (item: KVPair, index: number, remove: (i: number) => void, update: (i: number, u: Partial<KVPair>) => void) => React.ReactNode
}

export default function KVEditor({
  field,
  addLabel,
  showDescription = true,
  showFileToggle = false,
  renderValueCell,
  renderActions,
}: KVEditorProps) {
  const { items, addKVPair, updateKVPair, removeKVPair, setAllItems } = useKVEditor(field)
  const [mode, setMode] = useState<'keyValue' | 'bulk'>('keyValue')
  const [bulkText, setBulkText] = useState('')

  const switchToBulk = useCallback(() => {
    const text = items
      .map((item) => {
        const parts = [item.key, item.value]
        if (showDescription && item.description) parts.push(item.description)
        return parts.join(':')
      })
      .join('\n')
    setBulkText(text)
    setMode('bulk')
  }, [items, showDescription])

  const switchToKeyValue = useCallback(() => {
    const lines = bulkText.split('\n').filter((l) => l.trim())
    const newItems: KVPair[] = lines.map((line) => {
      const firstColon = line.indexOf(':')
      if (firstColon === -1) {
        return { key: line.trim(), value: '', description: undefined, enabled: true }
      }
      const key = line.slice(0, firstColon).trim()
      const rest = line.slice(firstColon + 1)
      if (!showDescription) {
        return { key, value: rest.trim(), description: undefined, enabled: true }
      }
      const secondColon = rest.indexOf(':')
      if (secondColon === -1) {
        return { key, value: rest.trim(), description: undefined, enabled: true }
      }
      const value = rest.slice(0, secondColon).trim()
      const description = rest.slice(secondColon + 1).trim()
      return { key, value, description, enabled: true }
    })
    setAllItems(newItems)
    setMode('keyValue')
  }, [bulkText, showDescription, setAllItems])

  const gridCols = showFileToggle
    ? '20px 1fr 1fr 1fr 72px'
    : showDescription
      ? '20px 1fr 1fr 1fr 32px'
      : '20px 1fr 1fr 32px'

  return (
    <div className="kv-editor">
      <div className="kv-mode-toggle">
        <Tooltip content="Key-Value 编辑模式">
          <button
            className={`kv-mode-btn ${mode === 'keyValue' ? 'active' : ''}`}
            onClick={mode === 'bulk' ? switchToKeyValue : undefined}
          >
            <Table2 size={12} />
            Key-Value
          </button>
        </Tooltip>
        <Tooltip content="批量编辑模式">
          <button
            className={`kv-mode-btn ${mode === 'bulk' ? 'active' : ''}`}
            onClick={mode === 'keyValue' ? switchToBulk : undefined}
          >
            <AlignLeft size={12} />
            Bulk Edit
          </button>
        </Tooltip>
      </div>

      {mode === 'keyValue' ? (
        <>
          <div className="kv-header" style={{ gridTemplateColumns: gridCols }}>
            <span></span>
            <span>Key</span>
            <span>Value</span>
            {showDescription && <span>Description</span>}
            <span></span>
          </div>
          {items.map((item, i) => (
            <div
              key={item.id || i}
              className={`kv-row ${!item.enabled ? 'kv-row-disabled' : ''} ${showFileToggle ? 'formdata-row' : ''}`}
              style={{ gridTemplateColumns: gridCols, '--row-index': i } as React.CSSProperties}
            >
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => updateKVPair(i, { enabled: e.target.checked })}
              />
              <input
                placeholder="Key"
                value={item.key}
                onChange={(e) => updateKVPair(i, { key: e.target.value })}
              />
              {renderValueCell ? (
                renderValueCell(item, i, updateKVPair)
              ) : (
                <input
                  placeholder="Value"
                  value={item.value}
                  onChange={(e) => updateKVPair(i, { value: e.target.value })}
                />
              )}
              {showDescription && (
                <input
                  placeholder="Description"
                  value={item.description || ''}
                  onChange={(e) => updateKVPair(i, { description: e.target.value })}
                />
              )}
              {renderActions ? (
                renderActions(item, i, removeKVPair, updateKVPair)
              ) : (
                <button onClick={() => removeKVPair(i)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button className="add-row-btn" onClick={addKVPair}>
            <Plus size={14} />
            {addLabel}
          </button>
        </>
      ) : (
        <div className="kv-bulk-editor">
          <textarea
            className="kv-bulk-textarea"
            placeholder={`key:value${showDescription ? ':description' : ''}\nkey:value${showDescription ? ':description' : ''}`}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <div className="kv-bulk-hint">
            每行一个键值对，格式: key:value{showDescription ? ':description' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
