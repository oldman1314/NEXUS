import { useMemo } from 'react'
import { Check, X, AlertCircle, Clock, SkipForward, MoreHorizontal, HelpCircle, ArrowUpRight, Copy, User, Calendar, Zap, Tag, Layers, Beaker, Timer } from 'lucide-react'
import type { Column, DataTableRow as DataTableRowType, Density } from './types'
import EllipsisText from './EllipsisText'

interface DataTableRowProps {
  row: DataTableRowType
  column: Column
  density: Density
  searchQuery: string
  isSelected: boolean
  onToggleSelect: () => void
}

function highlightSearchText(text: string, query: string) {
  if (!query.trim()) return text
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="dt-search-highlight">{part}</mark> : part
  )
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const RESULT_MAP: Record<string, { cls: string; icon: React.ReactNode }> = {
  passed: { cls: 'dt-result-passed', icon: <Check size={12} /> },
  failed: { cls: 'dt-result-failed', icon: <X size={12} /> },
  blocked: { cls: 'dt-result-blocked', icon: <AlertCircle size={12} /> },
  waiting: { cls: 'dt-result-waiting', icon: <Clock size={12} /> },
  error: { cls: 'dt-result-error', icon: <AlertCircle size={12} /> },
  skipped: { cls: 'dt-result-skipped', icon: <SkipForward size={12} /> },
  incomplete: { cls: 'dt-result-incomplete', icon: <MoreHorizontal size={12} /> },
}

function getResultBadge(result: string) {
  const r = result?.trim() || ''
  const config = RESULT_MAP[r] || { cls: 'dt-result-unknown', icon: <HelpCircle size={12} /> }
  return (
    <span className={`dt-result-badge ${config.cls}`}>
      <span className="dt-result-badge-icon">{config.icon}</span>
      {r || 'Unknown'}
    </span>
  )
}

function getExecutedBadge(executed: unknown) {
  const isExecuted = executed === 1 || executed === true || executed === '1'
  return (
    <span className={`dt-executed-badge ${isExecuted ? 'yes' : 'no'}`}>
      {isExecuted ? <Check size={12} /> : <X size={12} />}
      {String(executed ?? 0)}
    </span>
  )
}

function getDurationHeat(duration: number) {
  if (duration < 1) return 'dt-duration-heat-low'
  if (duration < 5) return 'dt-duration-heat-mid'
  return 'dt-duration-heat-high'
}

