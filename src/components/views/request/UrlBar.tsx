import { memo } from 'react'
import { Send, OctagonX } from 'lucide-react'
import { METHOD_COLORS } from '@/constants/http'
import type { HttpMethod } from '@/types'
import MethodSelect from '../MethodSelect'

interface UrlBarProps {
  method: HttpMethod
  url: string
  requestStatus: string
  urlFlash: string
  isDirty: boolean
  baseUrl: string | undefined
  baseUrlEnabled: boolean | undefined
  onMethodChange: (method: HttpMethod) => void
  onUrlChange: (url: string) => void
  onSend: () => void
  onCancel: () => void
}

const UrlBar = memo(({
  method, url, requestStatus, urlFlash, isDirty,
  baseUrl, baseUrlEnabled,
  onMethodChange, onUrlChange, onSend, onCancel,
}: UrlBarProps) => {
  return (
    <div className={`url-bar-signal ${requestStatus !== 'pending' && urlFlash !== 'success' && urlFlash !== 'error' ? 'url-bar-signal--idle' : ''} ${urlFlash === 'success' ? 'url-flash-success' : urlFlash === 'error' ? 'url-flash-error' : ''}`}>
      <div className="method-color-band" style={{ background: METHOD_COLORS[method].color }} />
      {requestStatus === 'pending' && <div className="launch-sweep" />}
      {urlFlash === 'success' && <div className="complete-sweep" />}
      {urlFlash === 'error' && <div className="error-sweep" />}
      <MethodSelect
        value={method}
        onChange={onMethodChange}
      />
      <span
        className={`request-dirty-dot ${isDirty ? 'dirty' : 'clean'}`}
        title={isDirty ? 'Unsaved changes' : 'Saved'}
      />
      {baseUrl && baseUrlEnabled !== false && url && !/^https?:\/\//i.test(url) && !/\{\{\s*base_url\s*\}\}/i.test(url) && (
        <span className="url-base-prefix">{baseUrl.replace(/\/$/, '')}</span>
      )}
      <input
        className="url-input"
        type="text"
        placeholder="Enter request URL"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
      />
      {requestStatus === 'pending' ? (
        <button className="cancel-btn" onClick={onCancel} title="Cancel request">
          <OctagonX size={14} />
        </button>
      ) : (
        <button className="send-btn" onClick={onSend} title="Send request">
          <Send size={14} />
        </button>
      )}
    </div>
  )
})

UrlBar.displayName = 'UrlBar'

export default UrlBar
