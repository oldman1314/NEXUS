import { FolderOpen } from 'lucide-react'
import type { Collection } from '@/types'

interface DragOverlayContentProps {
  activeDragId: string | null
  activeDragData: { type: string; requestId?: string; collectionId?: string } | null
  collections: Collection[]
}

export function DragOverlayContent({ activeDragId, activeDragData, collections }: DragOverlayContentProps) {
  if (!activeDragId) return null

  if (activeDragData?.type === 'request') {
    const coll = collections.find((c) => c.id === activeDragData.collectionId)
    const req = coll?.requests.find((r) => r.id === activeDragData.requestId)
    if (!req) return null
    return (
      <div className="request-item dragging" style={{ opacity: 0.8 }}>
        <span className={`method-badge method-${req.method.toLowerCase()}`}>
          {req.method}
        </span>
        <span className="request-name">{req.name}</span>
      </div>
    )
  }

  const coll = collections.find((c) => c.id === activeDragId)
  if (!coll) return null
  return (
    <div className="collection-header dragging" style={{ opacity: 0.8 }}>
      <FolderOpen size={14} />
      <span className="collection-name">{coll.name}</span>
    </div>
  )
}
