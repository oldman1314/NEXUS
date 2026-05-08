import React from 'react'
import { Star, Trash2, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'
import type { HistoryEntry } from '@/types'

interface HistoryItemProps {
  entry: HistoryEntry
  onLoad: (entry: HistoryEntry) => void
  onResend: (entry: HistoryEntry) => void
  onToggleStar: (id: string) => void
  onDelete: (id: string) => void
}

function formatTimeLabel(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default React.memo(function HistoryItem({ entry, onLoad, onResend, onToggleStar, onDelete }: HistoryItemProps) {
  const statusClass =
    entry.status >= 200 && entry.status < 300
      ? 'success'
      : entry.status >= 400
        ? 'error'
        : entry.status === 0
          ? 'error'
          : 'warning'

  const statusIcon =
    entry.status >= 200 && entry.status < 300
      ? <CheckCircle2 size={10} />
      : entry.status >= 400 || entry.status === 0
        ? <XCircle size={10} />
        : <AlertCircle size={10} />

  return (
    <Tooltip
      content={
        <div className="tooltip-rich">
          <div>{entry.method} {entry.url}</div>
          <div>Status: {entry.status} · Duration: {entry.duration}ms · Size: {entry.responseSize} B</div>
          <div>{new Date(entry.timestamp).toLocaleString()}</div>
        </div>
      }
      placement="right"
      delay={800}
    >
      <div
        className={`history-item ${entry.starred ? 'starred' : ''}`}
        onClick={() => onLoad(entry)}
      >
        <span className={`method-badge method-${entry.method.toLowerCase()}`}>{entry.method}</span>
        <span className="history-url">{entry.url}</span>

        <div className="history-meta">
          <span className={`history-status ${statusClass}`}>{statusIcon}{entry.status}</span>
          <span className={`history-duration ${entry.duration < 100 ? 'fast' : entry.duration < 500 ? 'normal' : entry.duration < 1000 ? 'slow' : 'very-slow'}`}>{entry.duration}ms</span>
          <span className="history-time">{formatTimeLabel(entry.timestamp)}</span>
        </div>

        <div className="history-actions">
          <Tooltip content="Resend" delay={200}>
            <button
              className="history-action-btn"
              onClick={(e) => {
                e.stopPropagation()
                onResend(entry)
              }}
            >
              <Play size={12} />
            </button>
          </Tooltip>
          <Tooltip content={entry.starred ? 'Unstar' : 'Star'} delay={200}>
            <button
              className={`history-action-btn ${entry.starred ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleStar(entry.id)
              }}
            >
              <Star size={12} />
            </button>
          </Tooltip>
          <Tooltip content="Delete" delay={200}>
            <button
              className="history-action-btn delete"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(entry.id)
              }}
            >
              <Trash2 size={12} />
            </button>
          </Tooltip>
        </div>
      </div>
    </Tooltip>
  )
})
