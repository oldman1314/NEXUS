import { useState, useMemo, useCallback } from 'react'
import { Search, Trash2, Download, History } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useRequestStore } from '@/stores/useRequestStore'
import { useUIStore } from '@/stores/useUIStore'
import { toast } from '@/stores/useToastStore'
import type { HistoryEntry } from '@/types'
import HistoryItem from './HistoryItem'
import Tooltip from '@/components/common/Tooltip'
import './history-panel.css'

function isToday(date: Date): boolean {
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

function isYesterday(date: Date): boolean {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

interface GroupedHistory {
  today: HistoryEntry[]
  yesterday: HistoryEntry[]
  earlier: HistoryEntry[]
}

function groupHistory(entries: HistoryEntry[]): GroupedHistory {
  const groups: GroupedHistory = { today: [], yesterday: [], earlier: [] }
  for (const entry of entries) {
    const date = new Date(entry.timestamp)
    if (isToday(date)) {
      groups.today.push(entry)
    } else if (isYesterday(date)) {
      groups.yesterday.push(entry)
    } else {
      groups.earlier.push(entry)
    }
  }
  return groups
}

export default function HistoryPanel() {
  const [searchQuery, setSearchQuery] = useState('')

  const history = useAppStore((state) => state.history)
  const clearHistory = useAppStore((state) => state.clearHistory)
  const deleteHistoryEntry = useAppStore((state) => state.deleteHistoryEntry)
  const toggleStarHistory = useAppStore((state) => state.toggleStarHistory)
  const setActiveRequest = useRequestStore((state) => state.setActiveRequest)
  const setView = useUIStore((state) => state.setView)
  const setResponse = useRequestStore((state) => state.setResponse)
  const environments = useAppStore((state) => state.environments)
  const activeEnvId = useAppStore((state) => state.activeEnvId)

  const activeEnv = useMemo(() => environments.find((e) => e.id === activeEnvId) || null, [environments, activeEnvId])

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return history
    return history.filter((h) => {
      const matchUrl = h.url.toLowerCase().includes(query)
      const matchMethod = h.method.toLowerCase().includes(query)
      const matchStatus = String(h.status).includes(query)
      return matchUrl || matchMethod || matchStatus
    })
  }, [history, searchQuery])

  const sortedHistory = useMemo(() => {
    const starred = filteredHistory.filter((h) => h.starred)
    const unstarred = filteredHistory.filter((h) => !h.starred)
    return [...starred, ...unstarred]
  }, [filteredHistory])

  const grouped = useMemo(() => groupHistory(sortedHistory), [sortedHistory])

  const handleLoad = useCallback((entry: HistoryEntry) => {
    if (!entry.requestData) return
    setActiveRequest({ ...entry.requestData })
    setView('request')
    setResponse(null)
  }, [setActiveRequest, setView, setResponse])

  const handleResend = useCallback(async (entry: HistoryEntry) => {
    if (!entry.requestData) return
    setActiveRequest({ ...entry.requestData })
    setView('request')
    setResponse(null)
    try {
      const { sendRequest: sendReq } = await import('@/utils/request')
      const result = await sendReq(entry.requestData, activeEnv)
      useRequestStore.getState().setResponse(result.response)
      useAppStore.getState().addHistory({
        id: crypto.randomUUID(),
        method: entry.requestData.method,
        url: entry.requestData.url,
        status: result.response.status,
        duration: result.response.duration,
        timestamp: new Date().toISOString(),
        requestData: entry.requestData,
        responseSize: result.response.size,
      })
    } catch (error) {
      toast('error', `Resend failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [setActiveRequest, setView, setResponse, activeEnv])

  const handleExport = useCallback(() => {
    const data = {
      history,
      exportedAt: new Date().toISOString(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-studio-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [history])

  const hasHistory = sortedHistory.length > 0

  return (
    <div className="history-panel">
      <div className="history-toolbar">
        <div className="history-search">
          <Search size={12} className="search-icon" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="history-toolbar-actions">
          <Tooltip content="Export History">
            <button className="icon-btn" onClick={handleExport}>
              <Download size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Clear History">
            <button className="icon-btn" onClick={clearHistory}>
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="history-list">
        {!hasHistory && (
          <div className="history-empty">
            <History size={24} />
            <span>{searchQuery ? 'No matching history' : 'No history yet'}</span>
          </div>
        )}

        {grouped.today.length > 0 && (
          <div className="history-group">
            <div className="history-group-title">Today</div>
            {grouped.today.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onLoad={handleLoad}
                onResend={handleResend}
                onToggleStar={toggleStarHistory}
                onDelete={deleteHistoryEntry}
              />
            ))}
          </div>
        )}

        {grouped.yesterday.length > 0 && (
          <div className="history-group">
            <div className="history-group-title">Yesterday</div>
            {grouped.yesterday.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onLoad={handleLoad}
                onResend={handleResend}
                onToggleStar={toggleStarHistory}
                onDelete={deleteHistoryEntry}
              />
            ))}
          </div>
        )}

        {grouped.earlier.length > 0 && (
          <div className="history-group">
            <div className="history-group-title">Earlier</div>
            {grouped.earlier.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onLoad={handleLoad}
                onResend={handleResend}
                onToggleStar={toggleStarHistory}
                onDelete={deleteHistoryEntry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
