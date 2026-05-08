import { useEffect, useRef, useCallback } from 'react'

export function useCodeEditor(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineCountRef = useRef<HTMLDivElement>(null)
  const scrollHandlerRef = useRef<(() => void) | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const debouncedUpdateLineCount = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(updateLineCount, 80)
  }, [updateLineCount])

  useEffect(() => {
    const textarea = textareaRef.current
    const lineCount = lineCountRef.current
    if (!textarea || !lineCount) return

    updateLineCount()

    const handleScroll = () => {
      lineCount.scrollTop = textarea.scrollTop
    }
    scrollHandlerRef.current = handleScroll

    textarea.addEventListener('input', debouncedUpdateLineCount)
    textarea.addEventListener('scroll', handleScroll)

    return () => {
      textarea.removeEventListener('input', debouncedUpdateLineCount)
      textarea.removeEventListener('scroll', handleScroll)
      scrollHandlerRef.current = null
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [updateLineCount, debouncedUpdateLineCount])

  useEffect(() => {
    updateLineCount()
  }, [value, updateLineCount])

  return { textareaRef, lineCountRef }
}
