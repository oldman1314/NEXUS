import { useMemo } from 'react'
import { Plus, ClipboardPaste, Clock } from 'lucide-react'
import { useRequestStore } from '@/stores/useRequestStore'
import { useAppStore } from '@/stores/useAppStore'
import './welcome-page.css'

export default function WelcomePage() {
  const openTab = useRequestStore((s) => s.openTab)
  const history = useAppStore((s) => s.history)
  const recentHistory = useMemo(() => history.slice(0, 5), [history])
  const collections = useAppStore((s) => s.collections)
  const addCollection = useAppStore((s) => s.addCollection)
  const addRequestToCollection = useAppStore((s) => s.addRequestToCollection)

  const handleNewRequest = () => {
    const newId = crypto.randomUUID()
    const newRequest = {
      id: newId,
      name: 'New Request',
      method: 'GET' as const,
      url: '',
      params: [] as never[],
      headers: [] as never[],
      bodyType: 'none' as const,
      bodyRaw: '',
      formData: [] as never[],
      urlEncodedData: [] as never[],
      authType: 'none' as const,
      authConfig: {},
      preRequestScript: '',
      testScript: '',
      savedResponses: [] as never[],
    }
    const scratchpadId = collections.find((c) => c.name === 'Scratchpad')?.id
      || addCollection('Scratchpad')
    addRequestToCollection(scratchpadId, newRequest)
    openTab(newRequest, scratchpadId)
  }

  const handleOpenRecent = (entry: (typeof recentHistory)[number]) => {
    if (entry.requestData) {
      openTab(entry.requestData, null)
    }
  }

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <div className="welcome-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="welcome-title">Welcome to API Client</h1>
        <p className="welcome-desc">
          Create a new request, import a cURL command, or jump back into something recent.
        </p>

        <div className="welcome-actions">
          <button className="welcome-btn welcome-btn-primary" onClick={handleNewRequest}>
            <Plus size={16} />
            New Request
          </button>
          <button
            className="welcome-btn welcome-btn-ghost"
            onClick={() => {
              const curlImportEvent = new CustomEvent('open-curl-import')
              window.dispatchEvent(curlImportEvent)
            }}
          >
            <ClipboardPaste size={16} />
            Import cURL
          </button>
        </div>

        <div className="welcome-shortcuts">
          <kbd>Ctrl+N</kbd> New Request
          <span className="welcome-shortcut-divider" />
          <kbd>Ctrl+W</kbd> Close Tab
        </div>

        {recentHistory.length > 0 && (
          <div className="welcome-recent">
            <div className="welcome-recent-header">
              <Clock size={12} />
              Recent Requests
            </div>
            {recentHistory
              .filter((h) => h.requestData)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="welcome-recent-item"
                  onClick={() => handleOpenRecent(entry)}
                >
                  <span className="recent-method-badge">{entry.method}</span>
                  <span className="recent-url-text">{entry.url || '/'}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
