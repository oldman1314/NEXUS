import { useState, useRef, useEffect } from 'react'
import { ChevronRight, Pencil, Check, X } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'
import type { Collection, RequestData } from '@/types'
import './breadcrumb.css'

interface BreadcrumbItem {
  label: string
  id?: string
  type?: 'collection' | 'request'
  editable?: boolean
}

interface BreadcrumbProps {
  collections: Collection[]
  request: RequestData | null
  activeCollectionId: string | null
  onNavigate?: (type: string, id: string) => void
  onRequestRename?: (name: string) => void
}

function findRequestPath(
  collections: Collection[],
  request: RequestData | null,
  activeCollectionId: string | null
): BreadcrumbItem[] {
  if (!request) return [{ label: 'New Request', type: 'request', editable: true }]

  if (activeCollectionId) {
    const collection = collections.find((c) => c.id === activeCollectionId)
    if (collection) {
      const existsInCollection = collection.requests.some((r) => r.id === request.id)
      if (existsInCollection || request.id === 'default') {
        return [
          { label: collection.name, type: 'collection', id: collection.id },
          { label: request.name, type: 'request', id: request.id, editable: true },
        ]
      }
    }
  }

  for (const collection of collections) {
    const reqIndex = collection.requests.findIndex((r) => r.id === request.id)
    if (reqIndex !== -1) {
      return [
        { label: collection.name, type: 'collection', id: collection.id },
        { label: request.name, type: 'request', id: request.id, editable: true },
      ]
    }
  }

  return [
    { label: request.name, type: 'request', editable: true },
  ]
}

export default function Breadcrumb({ collections, request, activeCollectionId, onNavigate, onRequestRename }: BreadcrumbProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const items = findRequestPath(collections, request, activeCollectionId)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEdit() {
    if (request) {
      setEditValue(request.name)
      setEditing(true)
    }
  }

  function confirmEdit() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== request?.name) {
      onRequestRename?.(trimmed)
    }
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') confirmEdit()
    else if (e.key === 'Escape') cancelEdit()
  }

  return (
    <nav className="tb-breadcrumb" aria-label="Navigation">
      <ol className="tb-breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isEditing = isLast && editing

          return (
            <li key={index} className={`tb-breadcrumb-item ${isLast ? 'tb-breadcrumb-item--current' : ''}`}>
              {!isFirstHidden(index, items) && (
                <ChevronRight size={12} className="tb-breadcrumb-sep" />
              )}

              {isEditing ? (
                <span className="tb-breadcrumb-edit">
                  <input
                    ref={inputRef}
                    className="tb-breadcrumb-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={confirmEdit}
                    onKeyDown={handleKeyDown}
                  />
                  <button className="tb-edit-btn tb-edit-confirm" onClick={confirmEdit} aria-label="Confirm">
                    <Check size={11} />
                  </button>
                  <button className="tb-edit-btn tb-edit-cancel" onClick={cancelEdit} aria-label="Cancel">
                    <X size={11} />
                  </button>
                </span>
              ) : (
                <Tooltip content={item.label} placement="bottom">
                  <button
                    className={`tb-breadcrumb-link ${isLast ? 'tb-breadcrumb-link--active' : ''}`}
                    onClick={() => !isLast && onNavigate?.(item.type || '', item.id || '')}
                    onDoubleClick={() => item.editable && startEdit()}
                    title={isLast ? 'Double-click to rename' : undefined}
                  >
                    {item.label}
                    {item.editable && isLast && (
                      <Pencil size={10} className="tb-breadcrumb-edit-icon" />
                    )}
                  </button>
                </Tooltip>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function isFirstHidden(_index: number, _items: BreadcrumbItem[]): boolean {
  return _index === 0
}
