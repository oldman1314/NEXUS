import type { HttpMethod } from '@/types'
import './method-badge.css'

const METHOD_STYLES: Record<HttpMethod, { bg: string; color: string }> = {
  GET: { bg: 'var(--method-get-bg)', color: 'var(--method-get)' },
  POST: { bg: 'var(--method-post-bg)', color: 'var(--method-post)' },
  PUT: { bg: 'var(--method-put-bg)', color: 'var(--method-put)' },
  PATCH: { bg: 'var(--method-patch-bg)', color: 'var(--method-patch)' },
  DELETE: { bg: 'var(--method-delete-bg)', color: 'var(--method-delete)' },
  HEAD: { bg: 'var(--method-other-bg)', color: 'var(--method-other)' },
  OPTIONS: { bg: 'var(--method-other-bg)', color: 'var(--method-other)' },
}

interface MethodBadgeProps {
  method: HttpMethod
  size?: 'sm' | 'md'
}

export default function MethodBadge({ method, size = 'sm' }: MethodBadgeProps) {
  const style = METHOD_STYLES[method] || METHOD_STYLES.GET

  return (
    <span
      className={`tb-method-badge tb-method-badge--${size}`}
      style={{ '--method-bg': style.bg, '--method-color': style.color } as React.CSSProperties}
    >
      {method}
    </span>
  )
}
