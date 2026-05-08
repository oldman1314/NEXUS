import { memo } from 'react'
import { FileCode, ClipboardPaste, Code, Save } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'
import { defaultTemplates } from '@/utils/request-templates'
import type { RequestData } from '@/types'

interface RequestToolbarProps {
  isDirty: boolean
  activeCollectionId: string | null
  showTemplates: boolean
  curlImportOpen: boolean
  curlInput: string
  onCurlInputChange: (v: string) => void
  onSave: () => void
  onToggleTemplates: () => void
  onToggleCurlImport: () => void
  onLoadTemplate: (template: Partial<RequestData>) => void
  onCurlImport: () => void
  onCodeGen: () => void
}

const RequestToolbar = memo(({
  isDirty, activeCollectionId, showTemplates, curlImportOpen, curlInput,
  onCurlInputChange, onSave, onToggleTemplates, onToggleCurlImport,
  onLoadTemplate, onCurlImport, onCodeGen,
}: RequestToolbarProps) => {
  return (
    <div className="url-bar-tools">
      {activeCollectionId && (
        <Tooltip content="Save Request" shortcut="⌘S">
          <button
            className={`save-btn ${isDirty ? 'save-btn-dirty' : ''}`}
            onClick={onSave}
            disabled={!isDirty}
          >
            <Save size={14} />
          </button>
        </Tooltip>
      )}
      <Tooltip content="Templates">
        <button className="save-btn" onClick={onToggleTemplates}>
          <FileCode size={14} />
        </button>
      </Tooltip>
      <Tooltip content="Import cURL">
        <button className="save-btn" onClick={onToggleCurlImport}>
          <ClipboardPaste size={14} />
        </button>
      </Tooltip>
      <Tooltip content="Generate Code" shortcut="⇧⌘G">
        <button className="save-btn" onClick={onCodeGen}>
          <Code size={14} />
        </button>
      </Tooltip>

      {showTemplates && (
        <div className="templates-dropdown">
          {defaultTemplates.map((t) => (
            <div
              key={t.id}
              className="template-item"
              onClick={() => onLoadTemplate(t.request)}
            >
              <span className="template-name">{t.name}</span>
              <span className="template-desc">{t.description}</span>
            </div>
          ))}
        </div>
      )}
      {curlImportOpen && (
        <div className="curl-import-dropdown">
          <div className="curl-import-header">Import from cURL</div>
          <textarea
            className="curl-import-textarea"
            placeholder="Paste cURL command here..."
            value={curlInput}
            onChange={(e) => onCurlInputChange(e.target.value)}
          />
          <div className="curl-import-footer">
            <button
              className="btn-primary"
              onClick={onCurlImport}
              disabled={!curlInput.trim()}
            >
              Import
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

RequestToolbar.displayName = 'RequestToolbar'

export default RequestToolbar
