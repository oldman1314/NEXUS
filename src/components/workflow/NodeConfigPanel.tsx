import { X, Trash2, Plus } from 'lucide-react'
import type { Node } from '@xyflow/react'
import { HTTP_METHODS, BODY_TYPES } from '@/constants/http'
import Tooltip from '@/components/common/Tooltip'
import { useCodeEditor } from '@/hooks/useCodeEditor'

interface KVItem {
  key: string
  value: string
  enabled: boolean
}

function NodeKVEditor({
  items,
  onChange,
}: {
  items: KVItem[]
  onChange: (items: KVItem[]) => void
}) {
  const handleUpdate = (index: number, update: Partial<KVItem>) => {
    const next = [...items]
    next[index] = { ...next[index], ...update }
    onChange(next)
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    onChange([...items, { key: '', value: '', enabled: true }])
  }

  return (
    <div className="node-kv-editor">
      {items.map((item, i) => (
        <div key={i} className={`node-kv-row${!item.enabled ? ' kv-row-disabled' : ''}`}>
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => handleUpdate(i, { enabled: e.target.checked })}
          />
          <input
            placeholder="Key"
            value={item.key}
            onChange={(e) => handleUpdate(i, { key: e.target.value })}
          />
          <input
            placeholder="Value"
            value={item.value}
            onChange={(e) => handleUpdate(i, { value: e.target.value })}
          />
          <button className="node-kv-delete" onClick={() => handleRemove(i)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button className="node-kv-add" onClick={handleAdd}>
        <Plus size={12} />
        Add
      </button>
    </div>
  )
}

function ScriptEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { textareaRef, lineCountRef } = useCodeEditor(value)

  return (
    <div className="node-script-editor">
      <div className="editor-container">
        <div className="editor-line-count" ref={lineCountRef} />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  )
}

interface NodeConfigPanelProps {
  node: Node
  onUpdate: (data: Record<string, unknown>) => void
  onDelete: () => void
  onClose?: () => void
}

export default function NodeConfigPanel({ node, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  const getNodeTitle = () => {
    const label = (node.data.label as string) || ''
    const typeNames: Record<string, string> = {
      start: 'Start',
      api: 'API Request',
      condition: 'Condition',
      transform: 'Transform',
      output: 'Output',
    }
    const typeName = typeNames[node.type || ''] || node.type || 'Node'
    return label && label !== typeName ? `${typeName}: ${label}` : typeName
  }

  const renderConfig = () => {
    switch (node.type) {
      case 'start':
        return (
          <div className="config-section">
            <p className="config-hint">Start node marks the beginning of the workflow.</p>
          </div>
        )

      case 'api':
        return (
          <div className="config-sections">
            <div className="config-section">
              <label>Name</label>
              <input
                type="text"
                value={(node.data.label as string) || ''}
                onChange={(e) => onUpdate({ label: e.target.value })}
              />
            </div>
            <div className="config-section">
              <label>Method</label>
              <select
                value={(node.data.method as string) || 'GET'}
                onChange={(e) => onUpdate({ method: e.target.value })}
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="config-section">
              <label>URL</label>
              <input
                type="text"
                placeholder="https://api.example.com/users"
                value={(node.data.url as string) || ''}
                onChange={(e) => onUpdate({ url: e.target.value })}
              />
              <p className="config-hint">Use {'{{node_id.field}}'} to reference outputs</p>
            </div>
            <div className="config-section">
              <label>Headers</label>
              <NodeKVEditor
                items={((node.data.headers as KVItem[]) || [])}
                onChange={(headers) => onUpdate({ headers })}
              />
            </div>
            <div className="config-section">
              <label>Body Type</label>
              <select
                value={(node.data.bodyType as string) || 'none'}
                onChange={(e) => onUpdate({ bodyType: e.target.value })}
              >
                {BODY_TYPES.map((bt) => (
                  <option key={bt.value} value={bt.value}>
                    {bt.label}
                  </option>
                ))}
              </select>
            </div>
            {((node.data.bodyType as string) === 'json' ||
              (node.data.bodyType as string) === 'text') && (
              <div className="config-section">
                <label>Body</label>
                <textarea
                  rows={6}
                  value={(node.data.bodyRaw as string) || ''}
                  onChange={(e) => onUpdate({ bodyRaw: e.target.value })}
                />
              </div>
            )}
            <div className="config-section">
              <label>Params</label>
              <NodeKVEditor
                items={((node.data.params as KVItem[]) || [])}
                onChange={(params) => onUpdate({ params })}
              />
            </div>
          </div>
        )

      case 'condition':
        return (
          <div className="config-sections">
            <div className="config-section">
              <label>Name</label>
              <input
                type="text"
                value={(node.data.label as string) || ''}
                onChange={(e) => onUpdate({ label: e.target.value })}
              />
            </div>
            <div className="config-section">
              <label>Expression</label>
              <input
                type="text"
                placeholder="{{prev.status}} === 200"
                value={(node.data.expression as string) || ''}
                onChange={(e) => onUpdate({ expression: e.target.value })}
              />
              <p className="config-hint">
                Use {'{{node_id.field}}'} to reference outputs. Returns true/false.
              </p>
            </div>
          </div>
        )

      case 'transform':
        return (
          <div className="config-sections">
            <div className="config-section">
              <label>Name</label>
              <input
                type="text"
                value={(node.data.label as string) || ''}
                onChange={(e) => onUpdate({ label: e.target.value })}
              />
            </div>
            <div className="config-section">
              <label>Transform Script</label>
              <ScriptEditor
                value={(node.data.script as string) || ''}
                onChange={(script) => onUpdate({ script })}
              />
              <p className="config-hint">
                Write JavaScript. Input is available as `input` variable.
              </p>
            </div>
          </div>
        )

      case 'output':
        return (
          <div className="config-sections">
            <div className="config-section">
              <label>Name</label>
              <input
                type="text"
                value={(node.data.label as string) || ''}
                onChange={(e) => onUpdate({ label: e.target.value })}
              />
            </div>
            <div className="config-section">
              <label>Output Format</label>
              <select
                value={(node.data.format as string) || 'json'}
                onChange={(e) => onUpdate({ format: e.target.value })}
              >
                <option value="json">JSON</option>
                <option value="text">Text</option>
              </select>
            </div>
          </div>
        )

      default:
        return <div className="config-section">No configuration for this node type.</div>
    }
  }

  return (
    <div className="node-config-panel">
      <div className="config-header">
        <h3>{getNodeTitle()}</h3>
        <div className="config-actions">
          <button className="config-action-btn delete" onClick={onDelete}>
            <Trash2 size={14} />
          </button>
          <Tooltip content="Close">
            <button className="config-action-btn" onClick={() => onClose?.()}>
              <X size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="config-body">{renderConfig()}</div>
    </div>
  )
}