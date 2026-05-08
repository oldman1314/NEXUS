import { useState, useRef, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Download,
  Rows3,
  List,
  AlignJustify,
  Clock,
  FolderOpen,
  PlayCircle,
  Table2,
  PanelRight,
  Columns3,
  Bookmark,
  Sparkles,
  ArrowRight,
  FileJson,
  FileSpreadsheet,
  Check,
} from 'lucide-react'
import type { Density, Column, QueryMode, QueryHistoryItem } from './types'
import { ColumnVisibilityPopup } from './ColumnVisibilityPopup'
import { ViewPresetManager } from './ViewPresetManager'

interface DataTableToolbarProps {
  columns: Column[]
  density: Density
  mode: QueryMode
  projectId: string
  testRunId: string
  loading: boolean
  progress: { current: number; total: number } | null
  history: QueryHistoryItem[]
  sealed: boolean
  selectedCount: number
  visibleColumns: Set<string>
  currentViewPreset: string | null
  onDensityChange: (density: Density) => void
  onModeChange: (mode: QueryMode) => void
  onProjectIdChange: (value: string) => void
  onTestRunIdChange: (value: string) => void
  onSearch: () => void
  onHistorySelect: (item: QueryHistoryItem) => void
  onClearHistory: () => void
  onRefresh: () => void
  onColumnVisibilityChange: (key: string, visible: boolean) => void
  onExport: (format: 'csv' | 'json' | 'excel') => void
  onClearFilters: () => void
  onViewPresetChange: (preset: string | null) => void
  onSaveViewPreset: (name: string) => void
}

const DENSITY_CYCLE: Density[] = ['comfortable', 'standard', 'compact']
const DENSITY_META: Record<Density, { icon: typeof Rows3; label: string; short: string }> = {
  comfortable: { icon: Rows3, label: 'Comfortable', short: 'COM' },
  standard: { icon: List, label: 'Standard', short: 'STD' },
  compact: { icon: AlignJustify, label: 'Compact', short: 'CPT' },
}

