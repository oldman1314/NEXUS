import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import { getCompletions, insertCompletion, type CompletionItem } from '@/utils/code-completion'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isTestScript?: boolean
  onRun?: () => void
}

const PM_API_PATTERN =
  /\bpm\b(?:\.(?:environment|variables|request|response|test|expect|console))?(?:\.[a-zA-Z_$][\w$]*)?/g

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function highlightCode(code: string): string {
  if (!code) return '<br>'

  const tokens = Prism.tokenize(code, Prism.languages.javascript)

  let html = ''
  function walkTokens(token: Prism.Token | string) {
    if (typeof token === 'string') {
      html += escapeHtml(token)
      return
    }
    const type = token.type
    const content = token.content
    if (Array.isArray(content)) {
      html += `<span class="token ${escapeHtml(type)}">`
      content.forEach(walkTokens)
      html += '</span>'
    } else {
      html += `<span class="token ${escapeHtml(type)}">`
      walkTokens(content)
      html += '</span>'
    }
  }

  tokens.forEach(walkTokens)

  html = html.replace(
    PM_API_PATTERN,
    (match) => `<span class="token pm-api">${escapeHtml(match)}</span>`
  )

  if (code.endsWith('\n')) {
    html += '<br>'
  }

  return html
}

function getCursorLine(value: string, selectionStart: number): number {
  const textBefore = value.slice(0, selectionStart)
  return textBefore.split('\n').length - 1
}

