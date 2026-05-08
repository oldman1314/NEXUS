import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Send,
  OctagonX,
  Terminal,
  Loader2,
  AlertCircle,
  Unplug,
} from 'lucide-react'
import { useRemoteToolsStore, type TerminalStyle, type TerminalLine, type SshConnectionState } from '@/stores/useRemoteToolsStore'
import Tooltip from '@/components/common/Tooltip'

const ANSI_RE = /\x1b\[[\d;?]*[a-zA-Z]|\x1b\][^\x07]*?(?:\x07|\x1b\\)|\x1b[^[\]\d]|\x1b\[|\x1b]|[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g

function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, '')
}

const ESTIMATED_LINE_HEIGHT = 20
const BUFFER_LINES = 10
const EMPTY_TERMINAL_LINES: TerminalLine[] = []
const EMPTY_COMMAND_HISTORY: string[] = []

function getLineClass(type: string): string {
  switch (type) {
    case 'error': return 'terminal-line-error'
    case 'command': return 'terminal-line-command'
    case 'info': return 'terminal-line-info'
    default: return 'terminal-line-output'
  }
}

export default function SshTerminal({ sessionId }: { sessionId: string }) {
  const sshState = useRemoteToolsStore(
    useCallback((state) => state.sshSessions[sessionId]?.state ?? 'idle' as SshConnectionState, [sessionId])
  )
  const terminalLines = useRemoteToolsStore(
    useCallback((state) => state.sshSessions[sessionId]?.terminalLines ?? EMPTY_TERMINAL_LINES, [sessionId])
  )
  const commandHistory = useRemoteToolsStore(
    useCallback((state) => state.sshSessions[sessionId]?.commandHistory ?? EMPTY_COMMAND_HISTORY, [sessionId])
  )
  const sessionStyle = useRemoteToolsStore(
    useCallback((state) => state.sshSessions[sessionId]?.terminalStyle, [sessionId])
  )

  const setSshState = useRemoteToolsStore((state) => state.setSshState)
  const addTerminalLine = useRemoteToolsStore((state) => state.addTerminalLine)
  const addCommandHistory = useRemoteToolsStore((state) => state.addCommandHistory)
  const defaultTerminalStyle = useRemoteToolsStore((state) => state.defaultTerminalStyle)

  const [command, setCommand] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const sshStateRef = useRef<SshConnectionState>(sshState)
  const autoFollowRef = useRef(true)
  const addTerminalLineRef = useRef(addTerminalLine)
  addTerminalLineRef.current = addTerminalLine
  const setSshStateRef = useRef(setSshState)
  setSshStateRef.current = setSshState
  const isProgrammaticScrollRef = useRef(false)

  const [resolvedStyle, setResolvedStyle] = useState<TerminalStyle>(() => {
    if (sessionStyle) return sessionStyle
    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
    return isDark ? 'classic' : 'light'
  })

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })

  sshStateRef.current = sshState

  useEffect(() => {
    if (sessionStyle) {
      setResolvedStyle((prev) => prev === sessionStyle ? prev : sessionStyle)
      return
    }
    if (defaultTerminalStyle !== 'auto') return
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      const next = isDark ? 'classic' : 'light'
      setResolvedStyle((prev) => prev === next ? prev : next)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const next = isDark ? 'classic' : 'light'
    setResolvedStyle((prev) => prev === next ? prev : next)
    return () => observer.disconnect()
  }, [defaultTerminalStyle, sessionStyle])

  const terminalStyle = defaultTerminalStyle === 'auto' ? resolvedStyle : (sessionStyle ?? 'classic')

  useEffect(() => {
    window.electronAPI?.sshGetState(sessionId).then((state) => {
      if (state && state !== sshStateRef.current) {
        setSshStateRef.current(sessionId, state as SshConnectionState)
      }
    })
  }, [sessionId])

  useEffect(() => {
    if (autoFollowRef.current && terminalRef.current) {
      isProgrammaticScrollRef.current = true
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false
      })
    }
  }, [terminalLines])

  useEffect(() => {
    if (sshState === 'shell_ready' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [sshState])

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    const removeData = api.onSshData(({ sessionId: sid, data }) => {
      if (sid !== sessionId) return
      addTerminalLineRef.current(sessionId, { text: stripAnsi(data), type: 'output' })
    })
    const removeStderr = api.onSshStderr(({ sessionId: sid, data }) => {
      if (sid !== sessionId) return
      addTerminalLineRef.current(sessionId, { text: stripAnsi(data), type: 'error' })
    })
    const removeError = api.onSshError(({ sessionId: sid, error }) => {
      if (sid !== sessionId) return
      addTerminalLineRef.current(sessionId, { text: stripAnsi(error), type: 'error' })
      if (sshStateRef.current !== 'shell_ready') {
        setSshStateRef.current(sessionId, 'error')
      }
    })
    const removeClose = api.onSshClose(({ sessionId: sid }) => {
      if (sid !== sessionId) return
      addTerminalLineRef.current(sessionId, { text: 'Connection closed.', type: 'info' })
      setSshStateRef.current(sessionId, 'disconnected')
    })

    cleanupRef.current = () => {
      removeData()
      removeStderr()
      removeError()
      removeClose()
    }

    return () => {
      cleanupRef.current?.()
    }
  }, [sessionId])

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return

    const el = terminalRef.current
    if (!el) return

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < ESTIMATED_LINE_HEIGHT * 2
    autoFollowRef.current = isNearBottom

    const startLine = Math.max(0, Math.floor(el.scrollTop / ESTIMATED_LINE_HEIGHT) - BUFFER_LINES)
    const visibleCount = Math.ceil(el.clientHeight / ESTIMATED_LINE_HEIGHT)
    const endLine = Math.min(terminalLines.length, startLine + visibleCount + BUFFER_LINES * 2)

    setVisibleRange((prev) => {
      if (prev.start === startLine && prev.end === endLine) return prev
      return { start: startLine, end: endLine }
    })
  }, [terminalLines.length])

  const handleScrollRef = useRef(handleScroll)
  handleScrollRef.current = handleScroll

  useEffect(() => {
    const el = terminalRef.current
    if (!el) return
    handleScrollRef.current()
  }, [terminalLines.length])

  const virtualLines = useMemo(() => {
    return terminalLines.slice(visibleRange.start, visibleRange.end)
  }, [terminalLines, visibleRange])

  const topPadding = visibleRange.start * ESTIMATED_LINE_HEIGHT
  const bottomPadding = Math.max(0, (terminalLines.length - visibleRange.end) * ESTIMATED_LINE_HEIGHT)

  const handleSendCommand = useCallback(async () => {
    const trimmed = command.trim()
    if (!trimmed || sshState !== 'shell_ready') return
    addTerminalLine(sessionId, { text: `$ ${trimmed}`, type: 'command' })
    addCommandHistory(sessionId, trimmed)
    const result = await window.electronAPI?.sshExec(sessionId, trimmed)
    if (!result?.success) {
      addTerminalLine(sessionId, { text: result?.error || 'Failed to send command', type: 'error' })
    }
    setCommand('')
    setHistoryIndex(-1)
  }, [command, sessionId, sshState, addTerminalLine, addCommandHistory])

  const handleSendSignal = useCallback((signal: string, label: string) => {
    if (sshState !== 'shell_ready') return
    window.electronAPI?.sshExec(sessionId, signal)
    addTerminalLine(sessionId, { text: `^${label}`, type: 'info' })
  }, [sessionId, sshState, addTerminalLine])

  const commandHistoryRef = useRef(commandHistory)
  commandHistoryRef.current = commandHistory

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSendCommand()
        return
      }
      if (e.key === 'c' && e.ctrlKey && sshState === 'shell_ready') {
        e.preventDefault()
        handleSendSignal('\x03', 'C')
        return
      }
      if (e.key === 'd' && e.ctrlKey && sshState === 'shell_ready') {
        e.preventDefault()
        handleSendSignal('\x04', 'D')
        return
      }
      if (e.key === 'z' && e.ctrlKey && sshState === 'shell_ready') {
        e.preventDefault()
        handleSendSignal('\x1a', 'Z')
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const hist = commandHistoryRef.current
        if (hist.length === 0) return
        const newIndex = historyIndex === -1 ? hist.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setCommand(hist[newIndex] || '')
        requestAnimationFrame(() => {
          const input = inputRef.current
          if (input) input.setSelectionRange(input.value.length, input.value.length)
        })
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const hist = commandHistoryRef.current
        if (historyIndex === -1) return
        const newIndex = historyIndex + 1
        if (newIndex >= hist.length) {
          setHistoryIndex(-1)
          setCommand('')
        } else {
          setHistoryIndex(newIndex)
          setCommand(hist[newIndex] || '')
        }
        requestAnimationFrame(() => {
          const input = inputRef.current
          if (input) input.setSelectionRange(input.value.length, input.value.length)
        })
        return
      }
    },
    [handleSendCommand, handleSendSignal, sshState, historyIndex]
  )

  const canInput = sshState === 'shell_ready'

  return (
    <div className={`ssh-terminal ssh-terminal-style-${terminalStyle}`}>
      <div className="ssh-terminal-content" ref={terminalRef} onScroll={handleScroll}>
        {terminalLines.length === 0 ? (
          <div className="empty-state">
            {sshState === 'idle' ? (
              <>
                <Terminal size={24} className="empty-state-icon" />
                <span>SSH Terminal</span>
                <span className="empty-state-hint">Click ⚙ to configure, then 🔌 to connect</span>
              </>
            ) : sshState === 'connecting' ? (
              <>
                <Loader2 size={24} className="empty-state-icon ssh-spin-icon" />
                <span>Connecting...</span>
                <span className="empty-state-hint">Establishing SSH connection</span>
              </>
            ) : sshState === 'error' ? (
              <>
                <AlertCircle size={24} className="empty-state-icon" />
                <span>Connection Failed</span>
                <span className="empty-state-hint">Check settings and try again</span>
              </>
            ) : sshState === 'disconnected' ? (
              <>
                <Unplug size={24} className="empty-state-icon" />
                <span>Disconnected</span>
                <span className="empty-state-hint">Click 🔌 to reconnect</span>
              </>
            ) : (
              <>
                <Terminal size={24} className="empty-state-icon" />
                <span>Waiting...</span>
              </>
            )}
          </div>
        ) : (
          <div className="ssh-terminal-lines" style={{ paddingTop: topPadding, paddingBottom: bottomPadding }}>
            {virtualLines.map((line) => (
              <div key={line.id} className={`terminal-line ${getLineClass(line.type)}`}>
                <pre>{line.text}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ssh-terminal-input-bar">
        <span className="ssh-prompt">{canInput ? '$' : '#'}</span>
        <input
          ref={inputRef}
          type="text"
          className="ssh-command-input"
          placeholder={
            sshState === 'connecting'
              ? 'Waiting for shell...'
              : canInput
                ? 'Enter command... (Ctrl+C to interrupt)'
                : 'Connect to send commands'
          }
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!canInput}
        />
        {canInput && (
          <Tooltip content="Interrupt (Ctrl+C)">
            <button className="ssh-signal-btn" onClick={() => handleSendSignal('\x03', 'C')}>
              <OctagonX size={12} />
            </button>
          </Tooltip>
        )}
        <button
          className="ssh-send-btn"
          onClick={handleSendCommand}
          disabled={!canInput || !command.trim()}
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  )
}
