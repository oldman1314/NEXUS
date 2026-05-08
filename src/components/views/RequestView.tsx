import { useState, useEffect, useRef, useCallback } from 'react'
import { Sliders, List, FileText, Lock, Play, CheckSquare } from 'lucide-react'
import { useRequestStore } from '@/stores/useRequestStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from '@/stores/useToastStore'
import Tooltip from '@/components/common/Tooltip'
import { parseCurl } from '@/utils/curl'
import ResponsePanel from './ResponsePanel'
import TabBar from './TabBar'
import WelcomePage from './WelcomePage'
import ParamsTab from '@/components/tabs/ParamsTab'
import HeadersTab from '@/components/tabs/HeadersTab'
import BodyTab from '@/components/tabs/BodyTab'
import AuthTab from '@/components/tabs/AuthTab'
import PreScriptTab from '@/components/tabs/PreScriptTab'
import TestsTab from '@/components/tabs/TestsTab'
import type { RequestData, HttpMethod } from '@/types'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useRequestSender } from '@/hooks/useRequestSender'
import UrlBar from './request/UrlBar'
import RequestToolbar from './request/RequestToolbar'
import ResponsePlaceholder from './request/ResponsePlaceholder'
import './request-view.css'

type TabKey = 'params' | 'headers' | 'body' | 'auth' | 'preScript' | 'tests'

const MAIN_TABS: { key: Exclude<TabKey, 'preScript' | 'tests'>; label: string; icon: React.ReactNode }[] = [
  { key: 'params', label: 'Params', icon: <Sliders size={12} /> },
  { key: 'headers', label: 'Headers', icon: <List size={12} /> },
  { key: 'body', label: 'Body', icon: <FileText size={12} /> },
  { key: 'auth', label: 'Auth', icon: <Lock size={12} /> },
]

const SCRIPT_TABS: { key: 'preScript' | 'tests'; label: string; icon: React.ReactNode }[] = [
  { key: 'preScript', label: 'Pre-req', icon: <Play size={12} /> },
  { key: 'tests', label: 'Tests', icon: <CheckSquare size={12} /> },
]

