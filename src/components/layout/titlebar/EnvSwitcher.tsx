import { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from 'react'
import { ChevronDown, Variable, Settings2, Search, X, Plus } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import Popover from '@/components/common/Popover'
import './env-switcher.css'

const EnvironmentDialog = lazy(() => import('@/components/dialogs/environment/EnvironmentDialog'))

export default function EnvSwitcher() {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newEnvName, setNewEnvName] = useState('')
  const environments = useAppStore((state) => state.environments)
  const activeEnvId = useAppStore((state) => state.activeEnvId)
  const setActiveEnv = useAppStore((state) => state.setActiveEnv)
  const addEnvironment = useAppStore((state) => state.addEnvironment)

  const activeEnv = environments.find((e) => e.id === activeEnvId)
  const listRef = useRef<HTMLDivElement>(null)
  const filterInputRef = useRef<HTMLInputElement>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  const allOptions = useMemo(() => [
    { id: null as string | null, name: 'No Environment', count: 0 },
    ...environments.map((e) => ({ id: e.id, name: e.name, count: e.variables.length })),
  ], [environments])

  const options = useMemo(() => {
    if (!filter.trim()) return allOptions
    const q = filter.toLowerCase()
    return allOptions.filter((opt) => opt.name.toLowerCase().includes(q))
  }, [allOptions, filter])

  const handleSelect = useCallback((id: string | null) => {
    setActiveEnv(id)
    setOpen(false)
    setFilter('')
    setSelectedIndex(0)
  }, [setActiveEnv])

  const handleManageClick = useCallback(() => {
    setOpen(false)
    setManageDialogOpen(true)
  }, [])

  const handleInlineAdd = useCallback(() => {
    setIsAdding(true)
    setNewEnvName('')
  }, [])

  const handleInlineCreate = useCallback(() => {
    const trimmed = newEnvName.trim()
    if (trimmed) {
      addEnvironment(trimmed)
      const newEnvs = useAppStore.getState().environments
      const created = newEnvs[newEnvs.length - 1]
      if (created) {
        setActiveEnv(created.id)
      }
    }
    setIsAdding(false)
    setNewEnvName('')
    setOpen(false)
  }, [newEnvName, addEnvironment, setActiveEnv])

  const handleAddKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleInlineCreate()
    if (e.key === 'Escape') { setIsAdding(false); setNewEnvName('') }
  }, [handleInlineCreate])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + options.length) % options.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (options[selectedIndex]) {
        handleSelect(options[selectedIndex].id)
      }
    } else if (e.key === 'Escape') {
      if (previewExpanded) {
        setPreviewExpanded(false)
      } else if (previewOpen) {
        setPreviewOpen(false)
      } else {
        setOpen(false)
      }
    }
  }, [open, selectedIndex, options, handleSelect, previewOpen, previewExpanded])

  useEffect(() => {
    if (open) {
      const activeIdx = options.findIndex((opt) => opt.id === activeEnvId)
      setSelectedIndex(activeIdx === -1 ? 0 : activeIdx)
      setTimeout(() => filterInputRef.current?.focus(), 50)
      if (activeEnv && activeEnv.variables.filter((v) => v.key).length > 0) {
        setPreviewOpen(true)
        setPreviewExpanded(false)
      }
    } else {
      setFilter('')
      setPreviewOpen(false)
      setPreviewExpanded(false)
      setIsAdding(false)
      setNewEnvName('')
    }
  }, [open, activeEnvId, options, activeEnv])

  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus()
      addInputRef.current.select()
    }
  }, [isAdding])

  return (
    <div className="tb-env-switcher">
      <Popover
        trigger={
          <button
            className="tb-env-trigger"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onKeyDown={handleKeyDown}
            title={activeEnv ? `${activeEnv.name} (${activeEnv.variables.length} variables) · Press Ctrl+E to switch` : 'No environment selected · Press Ctrl+E to switch'}
          >
            <span className={`tb-env-dot ${activeEnv ? '' : 'no-env'}`} style={activeEnv ? { background: activeEnv.color || 'var(--accent)' } : undefined} />
            <span className="tb-env-name">{activeEnv?.name || 'No Environment'}</span>
            <ChevronDown size={10} className={`tb-env-chevron ${open ? 'rotated' : ''}`} />
          </button>
        }
        placement="bottom-end"
        open={open}
        onOpenChange={setOpen}
      >
        <div className="tb-env-dropdown" role="listbox" ref={listRef} tabIndex={-1}>
          <div className="tb-env-dropdown-header">
            <span>Environments</span>
            <div className="tb-env-dropdown-header-actions">
              <kbd className="tb-env-kbd-hint">⌘E</kbd>
              {activeEnv && activeEnv.variables.filter((v) => v.key).length > 0 && (
                <button
                  className={`tb-env-preview-btn ${previewOpen ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (previewOpen) {
                      setPreviewExpanded(!previewExpanded)
                    } else {
                      setPreviewOpen(true)
                      setPreviewExpanded(false)
                    }
                  }}
                >
                  <span className="tb-env-preview-dot" />
                  <Variable size={12} />
                  {previewOpen ? (previewExpanded ? 'Collapse' : 'Show all') : 'Preview'}
                </button>
              )}
            </div>
          </div>
          {previewOpen && activeEnv && activeEnv.variables.filter((v) => v.key).length > 0 && (
            <div className={`tb-env-preview-panel ${previewExpanded ? 'expanded' : ''}`}>
              {activeEnv.variables.filter((v) => v.key).slice(0, previewExpanded ? undefined : 3).map((v) => (
                <div key={v.id} className="tb-env-preview-item">
                  <span className="tb-env-preview-key">{v.key}</span>
                  <span className="tb-env-preview-value">{v.sensitive ? '••••••' : v.value}</span>
                </div>
              ))}
              {!previewExpanded && activeEnv.variables.filter((v) => v.key).length > 3 && (
                <div className="tb-env-preview-more">+{activeEnv.variables.filter((v) => v.key).length - 3} more variables</div>
              )}
            </div>
          )}
          <div className="tb-env-filter">
            <Search size={12} />
            <input
              ref={filterInputRef}
              placeholder="Filter environments..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
            />
            {filter && (
              <button
                className="tb-env-filter-clear"
                onClick={() => { setFilter(''); filterInputRef.current?.focus() }}
                tabIndex={-1}
              >
                <X size={11} />
              </button>
            )}
          </div>
          {options.length === 0 && (
            <div className="tb-env-no-results">No environments found</div>
          )}
          {options.map((opt, idx) => {
            const env = environments.find((e) => e.id === opt.id)
            const isActive = opt.id === activeEnvId
            const isNoEnv = !opt.id
            return (
              <button
                key={opt.id || 'none'}
                className={`tb-env-option ${isActive ? 'active' : ''} ${idx === selectedIndex ? 'focused' : ''} ${isNoEnv ? 'no-env-option' : ''}`}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(opt.id)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <span className={`tb-env-option-dot ${!opt.id ? 'no-env' : ''}`} style={opt.id ? { background: env?.color || 'var(--accent)' } : undefined} />
                <span className="tb-env-option-name">{opt.name}</span>
                {opt.count > 0 && (
                  <span className="tb-env-option-count" title={`${opt.count} variable${opt.count > 1 ? 's' : ''}`}>
                    { } {opt.count}
                  </span>
                )}
                {isActive && <span className="tb-env-check">✓</span>}
              </button>
            )
          })}
          <div className="tb-env-dropdown-divider" />
          {isAdding ? (
            <div className="tb-env-add-inline">
              <Plus size={12} />
              <input
                ref={addInputRef}
                placeholder="Environment name..."
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                onBlur={handleInlineCreate}
              />
            </div>
          ) : (
            <button className="tb-env-add-btn" onClick={(e) => { e.stopPropagation(); handleInlineAdd() }}>
              <Plus size={12} />
              Add Environment
            </button>
          )}
          <div className="tb-env-dropdown-footer">
            <button className="tb-env-manage-btn" onClick={(e) => { e.stopPropagation(); handleManageClick() }}>
              <Settings2 size={12} />
              Manage Environments
            </button>
          </div>
        </div>
      </Popover>
      {manageDialogOpen && <Suspense fallback={null}><EnvironmentDialog onClose={() => setManageDialogOpen(false)} /></Suspense>}
    </div>
  )
}