function getDurationBar(duration: number) {
  const maxDuration = 10
  const pct = Math.min((duration / maxDuration) * 100, 100)
  const heat = getDurationHeat(duration)
  const fillClass = heat === 'dt-duration-heat-low' ? 'low' : heat === 'dt-duration-heat-mid' ? 'mid' : 'high'
  return (
    <div className="dt-duration-bar-wrap">
      <div className="dt-duration-bar-track">
        <div className={`dt-duration-bar-fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={heat}>{duration > 0 ? `${duration}` : '-'}</span>
    </div>
  )
}

function getPriorityBadge(priority: string | undefined) {
  if (!priority) return <span className="dt-cell-dim">-</span>
  const map: Record<string, { cls: string }> = {
    P0: { cls: 'dt-priority-p0' },
    P1: { cls: 'dt-priority-p1' },
    P2: { cls: 'dt-priority-p2' },
    P3: { cls: 'dt-priority-p3' },
  }
  const config = map[priority] || { cls: '' }
  return <span className={`dt-cell-badge ${config.cls}`}>{priority}</span>
}

export function DataTableRow({ row, column, density, searchQuery, isSelected, onToggleSelect }: DataTableRowProps) {
  const value = row[column.key]
  const stringValue = value != null ? String(value) : ''

  const content = useMemo(() => {
    if (column.key === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onToggleSelect()
          }}
        />
      )
    }

    if (column.key === 'result') {
      return getResultBadge(stringValue)
    }

    if (column.key === 'executed') {
      return getExecutedBadge(row.executed)
    }

    if (column.key === 'duration') {
      const duration = typeof row.duration === 'number' ? row.duration : 0
      return getDurationBar(duration)
    }

    if (column.key === 'id') {
      return (
        <span className="dt-cell-id-inner">
          {stringValue || '-'}
          <button
            className="dt-cell-copy-btn"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(stringValue)
            }}
            title="Copy ID"
          >
            <Copy size={12} />
          </button>
        </span>
      )
    }

    if (column.key === 'title') {
      return (
        <div className="dt-cell-title-wrap" title={stringValue}>
          <span className="dt-cell-title-main">
            {row.fetchFailed && <span className="dt-fetch-failed-icon">{'\u26A0'}</span>}
            <EllipsisText text={stringValue} maxWidth={density === 'compact' ? 260 : 380} />
          </span>
        </div>
      )
    }

    if (column.key === 'testPriority') {
      return getPriorityBadge(row.testPriority)
    }

    if (column.key === 'testContent') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      return <EllipsisText text={stringValue} maxWidth={200} />
    }

    if (column.key === 'testEnvironment') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      const envMap: Record<string, { cls: string; icon: React.ReactNode }> = {
        hadSim: { cls: 'dt-env-hadsim', icon: <Beaker size={11} /> },
        HiL: { cls: 'dt-env-hil', icon: <Zap size={11} /> },
        SiL: { cls: 'dt-env-sil', icon: <Layers size={11} /> },
        UAT: { cls: 'dt-env-uat', icon: <Tag size={11} /> },
        PRE: { cls: 'dt-env-pre', icon: <Calendar size={11} /> },
      }
      const config = envMap[stringValue] || { cls: '', icon: null }
      return (
        <span className={`dt-cell-badge ${config.cls}`}>
          {config.icon}
          {stringValue}
        </span>
      )
    }

    if (column.key === 'defectURI') {
      if (!stringValue || stringValue === 'null') return <span className="dt-cell-dim">-</span>
      return (
        <a href={stringValue} target="_blank" rel="noopener noreferrer" className="dt-detail-link dt-cell-link-sm">
          <ArrowUpRight size={12} /> Defect
        </a>
      )
    }

    if (column.key === 'executedTime') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      return (
        <span className="dt-cell-with-icon">
          <Timer size={11} className="dt-cell-icon-dim" />
          <EllipsisText text={stringValue} maxWidth={140} />
        </span>
      )
    }

    if (column.key === 'executedBy') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      return (
        <span className="dt-cell-with-icon">
          <User size={11} className="dt-cell-icon-dim" />
          <EllipsisText text={stringValue} maxWidth={100} />
        </span>
      )
    }

    if (column.key === 'assignee') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      return (
        <span className="dt-cell-with-icon">
          <User size={11} className="dt-cell-icon-dim" />
          <EllipsisText text={stringValue} maxWidth={100} />
        </span>
      )
    }

    if (column.key === 'caseStatus') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      return <EllipsisText text={stringValue} maxWidth={120} />
    }

    if (column.key === 'automation') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      return <EllipsisText text={stringValue} maxWidth={120} />
    }

    if (column.key === 'featureCluster') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      return <EllipsisText text={stringValue} maxWidth={100} />
    }

    if (column.key === 'featureName') {
      if (!stringValue) return <span className="dt-cell-dim">-</span>
      return <EllipsisText text={stringValue} maxWidth={120} />
    }

    if (column.key === 'stepResultCount' || column.key === 'testStepCount') {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10)
      if (isNaN(num) || num === 0) return <span className="dt-cell-dim">0</span>
      return <span>{num}</span>
    }

    if (searchQuery && stringValue) {
      return <span>{highlightSearchText(stringValue, searchQuery)}</span>
    }

    if (!stringValue) {
      return <span className="dt-cell-dim">-</span>
    }

    return <EllipsisText text={stringValue} maxWidth={200} />
  }, [column.key, row, stringValue, density, searchQuery, isSelected, onToggleSelect])

  return content
}
