import { X } from 'lucide-react'
import { useRequestStore } from '@/stores/useRequestStore'
import { METHOD_COLORS } from '@/constants/http'
import './tab-bar.css'

export default function TabBar() {
  const tabs = useRequestStore((s) => s.tabs)
  const activeTabId = useRequestStore((s) => s.activeTabId)
  const switchTab = useRequestStore((s) => s.switchTab)
  const closeTab = useRequestStore((s) => s.closeTab)

  if (tabs.length === 0) return null

  return (
    <div className="request-tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`request-tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => switchTab(tab.id)}
        >
          <span
            className="request-tab-method"
            style={{ color: METHOD_COLORS[tab.request.method]?.color || 'var(--text-primary)' }}
          >
            {tab.request.method}
          </span>
          <span className="request-tab-name">
            {tab.request.name || 'Untitled'}
          </span>
          {tab.isDirty && <span className="request-tab-dirty" />}
          <button
            className="request-tab-close"
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function useTabCount() {
  return useRequestStore((s) => s.tabs.length)
}
