import { useState, useRef, useEffect } from 'react'
import { X, Plus, Save, Trash2, Check } from 'lucide-react'

interface ViewPreset {
  id: string
  name: string
  columns: string[]
  density: string
  sort: string
  createdAt: number
}

interface ViewPresetManagerProps {
  currentPreset: string | null
  onApply: (preset: string | null) => void
  onSave: (name: string) => void
  onClose: () => void
}

const STORAGE_KEY = 'datatable-view-presets'

function loadPresets(): ViewPreset[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function savePresets(presets: ViewPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function ViewPresetManager({ currentPreset, onApply, onSave, onClose }: ViewPresetManagerProps) {
  const [presets, setPresets] = useState<ViewPreset[]>(loadPresets)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveName, setSaveName] = useState('')
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSave = () => {
    if (!saveName.trim()) return
    const newPreset: ViewPreset = {
      id: `preset-${Date.now()}`,
      name: saveName.trim(),
      columns: [],
      density: 'standard',
      sort: '',
      createdAt: Date.now(),
    }
    const updated = [...presets, newPreset]
    setPresets(updated)
    savePresets(updated)
    onSave(saveName.trim())
    setSaveName('')
    setShowSaveForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = presets.filter((p) => p.id !== id)
    setPresets(updated)
    savePresets(updated)
    if (currentPreset === id) {
      onApply(null)
    }
  }

  const handleApply = (preset: ViewPreset) => {
    onApply(preset.id)
    onClose()
  }

  return (
    <div className="dt-view-preset-popup" ref={popupRef}>
      <div className="dt-view-preset-header">
        <span className="dt-view-preset-title">View Presets</span>
        <button className="dt-view-preset-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="dt-view-preset-save">
        {!showSaveForm ? (
          <button
            className="dt-view-preset-new-btn"
            onClick={() => setShowSaveForm(true)}
          >
            <Plus size={16} />
            Save current view
          </button>
        ) : (
          <div className="dt-view-preset-save-form">
            <input
              type="text"
              className="dt-view-preset-input"
              placeholder="Preset name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button className="dt-view-preset-save-btn" onClick={handleSave}>
              <Save size={14} />
            </button>
            <button
              className="dt-view-preset-cancel-btn"
              onClick={() => {
                setShowSaveForm(false)
                setSaveName('')
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="dt-view-preset-list">
        {presets.length === 0 ? (
          <div className="dt-view-preset-empty">
            No saved presets yet.
            <br />
            Save your current view configuration for quick access.
          </div>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className={`dt-view-preset-item ${currentPreset === preset.id ? 'active' : ''}`}
            >
              <div className="dt-view-preset-item-info">
                <span className="dt-view-preset-item-name">{preset.name}</span>
                <span className="dt-view-preset-item-date">
                  {new Date(preset.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="dt-view-preset-item-actions">
                <button
                  className="dt-view-preset-apply-btn"
                  onClick={() => handleApply(preset)}
                  disabled={currentPreset === preset.id}
                >
                  {currentPreset === preset.id ? (
                    <>
                      <Check size={12} />
                      Active
                    </>
                  ) : (
                    'Apply'
                  )}
                </button>
                <button
                  className="dt-view-preset-delete-btn"
                  onClick={() => handleDelete(preset.id)}
                  title="Delete preset"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
