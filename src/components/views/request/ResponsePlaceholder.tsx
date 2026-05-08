import { memo } from 'react'

const ResponsePlaceholder = memo(() => {
  return (
    <div className="empty-response">
      <svg className="empty-response-illustration" width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path d="M8 28L56 8L36 56L28 36L8 28Z" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.3" />
        <path d="M8 28L56 8L28 36" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" fill="none" className="paper-plane-path" />
        <circle className="signal-ripple signal-ripple-1" cx="32" cy="32" r="8" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0" />
        <circle className="signal-ripple signal-ripple-2" cx="32" cy="32" r="16" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0" />
        <circle className="signal-ripple signal-ripple-3" cx="32" cy="32" r="24" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0" />
      </svg>
      <p className="empty-response-title">Send a request to see the response</p>
      <p className="empty-response-hint">Enter a URL above and click Send</p>
      <kbd className="empty-response-shortcut">Ctrl + Enter</kbd>
    </div>
  )
})

ResponsePlaceholder.displayName = 'ResponsePlaceholder'

export default ResponsePlaceholder
