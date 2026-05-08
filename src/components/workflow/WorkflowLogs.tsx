import { useCallback, useRef, useEffect } from 'react'
import { X, CheckCircle, XCircle, SkipForward } from 'lucide-react'
import type { WorkflowLog } from '@/types'

interface WorkflowLogsProps {
  logs: WorkflowLog[]
  onClose: () => void
  height?: number
  onHeightChange?: (height: number) => void
}

const MIN_HEIGHT = 120
const MAX_HEIGHT = 500

export default function WorkflowLogs({ logs, onClose, height = 240, onHeightChange }: WorkflowLogsProps) {
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    startY.current = e.clientY
    startHeight.current = height
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }, [height])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const delta = startY.current - e.clientY
    const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight.current + delta))
    onHeightChange?.(newHeight)
  }, [onHeightChange])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div className="workflow-logs" style={{ height, minHeight: height }}>
      <div className="logs-resize-handle" onMouseDown={handleMouseDown} />
      <div className="logs-header">
        <h3>Execution Logs</h3>
        <button className="logs-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="logs-content">
        {logs.length === 0 ? (
          <div className="logs-empty">No logs yet. Run the workflow to see results.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-item log-${log.status}`}>
              <div className="log-header">
                {log.status === 'success' && <CheckCircle size={14} className="log-icon success" />}
                {log.status === 'error' && <XCircle size={14} className="log-icon error" />}
                {log.status === 'skipped' && <SkipForward size={14} className="log-icon skipped" />}
                <span className="log-name">{log.nodeName}</span>
                <span className="log-duration">{log.duration}ms</span>
              </div>
              {log.output !== undefined && (
                <div className="log-output">
                  <pre>{typeof log.output === 'object' ? JSON.stringify(log.output, null, 2) : String(log.output)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
