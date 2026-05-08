import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Globe,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Home,
  ExternalLink,
  Lock,
  LockOpen,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  X,
} from 'lucide-react'
import { useRemoteToolsStore } from '@/stores/useRemoteToolsStore'
import Tooltip from '@/components/common/Tooltip'

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function isSecureUrl(url: string): boolean {
  return url.startsWith('https://')
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const LOAD_TIMEOUT_MS = 30000

interface NavEntry {
  url: string
  title: string
}

interface WebBrowserProps {
  sessionId: string
}

export default function WebBrowser({ sessionId }: WebBrowserProps) {
  const session = useRemoteToolsStore((state) => state.browserSessions[sessionId])
  const setBrowserUrl = useRemoteToolsStore((state) => state.setBrowserUrl)
  const setBrowserLoading = useRemoteToolsStore((state) => state.setBrowserLoading)
  const addBrowserHistory = useRemoteToolsStore((state) => state.addBrowserHistory)

  const browserUrl = session?.url ?? ''
  const browserLoading = session?.loading ?? false

  const [inputUrl, setInputUrl] = useState(browserUrl)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [mobileMode, setMobileMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [navStack, setNavStack] = useState<NavEntry[]>([])
  const [navIndex, setNavIndex] = useState(-1)
  const [urlInvalid, setUrlInvalid] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastExternalOpenRef = useRef<number>(0)
  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputUrl(browserUrl)
  }, [browserUrl])

  const canGoBack = navIndex > 0
  const canGoForward = navIndex < navStack.length - 1

  const pushNav = useCallback((url: string) => {
    setNavStack((prev) => {
      const newStack = prev.slice(0, navIndex + 1)
      newStack.push({ url, title: url })
      return newStack
    })
    setNavIndex((prev) => prev + 1)
  }, [navIndex])

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
      loadTimeoutRef.current = null
    }
  }, [])

  const handleNavigate = useCallback(() => {
    const url = normalizeUrl(inputUrl)
    if (!url) return
    if (!isValidUrl(url)) {
      setError('Invalid URL format')
      setUrlInvalid(true)
      return
    }
    setError(null)
    setUrlInvalid(false)
    setBrowserLoading(sessionId, true)
    setBrowserUrl(sessionId, url)
    addBrowserHistory(sessionId, url)
    pushNav(url)
    urlInputRef.current?.blur()

    clearLoadTimeout()
    loadTimeoutRef.current = setTimeout(() => {
      setBrowserLoading(sessionId, false)
      setError('Page load timed out. The server may be unresponsive.')
    }, LOAD_TIMEOUT_MS)
  }, [inputUrl, sessionId, setBrowserUrl, setBrowserLoading, addBrowserHistory, pushNav, clearLoadTimeout])

  const handleUrlFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }, [])

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputUrl(value)
    if (value.trim()) {
      const normalized = normalizeUrl(value)
      setUrlInvalid(!isValidUrl(normalized))
    } else {
      setUrlInvalid(false)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleNavigate()
      }
    },
    [handleNavigate]
  )

  const handleGoBack = useCallback(() => {
    if (!canGoBack) return
    const newIndex = navIndex - 1
    const entry = navStack[newIndex]
    setNavIndex(newIndex)
    setError(null)
    setBrowserLoading(sessionId, true)
    setBrowserUrl(sessionId, entry.url)
    setInputUrl(entry.url)
  }, [canGoBack, navIndex, navStack, sessionId, setBrowserUrl, setBrowserLoading])

  const handleGoForward = useCallback(() => {
    if (!canGoForward) return
    const newIndex = navIndex + 1
    const entry = navStack[newIndex]
    setNavIndex(newIndex)
    setError(null)
    setBrowserLoading(sessionId, true)
    setBrowserUrl(sessionId, entry.url)
    setInputUrl(entry.url)
  }, [canGoForward, navIndex, navStack, sessionId, setBrowserUrl, setBrowserLoading])

  const handleRefresh = useCallback(() => {
    if (iframeRef.current && browserUrl) {
      clearLoadTimeout()
      setBrowserLoading(sessionId, true)
      iframeRef.current.src = browserUrl
      loadTimeoutRef.current = setTimeout(() => {
        setBrowserLoading(sessionId, false)
        setError('Page load timed out.')
      }, LOAD_TIMEOUT_MS)
    }
  }, [browserUrl, sessionId, setBrowserLoading, clearLoadTimeout])

  const handleIframeLoad = useCallback(() => {
    clearLoadTimeout()
    setBrowserLoading(sessionId, false)
  }, [sessionId, setBrowserLoading, clearLoadTimeout])

  const handleIframeError = useCallback(() => {
    clearLoadTimeout()
    setBrowserLoading(sessionId, false)
    setError('Failed to load the page. The website may block iframe embedding.')
  }, [sessionId, setBrowserLoading, clearLoadTimeout])

  const handleGoHome = useCallback(() => {
    clearLoadTimeout()
    setInputUrl('')
    setBrowserUrl(sessionId, '')
    setError(null)
    setUrlInvalid(false)
    setNavStack([])
    setNavIndex(-1)
  }, [sessionId, setBrowserUrl, clearLoadTimeout])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const nextIndex = ZOOM_LEVELS.findIndex((z) => z > prev)
      return nextIndex === -1 ? ZOOM_LEVELS[ZOOM_LEVELS.length - 1] : ZOOM_LEVELS[nextIndex]
    })
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const prevIndex = ZOOM_LEVELS.findIndex((z) => z >= prev)
      if (prevIndex <= 0) return ZOOM_LEVELS[0]
      return ZOOM_LEVELS[prevIndex - 1]
    })
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoom(1)
  }, [])

  const toggleMobileMode = useCallback(() => {
    setMobileMode((prev) => !prev)
    if (iframeRef.current && browserUrl) {
      setBrowserLoading(sessionId, true)
      iframeRef.current.src = browserUrl
    }
  }, [browserUrl, sessionId, setBrowserLoading])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const handleOpenExternal = useCallback(() => {
    if (!browserUrl) return
    const now = Date.now()
    if (now - lastExternalOpenRef.current < 2000) return
    lastExternalOpenRef.current = now
    if (window.confirm(`Open "${browserUrl}" in external browser?`)) {
      window.open(browserUrl, '_blank')
    }
  }, [browserUrl])

  useEffect(() => {
    return () => {
      clearLoadTimeout()
    }
  }, [clearLoadTimeout])

  const iframeSrc = browserUrl || ''
  const currentUrlSecure = browserUrl ? isSecureUrl(browserUrl) : false

  const SecurityIcon = currentUrlSecure ? Lock : LockOpen
  const securityIconClass = currentUrlSecure
    ? 'web-browser-url-icon-secure'
    : 'web-browser-url-icon-insecure'

  const browserContent = (
    <>
      <div className="web-browser-toolbar">
        <div className="web-browser-nav-actions">
          <Tooltip content="Back">
            <button className="web-browser-btn" onClick={handleGoBack} disabled={!canGoBack}>
              <ArrowLeft size={13} />
            </button>
          </Tooltip>
          <Tooltip content="Forward">
            <button className="web-browser-btn" onClick={handleGoForward} disabled={!canGoForward}>
              <ArrowRight size={13} />
            </button>
          </Tooltip>
          <Tooltip content="Refresh">
            <button className="web-browser-btn" onClick={handleRefresh} disabled={!browserUrl}>
              <RotateCw size={13} className={browserLoading ? 'spin' : ''} />
            </button>
          </Tooltip>
          <Tooltip content="Home">
            <button className="web-browser-btn" onClick={handleGoHome}>
              <Home size={13} />
            </button>
          </Tooltip>
        </div>
        <div className={`web-browser-url-bar ${urlInvalid ? 'web-browser-url-bar-invalid' : ''}`}>
          <SecurityIcon size={12} className={`web-browser-url-icon ${securityIconClass}`} />
          <input
            ref={urlInputRef}
            type="text"
            className="web-browser-url-input"
            placeholder="Enter URL (e.g., example.com)"
            value={inputUrl}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
            onFocus={handleUrlFocus}
          />
          <button
            className="web-browser-go-btn"
            onClick={handleNavigate}
            disabled={!inputUrl.trim()}
          >
            <Globe size={12} />
          </button>
        </div>
        <div className="web-browser-zoom-actions">
          <Tooltip content="Zoom Out">
            <button className="web-browser-btn" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOut size={13} />
            </button>
          </Tooltip>
          <button className="web-browser-zoom-label" onClick={handleResetZoom}>
            {Math.round(zoom * 100)}%
          </button>
          <Tooltip content="Zoom In">
            <button className="web-browser-btn" onClick={handleZoomIn} disabled={zoom >= 2}>
              <ZoomIn size={13} />
            </button>
          </Tooltip>
          <Tooltip content={mobileMode ? 'Desktop Mode' : 'Mobile Mode'}>
            <button
              className={`web-browser-btn ${mobileMode ? 'active' : ''}`}
              onClick={toggleMobileMode}
            >
              {mobileMode ? <Monitor size={13} /> : <Smartphone size={13} />}
            </button>
          </Tooltip>
          <Tooltip content={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <button className="web-browser-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </Tooltip>
        </div>
        <Tooltip content="Open in External Browser">
          <button
            className="web-browser-btn"
            onClick={handleOpenExternal}
            disabled={!browserUrl}
          >
            <ExternalLink size={13} />
          </button>
        </Tooltip>
      </div>

      {browserLoading && (
        <div className="web-browser-loading-bar">
          <div className="web-browser-loading-indicator" />
        </div>
      )}

      <div className="web-browser-content" ref={containerRef}>
        {error ? (
          <div className="web-browser-error">
            <AlertCircle size={40} className="web-browser-error-icon" />
            <p className="web-browser-error-title">Unable to Load Page</p>
            <p className="web-browser-error-message">{error}</p>
            <button className="web-browser-error-btn" onClick={handleGoHome}>
              Go Home
            </button>
          </div>
        ) : browserUrl ? (
          <div
            className="web-browser-iframe-wrapper"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
            }}
          >
            <iframe
              ref={iframeRef}
              className="web-browser-iframe"
              src={iframeSrc}
              sandbox="allow-scripts allow-forms allow-popups"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Web Browser"
              style={{
                width: mobileMode ? '375px' : '100%',
                maxWidth: '100%',
              }}
            />
          </div>
        ) : (
          <div className="web-browser-empty">
            <Globe size={48} className="web-browser-empty-icon" />
            <p className="web-browser-empty-title">Web Browser</p>
            <p className="web-browser-empty-hint">
              Enter a URL above to start browsing
            </p>
          </div>
        )}
      </div>
    </>
  )

  if (isFullscreen) {
    return (
      <div className="web-browser-fullscreen-overlay">
        <div className="web-browser-fullscreen-content">
          <button className="web-browser-fullscreen-close" onClick={() => setIsFullscreen(false)}>
            <X size={16} />
          </button>
          {browserContent}
        </div>
      </div>
    )
  }

  return (
    <div className="web-browser">
      {browserContent}
    </div>
  )
}
