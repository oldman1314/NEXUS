import { useState, useEffect } from 'react'
import Tooltip from '@/components/common/Tooltip'
import './window-controls.css'

export default function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!window.electronAPI?.windowIsMaximized) return
    window.electronAPI.windowIsMaximized().then(setIsMaximized)

    const unsubscribe = window.electronAPI.onWindowMaximizedChange?.((maximized) => {
      setIsMaximized(maximized)
    })
    return unsubscribe
  }, [])

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize?.()
  }

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize?.()
  }

  const handleClose = () => {
    window.electronAPI?.windowClose?.()
  }

  return (
    <div className="window-controls">
      <Tooltip content="Minimize" placement="bottom">
        <button className="window-btn minimize" onClick={handleMinimize} aria-label="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="5.5" width="10" height="1.2" rx="0.3" fill="currentColor" />
          </svg>
        </button>
      </Tooltip>
      <Tooltip content={isMaximized ? 'Restore' : 'Maximize'} placement="bottom">
        <button className="window-btn maximize" onClick={handleMaximize} aria-label={isMaximized ? 'Restore' : 'Maximize'}>
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 5v5h5V5H2zm1-4v3h5v5h3V1H3z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
            </svg>
          )}
        </button>
      </Tooltip>
      <Tooltip content="Close" placement="bottom">
        <button className="window-btn close" onClick={handleClose} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </Tooltip>
    </div>
  )
}
