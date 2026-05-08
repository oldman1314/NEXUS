import { useState, useCallback, useRef, useEffect } from 'react'
import { Trash2, Play, AlertCircle, Copy, Check, ChevronDown, Code2 } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'
import CodeEditor from '@/components/common/CodeEditor'
import type { Snippet } from '@/constants/script-snippets'
import './script-tab.css'

interface ConsoleLogEntry {
  text: string
  timestamp: string
}

interface ScriptEditorProps {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (value: string) => void
  snippets: Snippet[]
  onTest: () => string[]
  placeholder: string
  isTestScript?: boolean
}

function getTimestamp(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

function getLogClass(text: string): string {
  if (text.startsWith('[ERROR]') || text.startsWith('[SCRIPT ERROR]')) return 'error'
  if (text.startsWith('✓')) return 'success'
  if (text.startsWith('✗')) return 'error'
  return ''
}

export default function ScriptEditor({
  icon,
  label,
  value,
  onChange,
  snippets,
  onTest,
  placeholder,
  isTestScript = false,
}: ScriptEditorProps) {
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [snippetOpen, setSnippetOpen] = useState(false)
  const snippetBtnRef = useRef<HTMLButtonElement>(null)
  const lastValueRef = useRef(value)
  const consoleRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

  useEffect(() => {
    if (!snippetOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.script-snippet-dropdown') && !target.closest('.script-snippet-btn')) {
        setSnippetOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [snippetOpen])

  const insertSnippet = useCallback(
    (code: string) => {
      const separator = value && !value.endsWith('\n') ? '\n' : ''
      onChange(value + separator + code)
    },
    [value, onChange]
  )

  const handleChange = useCallback((newValue: string) => {
    if (newValue !== lastValueRef.current) {
      setConsoleLogs([])
    }
    lastValueRef.current = newValue
    onChange(newValue)
  }, [onChange])

  const handleClear = useCallback(() => {
    onChange('')
    setConsoleLogs([])
  }, [onChange])

  const handleTest = useCallback(() => {
    const logs = onTest()
    const ts = getTimestamp()
    setConsoleLogs(
      logs.length > 0
        ? logs.map((text) => ({ text, timestamp: ts }))
        : [{ text: '✓ Script executed successfully (no output)', timestamp: ts }]
    )
  }, [onTest])

  const handleCopyLog = useCallback(async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }, [])

  const handleConsoleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startYRef.current = e.clientY
    startHeightRef.current = consoleRef.current?.offsetHeight ?? 120
    const onMove = (ev: MouseEvent) => {
      if (!consoleRef.current) return
      const delta = startYRef.current - ev.clientY
      const newHeight = Math.max(60, Math.min(400, startHeightRef.current + delta))
      consoleRef.current.style.height = `${newHeight}px`
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  return (
    <div className="script-editor">
      <div className="script-toolbar">
        {icon}
        <span>{label}</span>
        <div className="script-toolbar-actions">
          <div className="script-snippet-wrapper">
            <button
              ref={snippetBtnRef}
              className={`script-snippet-btn ${snippetOpen ? 'open' : ''}`}
              onClick={() => setSnippetOpen(!snippetOpen)}
              aria-label="选择代码片段"
              type="button"
            >
              <Code2 size={12} />
              Snippets
              <ChevronDown size={10} className={`script-snippet-chevron ${snippetOpen ? 'rotated' : ''}`} />
            </button>
            {snippetOpen && (
              <div className="script-snippet-dropdown">
                {snippets.map((s, i) => (
                  <button
                    key={i}
                    className="script-snippet-item"
                    onClick={() => {
                      insertSnippet(s.code)
                      setSnippetOpen(false)
                    }}
                    type="button"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Tooltip content="Test script execution (Ctrl+Enter)">
            <button className="script-test-btn" onClick={handleTest} aria-label="执行测试脚本">
              <Play size={12} />
              Test
            </button>
          </Tooltip>
          <Tooltip content="Clear script">
            <button className="script-clear-btn" onClick={handleClear} aria-label="清除脚本内容">
              <Trash2 size={12} />
            </button>
          </Tooltip>
        </div>
      </div>

      <CodeEditor
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        isTestScript={isTestScript}
        onRun={handleTest}
      />

      <div className="script-console" ref={consoleRef}>
        <div className="console-resize-handle" onMouseDown={handleConsoleDragStart} />
        <div className="console-header">
          <AlertCircle size={12} />
          <span>Console Output</span>
          <button className="console-clear" onClick={() => setConsoleLogs([])}>
            Clear
          </button>
        </div>
        <div className="console-body">
          {consoleLogs.length === 0 ? (
            <div className="console-empty">No output. Click &quot;Test&quot; to execute the script.</div>
          ) : (
            consoleLogs.map((log, i) => (
              <div key={i} className={`console-log ${getLogClass(log.text)}`}>
                <span className="console-log-timestamp">{log.timestamp}</span>
                <span className="console-log-text">{log.text}</span>
                <button
                  className="console-log-copy"
                  onClick={() => handleCopyLog(log.text, i)}
                  title="Copy"
                >
                  {copiedIndex === i ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