export function DataTableToolbar({
  columns,
  density,
  mode,
  projectId,
  testRunId,
  loading,
  progress,
  history,
  sealed,
  visibleColumns,
  currentViewPreset,
  onDensityChange,
  onModeChange,
  onProjectIdChange,
  onTestRunIdChange,
  onSearch,
  onHistorySelect,
  onClearHistory,
  onRefresh,
  onColumnVisibilityChange,
  onExport,
  onClearFilters: _onClearFilters,
  onViewPresetChange,
  onSaveViewPreset,
}: DataTableToolbarProps) {
  const [commandValue, setCommandValue] = useState('')
  const [commandFocused, setCommandFocused] = useState(false)
  const [showColumns, setShowColumns] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const [densityKey, setDensityKey] = useState(0)

  const commandRef = useRef<HTMLInputElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const prevLoading = useRef(loading)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false)
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (prevLoading.current && !loading) {
      setLaunching(false)
      setSuccessState(true)
      const t = setTimeout(() => setSuccessState(false), 1200)
      prevLoading.current = loading
      return () => clearTimeout(t)
    }
    prevLoading.current = loading
  }, [loading])

  const handleCommandChange = useCallback((value: string) => {
    setCommandValue(value)
    if (value.includes('/')) {
      const parts = value.split('/')
      onProjectIdChange(parts[0].trim())
      onTestRunIdChange(parts.slice(1).join('/').trim())
    } else {
      onProjectIdChange(value.trim())
    }
  }, [onProjectIdChange, onTestRunIdChange])

  const handleCommandKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLaunch()
    }
  }, [])

  const handleLaunch = useCallback(() => {
    if (!loading && projectId.trim() && testRunId.trim()) {
      setLaunching(true)
      onSearch()
      setTimeout(() => setLaunching(false), 500)
    }
  }, [loading, projectId, testRunId, onSearch])

  const cycleDensity = useCallback(() => {
    const idx = DENSITY_CYCLE.indexOf(density)
    onDensityChange(DENSITY_CYCLE[(idx + 1) % DENSITY_CYCLE.length])
    setDensityKey((k) => k + 1)
  }, [density, onDensityChange])

  const handleDensityKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = DENSITY_CYCLE.indexOf(density)
      onDensityChange(DENSITY_CYCLE[(idx + 1) % DENSITY_CYCLE.length])
      setDensityKey((k) => k + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = DENSITY_CYCLE.indexOf(density)
      onDensityChange(DENSITY_CYCLE[(idx - 1 + DENSITY_CYCLE.length) % DENSITY_CYCLE.length])
      setDensityKey((k) => k + 1)
    }
  }, [density, onDensityChange])

  const DensityIcon = DENSITY_META[density].icon
  const canSearch = !loading && projectId.trim() && testRunId.trim()

  const commandBarState = launching ? 'launching' : successState ? 'success' : loading ? 'loading' : commandFocused ? 'focused' : 'idle'

  return (
    <div
      className={`dt-toolbar ${loading ? 'dt-toolbar--loading' : ''} ${successState ? 'dt-toolbar--success' : ''}`}
      ref={toolbarRef}
    >
      <div className="dt-toolbar__row">
        {!sealed ? (
          <div className="dt-command-area">
            <div className={`dt-command-bar dt-command-bar--${commandBarState}`}>
              <div className="dt-command-bar__icon">
                <Sparkles size={14} />
              </div>
              <input
                ref={commandRef}
                className="dt-command-bar__input"
                type="text"
                value={commandValue}
                onChange={(e) => handleCommandChange(e.target.value)}
                onKeyDown={handleCommandKeyDown}
                onFocus={() => setCommandFocused(true)}
                onBlur={() => setCommandFocused(false)}
                placeholder="Project ID / Test Run ID"
                disabled={loading}
              />
              <button
                className={`dt-command-bar__fire ${canSearch ? 'dt-command-bar__fire--ready' : ''}`}
                onClick={handleLaunch}
                disabled={!canSearch}
                title="Search"
              >
                {successState ? <Check size={14} /> : <ArrowRight size={14} />}
              </button>
              {loading && (
                <div className="dt-command-bar__energy-flow" />
              )}
              {launching && (
                <div className="dt-command-bar__launch-wave" />
              )}
              {successState && (
                <div className="dt-command-bar__complete-wave" />
              )}
              <div className="dt-command-bar__border-glow" />
            </div>
          </div>
        ) : (
          <div className="dt-breadcrumb-trail">
            <div className="dt-breadcrumb-trail__node">
              <FolderOpen size={13} />
              <span className="dt-breadcrumb-trail__label">{projectId}</span>
            </div>
            <div className="dt-breadcrumb-trail__line">
              <span className="dt-breadcrumb-trail__particle" />
              <span className="dt-breadcrumb-trail__particle dt-breadcrumb-trail__particle--delayed" />
            </div>
            <div className="dt-breadcrumb-trail__node">
              <PlayCircle size={13} />
              <span className="dt-breadcrumb-trail__label dt-breadcrumb-trail__label--mono">{testRunId}</span>
            </div>
          </div>
        )}

        <div className="dt-orbital">
          <button
            className="dt-orbital__btn"
            onClick={cycleDensity}
            onKeyDown={handleDensityKeyDown}
            title={`Density: ${DENSITY_META[density].label}`}
            aria-label={`Row density: ${DENSITY_META[density].label}`}
          >
            <span className="dt-orbital__icon dt-orbital__icon--flip" key={densityKey}>
              <DensityIcon size={14} />
            </span>
            <span className="dt-orbital__tag" key={`tag-${densityKey}`}>{DENSITY_META[density].short}</span>
          </button>

          <span className="dt-orbital__dot" />

          <div className="dt-segmented">
            <div className="dt-segmented__track">
              <div
                className="dt-segmented__highlight"
                style={{ transform: `translateX(${mode === 'detailed' ? '100%' : '0'})` }}
              />
              <button
                className={`dt-segmented__btn ${mode === 'simple' ? 'dt-segmented__btn--active' : ''}`}
                onClick={() => onModeChange('simple')}
                title="Simple view"
              >
                <Table2 size={13} />
                <span>Simple</span>
              </button>
              <button
                className={`dt-segmented__btn ${mode === 'detailed' ? 'dt-segmented__btn--active' : ''}`}
                onClick={() => onModeChange('detailed')}
                title="Detailed view"
              >
                <PanelRight size={13} />
                <span>Detailed</span>
              </button>
            </div>
          </div>

          <span className="dt-orbital__dot" />

          <button
            className={`dt-orbital__btn ${showColumns ? 'dt-orbital__btn--active' : ''}`}
            onClick={() => { setShowColumns(!showColumns); setShowHistory(false); setShowPresets(false); setShowExport(false) }}
            title="Columns"
          >
            <Columns3 size={14} />
          </button>

          {history.length > 0 && (
            <>
              <span className="dt-orbital__dot" />
              <div className="dt-orbital__popup-wrap" ref={historyRef}>
                <button
                  className={`dt-orbital__btn ${showHistory ? 'dt-orbital__btn--active' : ''}`}
                  onClick={() => { setShowHistory(!showHistory); setShowColumns(false); setShowPresets(false); setShowExport(false) }}
                  title="History"
                >
                  <Clock size={14} />
                </button>
                {showHistory && (
                  <div className="dt-chip-popup">
                    <div className="dt-chip-popup__header">Recent Searches</div>
                    {history.map((item, index) => (
                      <button
                        key={index}
                        className="dt-chip-popup__item"
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => { onHistorySelect(item); setShowHistory(false) }}
                      >
                        <span className="dt-chip-popup__project">{item.projectId}</span>
                        {item.testRunId && (
                          <>
                            <span className="dt-chip-popup__sep">/</span>
                            <span className="dt-chip-popup__run">{item.testRunId}</span>
                          </>
                        )}
                        {item.timestamp && (
                          <span className="dt-chip-popup__time">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </button>
                    ))}
                    <div className="dt-chip-popup__footer">
                      <button className="dt-chip-popup__link" onClick={() => { onClearHistory(); setShowHistory(false) }}>
                        Clear history
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <span className="dt-orbital__dot" />

          <div className="dt-orbital__popup-wrap" ref={exportRef}>
            <button
              className={`dt-orbital__btn ${showExport ? 'dt-orbital__btn--active' : ''}`}
              onClick={() => { setShowExport(!showExport); setShowColumns(false); setShowHistory(false); setShowPresets(false) }}
              title="Export"
            >
              <Download size={14} />
            </button>
            {showExport && (
              <div className="dt-chip-popup">
                <button className="dt-chip-popup__item" style={{ animationDelay: '0ms' }} onClick={() => { onExport('csv'); setShowExport(false) }}>
                  <FileSpreadsheet size={13} /> Export CSV
                </button>
                <button className="dt-chip-popup__item" style={{ animationDelay: '30ms' }} onClick={() => { onExport('json'); setShowExport(false) }}>
                  <FileJson size={13} /> Export JSON
                </button>
                <button className="dt-chip-popup__item" style={{ animationDelay: '60ms' }} onClick={() => { onExport('excel'); setShowExport(false) }}>
                  <FileSpreadsheet size={13} /> Export Excel
                </button>
              </div>
            )}
          </div>

          <span className="dt-orbital__dot" />

          <button
            className={`dt-orbital__btn ${showPresets ? 'dt-orbital__btn--active' : ''}`}
            onClick={() => { setShowPresets(!showPresets); setShowColumns(false); setShowHistory(false); setShowExport(false) }}
            title="View Presets"
          >
            <Bookmark size={14} />
          </button>

          <span className="dt-orbital__dot" />

          <button
            className="dt-orbital__btn"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'dt-ease-spin' : ''} />
          </button>
        </div>

        <div className="dt-toolbar__popups">
          {showColumns && (
            <ColumnVisibilityPopup
              columns={columns}
              visibleColumns={visibleColumns}
              onChange={onColumnVisibilityChange}
              onClose={() => setShowColumns(false)}
            />
          )}
          {showPresets && (
            <ViewPresetManager
              currentPreset={currentViewPreset}
              onApply={onViewPresetChange}
              onSave={onSaveViewPreset}
              onClose={() => setShowPresets(false)}
            />
          )}
        </div>
      </div>

      {progress && progress.total > 0 && (
        <div className="dt-toolbar__progress">
          <div
            className="dt-toolbar__progress-bar"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
          <span className="dt-toolbar__progress-text">
            Loading {progress.current} / {progress.total} pages…
          </span>
        </div>
      )}
    </div>
  )
}
