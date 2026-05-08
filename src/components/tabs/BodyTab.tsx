import { useMemo } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { useRequestStore } from '@/stores/useRequestStore'
import { BODY_TYPES } from '@/constants/http'
import type { BodyType } from '@/types'
import KVEditor from './KVEditor'
import Tooltip from '@/components/common/Tooltip'
import { useCodeEditor } from '@/hooks/useCodeEditor'
import './body-tab.css'

export default function BodyTab() {
  const request = useRequestStore((state) => state.activeRequest)
  const updateActiveRequest = useRequestStore((state) => state.updateActiveRequest)
  const isTextBody = request?.bodyType === 'json' || request?.bodyType === 'text'
  const { textareaRef, lineCountRef } = useCodeEditor(isTextBody ? (request?.bodyRaw || '') : '')

  if (!request) return null

  const handleBeautify = () => {
    if (request.bodyType === 'json' && request.bodyRaw) {
      try {
        const parsed = JSON.parse(request.bodyRaw)
        updateActiveRequest({ bodyRaw: JSON.stringify(parsed, null, 2) })
      } catch {}
    }
  }

  const handleMinify = () => {
    if (request.bodyType === 'json' && request.bodyRaw) {
      try {
        const parsed = JSON.parse(request.bodyRaw)
        updateActiveRequest({ bodyRaw: JSON.stringify(parsed) })
      } catch {}
    }
  }

  const bodySize = useMemo(() => new TextEncoder().encode(request?.bodyRaw || '').length, [request?.bodyRaw])
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <div className="body-editor">
      <div className="body-toolbar">
        <FileText size={14} />
        <span>Body</span>
        <select
          className="body-type-select"
          value={request.bodyType}
          onChange={(e) => updateActiveRequest({ bodyType: e.target.value as BodyType })}
        >
          {BODY_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>
              {bt.label}
            </option>
          ))}
        </select>
        {isTextBody && request.bodyRaw && (
          <span className="body-size-indicator">{formatSize(bodySize)}</span>
        )}
        <div className="body-toolbar-actions">
          {request.bodyType === 'json' && (
            <>
              <button className="body-toolbar-btn" onClick={handleBeautify}>
                Beautify
              </button>
              <button className="body-toolbar-btn" onClick={handleMinify}>
                Minify
              </button>
            </>
          )}
        </div>
      </div>

      {isTextBody && (
        <div className="body-editor-wrapper">
          <div className="body-line-numbers" ref={lineCountRef} />
          <textarea
            ref={textareaRef}
            className="body-textarea with-line-numbers"
            placeholder={`Enter ${request.bodyType} body...`}
            value={request.bodyRaw}
            onChange={(e) => updateActiveRequest({ bodyRaw: e.target.value })}
            spellCheck={false}
          />
        </div>
      )}

      {request.bodyType === 'x-www-form-urlencoded' && (
        <KVEditor
          field="urlEncodedData"
          addLabel="Add Parameter"
        />
      )}

      {request.bodyType === 'form-data' && (
        <KVEditor
          field="formData"
          addLabel="Add Field"
          showFileToggle
          renderValueCell={(item, i, update) =>
            item.type === 'file' ? (
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id={`file-${i}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      update(i, { value: file.name, fileName: file.name })
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <label htmlFor={`file-${i}`} className="file-input-label">
                  {item.fileName || 'Choose file...'}
                </label>
              </div>
            ) : (
              <input
                placeholder="Value"
                value={item.value}
                onChange={(e) => update(i, { value: e.target.value })}
              />
            )
          }
          renderActions={(item, i, remove, update) => (
            <div className="formdata-actions">
              <Tooltip content={item.type === 'file' ? 'Switch to text' : 'Switch to file'}>
                <button
                  className="type-toggle"
                  onClick={() =>
                    update(i, {
                      type: item.type === 'file' ? 'text' : 'file',
                      value: '',
                      fileName: undefined,
                    })
                  }
                >
                  {item.type === 'file' ? 'Text' : 'File'}
                </button>
              </Tooltip>
              <button onClick={() => remove(i)}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        />
      )}

      {request.bodyType === 'none' && (
        <div className="empty-body">No body for this request</div>
      )}
    </div>
  )
}