export default function RequestView() {
  const request = useRequestStore((state) => state.activeRequest)
  const updateActiveRequest = useRequestStore((state) => state.updateActiveRequest)
  const setActiveRequest = useRequestStore((state) => state.setActiveRequest)
  const response = useRequestStore((state) => state.response)
  const activeCollectionId = useRequestStore((state) => state.activeCollectionId)
  const isDirty = useRequestStore((state) => state.isDirty)
  const markClean = useRequestStore((state) => state.markClean)
  const setCodeGenOpen = useUIStore((state) => state.setCodeGenOpen)

  const activeEnv = useAppStore((s) => {
    const envId = s.activeEnvId
    return s.environments.find((e) => e.id === envId) || null
  })
  const updateRequestInCollection = useAppStore((s) => s.updateRequestInCollection)

  const requestStatus = useAnimationStore((s) => s.requestStatus)
  const urlFlash = useAnimationStore((s) => s.urlFlash)

  const { handleSend, handleCancel } = useRequestSender()

  const [activeMainTab, setActiveMainTab] = useState<Exclude<TabKey, 'preScript' | 'tests'>>('params')
  const [activeScriptTab, setActiveScriptTab] = useState<'preScript' | 'tests'>('preScript')
  const [responseTab, setResponseTab] = useState<'body' | 'headers' | 'cookies' | 'tests'>('body')
  const [showTemplates, setShowTemplates] = useState(false)
  const [displayRequest, setDisplayRequest] = useState(request)
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const scriptTabContainerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [scriptIndicatorStyle, setScriptIndicatorStyle] = useState({ left: 0, width: 0 })

  const updateIndicators = useCallback(() => {
    if (tabContainerRef.current) {
      const activeTabEl = tabContainerRef.current.querySelector('.panel-tab.active') as HTMLElement
      if (activeTabEl) {
        setIndicatorStyle({
          left: activeTabEl.offsetLeft,
          width: activeTabEl.offsetWidth,
        })
      }
    }
    if (scriptTabContainerRef.current) {
      const activeTabEl = scriptTabContainerRef.current.querySelector('.panel-tab.active') as HTMLElement
      if (activeTabEl) {
        setScriptIndicatorStyle({
          left: activeTabEl.offsetLeft,
          width: activeTabEl.offsetWidth,
        })
      }
    }
  }, [])

  useEffect(() => {
    updateIndicators()
  }, [activeMainTab, activeScriptTab, updateIndicators])

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(updateIndicators)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateIndicators])

  useEffect(() => {
    if (!request) return
    setDisplayRequest(request)
  }, [request])

  const [curlImportOpen, setCurlImportOpen] = useState(false)
  const [curlInput, setCurlInput] = useState('')
  const [splitRatio, setSplitRatio] = useState(() => {
    const saved = localStorage.getItem('request-split-ratio')
    return saved ? parseFloat(saved) : 0.5
  })
  const [isDragging, setIsDragging] = useState(false)
  const [hSplitRatio, setHSplitRatio] = useState(() => {
    const saved = localStorage.getItem('request-h-split-ratio')
    return saved ? parseFloat(saved) : 0.4
  })
  const [isHDragging, setIsHDragging] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    let rafId: number
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (!bodyRef.current) return
        const rect = bodyRef.current.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        const clamped = Math.min(0.8, Math.max(0.2, ratio))
        setSplitRatio(clamped)
      })
    }
    const handleMouseUp = () => {
      setIsDragging(false)
      cancelAnimationFrame(rafId)
      localStorage.setItem('request-split-ratio', String(splitRatio))
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      cancelAnimationFrame(rafId)
    }
  }, [isDragging, splitRatio])

  const handleDoubleClick = useCallback(() => {
    setSplitRatio(0.5)
    localStorage.setItem('request-split-ratio', '0.5')
  }, [])

  const handleHMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsHDragging(true)
  }, [])

  useEffect(() => {
    if (!isHDragging) return
    let rafId: number
    const requestPanel = document.querySelector('.request-panel') as HTMLElement | null
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (!requestPanel) return
        const rect = requestPanel.getBoundingClientRect()
        const ratio = (e.clientY - rect.top) / rect.height
        const clamped = Math.min(0.7, Math.max(0.15, ratio))
        setHSplitRatio(clamped)
      })
    }
    const handleMouseUp = () => {
      setIsHDragging(false)
      cancelAnimationFrame(rafId)
      localStorage.setItem('request-h-split-ratio', String(hSplitRatio))
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      cancelAnimationFrame(rafId)
    }
  }, [isHDragging, hSplitRatio])

  useEffect(() => {
    if (!showTemplates && !curlImportOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.templates-dropdown') && !target.closest('.curl-import-dropdown')) {
        setShowTemplates(false)
        setCurlImportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTemplates, curlImportOpen])

  const handleCopyResponse = useCallback(async () => {
    const currentResponse = useRequestStore.getState().response
    if (!currentResponse) return
    let text = ''
    if (responseTab === 'body') {
      text = typeof currentResponse.body === 'object' ? JSON.stringify(currentResponse.body, null, 2) : String(currentResponse.body)
    } else if (responseTab === 'headers') {
      text = Object.entries(currentResponse.headers).map(([k, v]) => `${k}: ${v}`).join('\n')
    } else {
      text = typeof currentResponse.body === 'object' ? JSON.stringify(currentResponse.body, null, 2) : String(currentResponse.body)
    }
    await navigator.clipboard.writeText(text)
    toast('success', `${responseTab === 'body' ? 'Response body' : responseTab === 'headers' ? 'Headers' : 'Response'} copied`)
  }, [responseTab])

  const handleLoadTemplate = useCallback((templateRequest: Partial<RequestData>) => {
    const currentRequest = useRequestStore.getState().activeRequest
    if (!currentRequest) return
    const newRequest: RequestData = {
      ...currentRequest,
      ...templateRequest,
      id: currentRequest.id,
      name: templateRequest.name || currentRequest.name,
      headers: templateRequest.headers ? [...templateRequest.headers] : currentRequest.headers,
      params: templateRequest.params ? [...templateRequest.params] : currentRequest.params,
      formData: templateRequest.formData ? [...templateRequest.formData] : currentRequest.formData,
      authConfig: templateRequest.authConfig ? { ...templateRequest.authConfig } : currentRequest.authConfig,
    }
    setActiveRequest(newRequest)
    setShowTemplates(false)
  }, [setActiveRequest])

  const handleCurlImport = useCallback(() => {
    const currentRequest = useRequestStore.getState().activeRequest
    if (!currentRequest || !curlInput.trim()) return
    const parsed = parseCurl(curlInput)
    if (parsed) {
      const { _skippedOptions, ...rest } = parsed as Record<string, unknown>
      setActiveRequest({ ...currentRequest, ...rest, id: currentRequest.id })
      setCurlImportOpen(false)
      setCurlInput('')
      if (_skippedOptions && Array.isArray(_skippedOptions) && _skippedOptions.length > 0) {
        toast('warning', `cURL imported, but these options were ignored: ${(_skippedOptions as string[]).join(', ')}`)
      } else {
        toast('success', 'cURL imported successfully')
      }
    } else {
      toast('error', 'Failed to parse cURL command. Please check the format.')
    }
  }, [curlInput, setActiveRequest])

  const handleUrlChange = useCallback((newUrl: string) => {
    const currentRequest = useRequestStore.getState().activeRequest
    if (!currentRequest) return
    let urlForParsing = newUrl
    const hashIdx = urlForParsing.indexOf('#')
    if (hashIdx >= 0) {
      urlForParsing = urlForParsing.substring(0, hashIdx)
    }
    const questionIdx = urlForParsing.indexOf('?')
    if (questionIdx >= 0) {
      const queryString = urlForParsing.substring(questionIdx + 1)
      const searchParams = new URLSearchParams(queryString)
      const newParams = Array.from(searchParams.entries()).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      }))
      const hasChanges = newParams.length !== currentRequest.params.length ||
        newParams.some((p, i) => p.key !== currentRequest.params[i]?.key || p.value !== currentRequest.params[i]?.value)
      if (hasChanges) {
        const preservedParams = currentRequest.params.filter((p) => !newParams.find((np) => np.key === p.key))
        updateActiveRequest({
          url: newUrl,
          params: [...newParams, ...preservedParams],
        })
        return
      }
    }
    updateActiveRequest({ url: newUrl })
  }, [updateActiveRequest])

  const handleSaveRequest = useCallback(() => {
    const req = useRequestStore.getState().activeRequest
    const collId = useRequestStore.getState().activeCollectionId
    if (!req || !collId) return
    updateRequestInCollection(collId, req.id, req)
    markClean()
    toast('success', 'Request saved!')
  }, [updateRequestInCollection, markClean])

  if (!request || !displayRequest) return <WelcomePage />

  const getTabBadge = (key: TabKey) => {
    switch (key) {
      case 'params':
        return displayRequest.params.length > 0 ? <span className="tab-badge">{displayRequest.params.length}</span> : null
      case 'headers':
        return displayRequest.headers.length > 0 ? <span className="tab-badge">{displayRequest.headers.length}</span> : null
      case 'body':
        if (displayRequest.bodyType !== 'none') {
          const label = displayRequest.bodyType === 'x-www-form-urlencoded' ? 'URL' : displayRequest.bodyType === 'form-data' ? 'FORM' : displayRequest.bodyType.toUpperCase()
          return <span className="tab-badge">{label}</span>
        }
        return null
      case 'auth':
        return displayRequest.authType !== 'none' ? <span className="tab-badge dot" /> : null
      case 'preScript':
        return displayRequest.preRequestScript ? <span className="tab-badge dot" /> : null
      case 'tests':
        return displayRequest.testScript ? <span className="tab-badge dot" /> : null
    }
  }

  return (
    <div className="request-view">
      <TabBar />
      <div className="request-toolbar">
        <div className="url-bar">
          <UrlBar
            method={displayRequest.method}
            url={displayRequest.url}
            requestStatus={requestStatus}
            urlFlash={urlFlash}
            isDirty={isDirty}
            baseUrl={activeEnv?.baseUrl}
            baseUrlEnabled={activeEnv?.baseUrlEnabled}
            onMethodChange={(method: HttpMethod) => {
              setDisplayRequest((prev) => prev ? { ...prev, method } : prev)
              updateActiveRequest({ method })
            }}
            onUrlChange={handleUrlChange}
            onSend={handleSend}
            onCancel={handleCancel}
          />
          <RequestToolbar
            isDirty={isDirty}
            activeCollectionId={activeCollectionId}
            showTemplates={showTemplates}
            curlImportOpen={curlImportOpen}
            curlInput={curlInput}
            onCurlInputChange={setCurlInput}
            onSave={handleSaveRequest}
            onToggleTemplates={() => setShowTemplates(!showTemplates)}
            onToggleCurlImport={() => setCurlImportOpen(!curlImportOpen)}
            onLoadTemplate={handleLoadTemplate}
            onCurlImport={handleCurlImport}
            onCodeGen={() => setCodeGenOpen(true)}
          />
        </div>
        <div className={`request-progress-bar ${requestStatus === 'pending' ? 'visible' : ''}`}><div className="request-progress-indeterminate" /></div>
      </div>

      <div className={`request-body ${isDragging ? 'dragging' : ''} ${isHDragging ? 'h-dragging' : ''}`} ref={bodyRef}>
        <div className="request-panel" style={{ width: `${splitRatio * 100}%` }}>
          <div className="script-section" style={{ height: `${hSplitRatio * 100}%` }}>
            <div className="panel-tabs script-tabs" ref={scriptTabContainerRef}>
              {SCRIPT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`panel-tab ${activeScriptTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveScriptTab(tab.key)}
                >
                  {tab.icon}
                  {tab.label}
                  {getTabBadge(tab.key)}
                </button>
              ))}
              <div className="tab-indicator" style={{ left: scriptIndicatorStyle.left, width: scriptIndicatorStyle.width }} />
            </div>
            <div className="panel-content script-content">
              {activeScriptTab === 'preScript' && <PreScriptTab />}
              {activeScriptTab === 'tests' && <TestsTab />}
            </div>
          </div>

          <div
            className="resize-handle-h"
            onMouseDown={handleHMouseDown}
          >
            <div className="resize-handle-line-h" />
          </div>

          <div className="main-tabs-section">
            <div className="panel-tabs" ref={tabContainerRef}>
              {MAIN_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`panel-tab ${activeMainTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveMainTab(tab.key)}
                >
                  {tab.icon}
                  {tab.label}
                  {getTabBadge(tab.key)}
                </button>
              ))}
              <div className="tab-indicator" style={{ left: indicatorStyle.left, width: indicatorStyle.width }} />
            </div>
            <div className="panel-content">
              {activeMainTab === 'params' && <ParamsTab />}
              {activeMainTab === 'headers' && <HeadersTab />}
              {activeMainTab === 'body' && <BodyTab />}
              {activeMainTab === 'auth' && <AuthTab />}
            </div>
          </div>
        </div>

        <Tooltip content="Drag to resize, double-click to reset">
          <div
            className="resize-handle"
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
          >
            <div className="resize-handle-line" />
          </div>
        </Tooltip>

        <div className="response-panel" data-status={response?.status || ''} style={{ width: `${(1 - splitRatio) * 100}%` }}>
          {response ? (
            <ResponsePanel
              response={response}
              responseTab={responseTab}
              onResponseTabChange={setResponseTab}
              onCopyResponse={handleCopyResponse}
            />
          ) : (
            <ResponsePlaceholder />
          )}
        </div>
      </div>

    </div>
  )
}