export default function CodeEditor({ value, onChange, placeholder, isTestScript = false, onRun }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const lineCountRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const currentLineRef = useRef<HTMLDivElement>(null)

  const [completions, setCompletions] = useState<CompletionItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showCompletions, setShowCompletions] = useState(false)
  const [completionPos, setCompletionPos] = useState({ top: 0, left: 0 })

  const highlightedHtml = useMemo(() => highlightCode(value), [value])

  const updateCurrentLine = useCallback(() => {
    const textarea = textareaRef.current
    const lineEl = currentLineRef.current
    if (!textarea || !lineEl) return

    const line = getCursorLine(value, textarea.selectionStart)

    const lineHeight = 19.2
    const paddingTop = 12
    lineEl.style.top = `${line * lineHeight + paddingTop}px`
  }, [value])

  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current
    const highlight = highlightRef.current
    const lineCount = lineCountRef.current
    const lineEl = currentLineRef.current
    if (!textarea || !highlight || !lineCount) return
    highlight.scrollTop = textarea.scrollTop
    highlight.scrollLeft = textarea.scrollLeft
    lineCount.scrollTop = textarea.scrollTop
    if (lineEl) {
      lineEl.style.transform = `translateY(${-textarea.scrollTop}px)`
    }
  }, [])

  const updateLineCount = useCallback(() => {
    const textarea = textareaRef.current
    const lineCount = lineCountRef.current
    if (!textarea || !lineCount) return

    const targetCount = textarea.value.split('\n').length
    const currentCount = lineCount.children.length

    if (targetCount > currentCount) {
      const fragment = document.createDocumentFragment()
      for (let i = currentCount; i < targetCount; i++) {
        const div = document.createElement('div')
        div.className = 'editor-line-num'
        div.textContent = String(i + 1)
        fragment.appendChild(div)
      }
      lineCount.appendChild(fragment)
    } else if (targetCount < currentCount) {
      for (let i = currentCount - 1; i >= targetCount; i--) {
        lineCount.removeChild(lineCount.children[i])
      }
    }
  }, [])

  useEffect(() => {
    updateLineCount()
  }, [value, updateLineCount])

  useEffect(() => {
    updateCurrentLine()
  }, [value, updateCurrentLine])

  const computeCompletionPos = useCallback(() => {
    const textarea = textareaRef.current
    const wrapper = wrapperRef.current
    if (!textarea || !wrapper) return { top: 0, left: 0 }

    const textBeforeCursor = value.slice(0, textarea.selectionStart)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines[lines.length - 1]

    const charWidth = 7.2
    const lineHeight = 19.2

    const left = currentLine.length * charWidth + 48
    const top = lines.length * lineHeight - textarea.scrollTop + 24

    // Prevent popup from going beyond wrapper bounds
    const popupWidth = 220
    const popupHeight = 220
    const maxLeft = wrapper.clientWidth - popupWidth
    const maxTop = wrapper.clientHeight - popupHeight

    return {
      top: Math.min(Math.max(top, 0), Math.max(maxTop, 0)),
      left: Math.min(Math.max(left, 0), Math.max(maxLeft, 0)),
    }
  }, [value])

  const triggerCompletions = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const pos = textarea.selectionStart
    const textBefore = value.slice(0, pos)
    const items = getCompletions(textBefore, isTestScript)

    if (items.length > 0) {
      setCompletions(items)
      setSelectedIndex(0)
      setCompletionPos(computeCompletionPos())
      setShowCompletions(true)
    } else {
      setShowCompletions(false)
    }
  }, [value, isTestScript, computeCompletionPos])

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const newValue = textarea.value
    onChange(newValue)
    updateLineCount()
    handleScroll()

    requestAnimationFrame(() => {
      triggerCompletions()
      updateCurrentLine()
    })
  }, [onChange, updateLineCount, handleScroll, triggerCompletions, updateCurrentLine])

  const applyCompletion = useCallback(
    (item: CompletionItem) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const pos = textarea.selectionStart
      const { newValue, newCursorPos } = insertCompletion(value, pos, item)
      onChange(newValue)
      setShowCompletions(false)

      requestAnimationFrame(() => {
        textarea.selectionStart = newCursorPos
        textarea.selectionEnd = newCursorPos
        textarea.focus()
        updateCurrentLine()
      })
    },
    [value, onChange, updateCurrentLine]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onRun) {
        e.preventDefault()
        onRun()
        return
      }

      if (showCompletions && completions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % completions.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + completions.length) % completions.length)
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          applyCompletion(completions[selectedIndex])
          return
        }
        if (e.key === 'Escape') {
          setShowCompletions(false)
          return
        }
      }

      const openBrackets: Record<string, string> = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'", '`': '`' }
      if (e.key in openBrackets) {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const closeBracket = openBrackets[e.key]
        const selectedText = value.slice(start, end)
        const newValue = value.slice(0, start) + e.key + selectedText + closeBracket + value.slice(end)
        onChange(newValue)
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 1
          textarea.selectionEnd = start + 1 + selectedText.length
        })
        return
      }

      const closingMap: Record<string, string> = { ')': '(', '}': '{', ']': '[', '"': '"', "'": "'", '`': '`' }
      if (e.key in closingMap) {
        const textarea = e.currentTarget
        const pos = textarea.selectionStart
        if (value[pos] === e.key) {
          e.preventDefault()
          textarea.selectionStart = pos + 1
          textarea.selectionEnd = pos + 1
          return
        }
      }

      requestAnimationFrame(() => {
        updateCurrentLine()
      })
    },
    [showCompletions, completions, selectedIndex, applyCompletion, value, onChange, onRun, updateCurrentLine]
  )

  const handleCursorChange = useCallback(() => {
    updateCurrentLine()
  }, [updateCurrentLine])

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowCompletions(false)
      }
    }
    document.addEventListener('mousedown', handleDocClick)
    return () => document.removeEventListener('mousedown', handleDocClick)
  }, [])

  return (
    <div ref={wrapperRef} className="code-editor-container">
      <div className="code-editor-wrapper">
        <div className="line-numbers" ref={lineCountRef} />
        <div className="code-editor-area">
          <div className="current-line-highlight" ref={currentLineRef} />
          <pre
            ref={highlightRef}
            className="code-highlight"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlightedHtml + '<br>' }}
          />
          <textarea
            ref={textareaRef}
            className="code-textarea"
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {showCompletions && completions.length > 0 && (
        <div
          className="completion-popup"
          style={{ top: completionPos.top, left: completionPos.left }}
        >
          {completions.map((item, i) => (
            <div
              key={item.label + i}
              className={`completion-item ${i === selectedIndex ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                applyCompletion(item)
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className={`completion-kind ${item.kind}`} />
              <span className="completion-label">{item.label}</span>
              {item.detail && <span className="completion-detail">{item.detail}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
