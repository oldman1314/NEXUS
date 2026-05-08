import { memo, useState, useCallback, useRef } from 'react'
import { Code2, Terminal, Cookie, FileCheck, Copy, CheckCircle2, XCircle, X, Timer, Check, Minimize2, Maximize2 } from 'lucide-react'
import ResponseBody from './response/ResponseBody'
import Tooltip from '@/components/common/Tooltip'
import { toast } from '@/stores/useToastStore'
import type { ResponseData, TestResult } from '@/types'
import './request-view.css'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ResponsePanelProps {
  response: ResponseData
  responseTab: 'body' | 'headers' | 'cookies' | 'tests'
  onResponseTabChange: (tab: 'body' | 'headers' | 'cookies' | 'tests') => void
  onCopyResponse: () => void
}

const ResponsePanel = memo(({
  response,
  responseTab,
  onResponseTabChange,
  onCopyResponse,
}: ResponsePanelProps) => {
  const [bodyFormat, setBodyFormat] = useState<'pretty' | 'raw'>('pretty')
  const [copiedMain, setCopiedMain] = useState(false)
  const [copiedRaw, setCopiedRaw] = useState(false)
  const copyMainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyRawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopyRawBody = useCallback(async () => {
    const text = typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      toast('error', 'Failed to copy to clipboard')
    }
  }, [response.body])

  const handleCopyMainWithFeedback = useCallback(async (copyFn: () => void) => {
    copyFn()
    setCopiedMain(true)
    if (copyMainTimerRef.current) clearTimeout(copyMainTimerRef.current)
    copyMainTimerRef.current = setTimeout(() => setCopiedMain(false), 1500)
  }, [])

  const handleCopyRawWithFeedback = useCallback(async (copyFn: () => void) => {
    copyFn()
    setCopiedRaw(true)
    if (copyRawTimerRef.current) clearTimeout(copyRawTimerRef.current)
    copyRawTimerRef.current = setTimeout(() => setCopiedRaw(false), 1500)
  }, [])

  return (
    <div className="response-panel">
      <div className="response-header">
        <nav className="response-tabs" role="tablist">
          {(
            [
              { key: 'body', label: 'Body', icon: <Code2 size={12} /> },
              { key: 'headers', label: 'Headers', icon: <Terminal size={12} /> },
              { key: 'cookies', label: 'Cookies', icon: <Cookie size={12} /> },
              { key: 'tests', label: 'Test Results', icon: <FileCheck size={12} /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={responseTab === tab.key}
              className={`response-tab ${responseTab === tab.key ? 'active' : ''}`}
              onClick={() => onResponseTabChange(tab.key)}
              onKeyDown={(e) => {
                const TAB_ORDER = ['body', 'headers', 'cookies', 'tests'] as const
                const tabIndex = TAB_ORDER.indexOf(tab.key)
                if (e.key === 'ArrowRight') {
                  e.preventDefault()
                  const next = (tabIndex + 1) % 4
                  onResponseTabChange(TAB_ORDER[next])
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault()
                  const prev = (tabIndex - 1 + 4) % 4
                  onResponseTabChange(TAB_ORDER[prev])
                } else if (e.key === 'Home') {
                  e.preventDefault()
                  onResponseTabChange(TAB_ORDER[0])
                } else if (e.key === 'End') {
                  e.preventDefault()
                  onResponseTabChange(TAB_ORDER[3])
                }
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.key === 'headers' && (
                <span className="tab-badge badge-count">{Object.keys(response.headers).length}</span>
              )}
              {tab.key === 'tests' && response.testResults && (() => {
                const passed = response.testResults.filter((t: TestResult) => t.passed).length
                const total = response.testResults.length
                const allPassed = response.testResults.every((t: TestResult) => t.passed)
                return (
                  <span className={`tab-badge badge-status ${allPassed ? 'success' : 'error'}`} title={`${passed}/${total} tests passed`}>
                    {allPassed ? (
                      <span className="badge-status-content">
                        <Check size={10} />
                        <span>{total}</span>
                      </span>
                    ) : (
                      <span className="badge-status-content">
                        <X size={10} />
                        <span>{total - passed}/{total}</span>
                      </span>
                    )}
                  </span>
                )
              })()}
            </button>
          ))}
        </nav>
        <div className="response-meta">
          <span
            className={`response-status ${response.ok ? 'success' : response.status >= 400 ? 'error' : response.status >= 300 ? 'warning' : response.errorType === 'abort' ? 'warning' : 'error'
              }`}
          >
            {response.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            <span className="response-status-code">{response.status}</span>
          </span>
          <div className="response-meta-separator" />
          <span className={`response-time ${response.duration < 100 ? 'fast' : response.duration < 500 ? 'normal' : response.duration < 1000 ? 'slow' : 'very-slow'}`} title={`${response.duration}ms`}>
            <Timer size={10} />
            {response.duration}ms
          </span>
          <div className="response-meta-separator" />
          <span className="response-size" title={`${response.size} bytes`}>
            {formatBytes(response.size)}
          </span>
        </div>
      </div>
      <div className="response-toolbar">
        <div className={`format-toggle-group ${typeof response.body !== 'object' ? 'disabled' : ''}`} role="group" aria-label="Body format">
          <button
            className={`format-toggle-btn ${bodyFormat === 'pretty' ? 'active' : ''}`}
            onClick={() => setBodyFormat('pretty')}
            aria-pressed={bodyFormat === 'pretty'}
            title="Formatted view"
          >
            <Maximize2 size={12} />
            Pretty
          </button>
          <button
            className={`format-toggle-btn ${bodyFormat === 'raw' ? 'active' : ''}`}
            onClick={() => setBodyFormat('raw')}
            aria-pressed={bodyFormat === 'raw'}
            title="Raw view"
          >
            <Minimize2 size={12} />
            Raw
          </button>
        </div>
        <div className="response-actions" role="group" aria-label="Response actions">
          <Tooltip content={copiedMain ? "Copied!" : "Copy to clipboard"}>
            <button
              className={`action-btn ${copiedMain ? 'copied' : ''}`}
              onClick={() => handleCopyMainWithFeedback(onCopyResponse)}
              aria-label={copiedMain ? "Copied to clipboard" : "Copy to clipboard"}
            >
              {copiedMain ? <Check size={13} /> : <Copy size={13} />}
              <span className="action-label">{copiedMain ? 'Copied' : 'Copy'}</span>
            </button>
          </Tooltip>
          {responseTab === 'body' && bodyFormat === 'raw' && (
            <Tooltip content={copiedRaw ? "Copied!" : "Copy raw body"}>
              <button
                className={`action-btn ${copiedRaw ? 'copied' : ''}`}
                onClick={() => handleCopyRawWithFeedback(handleCopyRawBody)}
                aria-label={copiedRaw ? "Copied raw body" : "Copy raw body"}
              >
                {copiedRaw ? <Check size={13} /> : <Copy size={13} />}
                <span className="action-label">{copiedRaw ? 'Copied' : 'Copy Raw'}</span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      <ResponseBody
        response={response}
        responseTab={responseTab}
        bodyFormat={bodyFormat}
      />
    </div>
  )
})

ResponsePanel.displayName = 'ResponsePanel'

export default ResponsePanel
