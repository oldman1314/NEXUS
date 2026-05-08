import { useState } from 'react'
import { X, FileJson, Upload, Check, Globe } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useUIStore } from '@/stores/useUIStore'
import { parseImport } from '@/utils/import-engine'
import type { RequestData } from '@/types'
import './import-dialog.css'

export default function ImportDialog() {
  const open = useUIStore((state) => state.importDialogOpen)
  const setOpen = useUIStore((state) => state.setImportDialogOpen)
  const collections = useAppStore((state) => state.collections)
  const addCollection = useAppStore((state) => state.addCollection)
  const addRequestToCollection = useAppStore((state) => state.addRequestToCollection)
  const environments = useAppStore((state) => state.environments)
  const activeEnvId = useAppStore((state) => state.activeEnvId)

  const [jsonInput, setJsonInput] = useState('')
  const [parsedRequests, setParsedRequests] = useState<RequestData[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [targetCollectionId, setTargetCollectionId] = useState('')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [detectedFormat, setDetectedFormat] = useState('')

  const activeEnv = environments.find((e) => e.id === activeEnvId)
  const envBaseUrl = (activeEnv?.baseUrl && activeEnv.baseUrlEnabled !== false) ? activeEnv.baseUrl : ''

  const handleParse = () => {
    try {
      setError('')
      const result = parseImport(jsonInput, envBaseUrl)
      setParsedRequests(result.requests)
      setSelectedIds(new Set(result.requests.map((r) => r.id)))
      setDetectedFormat(result.formatName)
      if (result.collectionName && !newCollectionName) {
        setNewCollectionName(result.collectionName)
      }
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === parsedRequests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(parsedRequests.map((r) => r.id)))
    }
  }

  const handleImport = () => {
    const selected = parsedRequests.filter((r) => selectedIds.has(r.id))
    if (selected.length === 0) return

    let collectionId = targetCollectionId
    if (newCollectionName.trim()) {
      collectionId = addCollection(newCollectionName.trim())
    }

    if (!collectionId) {
      setError('Please select or create a collection')
      return
    }

    selected.forEach((req) => {
      addRequestToCollection(collectionId, { ...req, id: crypto.randomUUID() })
    })

    handleClose()
  }

  const handleClose = () => {
    setOpen(false)
    setJsonInput('')
    setParsedRequests([])
    setSelectedIds(new Set())
    setTargetCollectionId('')
    setNewCollectionName('')
    setError('')
    setStep('input')
    setDetectedFormat('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setJsonInput(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  if (!open) return null

  return (
    <div className="import-overlay" onClick={handleClose}>
      <div className="import-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="import-header">
          <h2>
            <FileJson size={20} />
            Import Collection
          </h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {step === 'input' ? (
          <div className="import-body">
            {envBaseUrl ? (
              <div className="import-env-baseurl">
                <Globe size={14} />
                <span>Active env: <strong>{activeEnv?.name}</strong></span>
                <span className="import-env-baseurl-value">{'{{base_url}}'} = {envBaseUrl}</span>
              </div>
            ) : activeEnv?.baseUrl && activeEnv.baseUrlEnabled === false ? (
              <div className="import-env-baseurl import-env-baseurl-empty">
                <Globe size={14} />
                <span>Base URL is disabled in <strong>{activeEnv.name}</strong> — enable it for {'{{base_url}}'} support</span>
              </div>
            ) : (
              <div className="import-env-baseurl import-env-baseurl-empty">
                <Globe size={14} />
                <span>No Base URL configured — set it in environment settings for {'{{base_url}}'} support</span>
              </div>
            )}

            <div className="import-section">
              <label>Import JSON (YApi / Swagger / OpenAPI / Postman)</label>
              <textarea
                placeholder="Paste export JSON here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={12}
              />
            </div>

            <div className="import-or">
              <span>OR</span>
            </div>

            <div className="import-upload">
              <label className="upload-btn">
                <Upload size={16} />
                Upload JSON File
                <input type="file" accept=".json" onChange={handleFileUpload} hidden />
              </label>
            </div>

            {error && <div className="import-error">{error}</div>}
          </div>
        ) : (
          <div className="import-body">
            <div className="preview-header">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={selectedIds.size === parsedRequests.length && parsedRequests.length > 0}
                  onChange={toggleSelectAll}
                />
                Select All ({selectedIds.size}/{parsedRequests.length})
              </label>
              {detectedFormat && <span className="detected-format">Detected: {detectedFormat}</span>}
            </div>
            <div className="preview-list">
              {parsedRequests.map((req) => (
                <div key={req.id} className="preview-item">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(req.id)}
                    onChange={() => toggleSelect(req.id)}
                  />
                  <span className={`preview-method method-${req.method.toLowerCase()}`}>
                    {req.method}
                  </span>
                  <span className="preview-name">{req.name}</span>
                  <span className="preview-path">{req.url}</span>
                </div>
              ))}
            </div>

            <div className="import-target">
              <div className="target-field">
                <label>Target Collection</label>
                <select
                  value={targetCollectionId}
                  onChange={(e) => setTargetCollectionId(e.target.value)}
                >
                  <option value="">Select collection...</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="target-or">or</div>
              <div className="target-field">
                <label>New Collection</label>
                <input
                  type="text"
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="import-error">{error}</div>}
          </div>
        )}

        <div className="import-footer">
          {step === 'input' ? (
            <>
              <button className="btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleParse} disabled={!jsonInput.trim()}>
                Parse & Preview
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setStep('input')}>
                Back
              </button>
              <button
                className="btn-primary"
                onClick={handleImport}
                disabled={selectedIds.size === 0}
              >
                <Check size={14} />
                Import {selectedIds.size} Request{selectedIds.size !== 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
