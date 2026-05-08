import { useEffect, useRef, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type ToastType } from '@/stores/useToastStore'
import './toast.css'

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}

function ToastItem({ id, type, message, duration, createdAt }: {
  id: string
  type: ToastType
  message: string
  duration: number
  createdAt: number
}) {
  const removeToast = useToastStore((s) => s.removeToast)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const startRef = useRef(createdAt)
  const remainingRef = useRef(duration)
  const pausedRef = useRef(false)

  const startTimer = useCallback((remaining: number) => {
    timerRef.current = setTimeout(() => {
      removeToast(id)
    }, remaining)
  }, [id, removeToast])

  useEffect(() => {
    startTimer(duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [duration, startTimer])

  const handleMouseEnter = () => {
    if (pausedRef.current) return
    pausedRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    remainingRef.current = remainingRef.current - (Date.now() - startRef.current)
  }

  const handleMouseLeave = () => {
    if (!pausedRef.current) return
    pausedRef.current = false
    startRef.current = Date.now()
    startTimer(remainingRef.current)
  }

  const progress = Math.min((Date.now() - createdAt) / duration, 1)

  return (
    <div
      className={`toast toast-${type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => removeToast(id)}>
        <X size={14} />
      </button>
      <div className="toast-progress">
        <div
          className={`toast-progress-bar toast-progress-${type}`}
          style={{
            width: `${(1 - progress) * 100}%`,
            animationDuration: `${duration}ms`,
          }}
        />
      </div>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  )
}
