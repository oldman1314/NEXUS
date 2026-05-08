import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useRequestStore } from '@/stores/useRequestStore'
import { useUIStore } from '@/stores/useUIStore'
import { METHOD_COLORS } from '@/constants/http'
import './sidebar-recent.css'

export default function SidebarRecent() {
  const history = useAppStore((s) => s.history)
  const openTab = useRequestStore((s) => s.openTab)
  const setView = useUIStore((s) => s.setView)

  const recentRequests = useMemo(() => {
    const seen = new Set<string>()
    return history
      .filter((h) => h.requestData)
      .filter((h) => {
        const key = `${h.method}|${h.url}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 5)
  }, [history])

  if (recentRequests.length === 0) return null

  return (
    <div className="sidebar-section sidebar-section-recent">
      <div className="section-header">
        <Clock size={12} />
        <span>Recent</span>
      </div>
      <div className="section-content">
        {recentRequests.map((entry) => (
          <div
            key={entry.id}
            className="recent-item"
            onClick={() => {
              if (entry.requestData) {
                openTab(entry.requestData, null)
                setView('request')
              }
            }}
          >
            <span
              className="recent-method"
              style={{ color: METHOD_COLORS[entry.method]?.color }}
            >
              {entry.method}
            </span>
            <span className="recent-url">{entry.url || '/'}</span>
            <span className={`recent-status ${entry.status >= 200 && entry.status < 300 ? 'status-ok' : entry.status >= 400 ? 'status-error' : ''}`}>
              {entry.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
