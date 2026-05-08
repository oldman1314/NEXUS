import React from 'react'
import { CSS } from '@dnd-kit/utilities'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  ClipboardPaste,
  FolderOpen,
  Trash2,
} from 'lucide-react'
import type { RequestData, Collection } from '@/types'

export type SelectedItem =
  | { type: 'collection'; id: string }
  | { type: 'request'; id: string; collectionId: string }
  | null

interface SortableRequestItemProps {
  req: RequestData
  collectionId: string
  isSelected: boolean
  isEditing: boolean
  editValue: string
  onEditChange: (v: string) => void
  onEditCommit: () => void
  onEditCancel: () => void
  onLoadRequest: (req: RequestData) => void
  onContextMenu: (e: React.MouseEvent, req: RequestData) => void
  onDoubleClickName: (reqId: string, reqName: string) => void
  onDeleteRequest: (reqId: string) => void
  onCopyRequest: (req: RequestData) => void
}

const SortableRequestItem = React.memo(function SortableRequestItem({
  req,
  collectionId,
  isSelected,
  isEditing,
  editValue,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onLoadRequest,
  onContextMenu,
  onDoubleClickName,
  onDeleteRequest,
  onCopyRequest,
}: SortableRequestItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: req.id,
    data: { type: 'request', requestId: req.id, collectionId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`request-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={() => onLoadRequest(req)}
      onContextMenu={(e) => onContextMenu(e, req)}
      {...attributes}
      {...listeners}
    >
      <span className={`method-badge method-${req.method.toLowerCase()}`}>
        {req.method}
      </span>
      {isEditing ? (
        <input
          className="inline-edit-input"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditCommit()
            if (e.key === 'Escape') onEditCancel()
            e.stopPropagation()
          }}
          onBlur={onEditCommit}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="request-name"
          onDoubleClick={(e) => {
            e.stopPropagation()
            onDoubleClickName(req.id, req.name)
          }}
        >
          {req.name}
        </span>
      )}
      <button
        className="icon-btn copy-btn"
        title="Copy"
        onClick={(e) => {
          e.stopPropagation()
          onCopyRequest(req)
        }}
      >
        <Copy size={10} />
      </button>
      <button
        className="icon-btn delete-btn"
        onClick={(e) => {
          e.stopPropagation()
          onDeleteRequest(req.id)
        }}
      >
        <Trash2 size={10} />
      </button>
    </div>
  )
})

interface SidebarCollectionItemProps {
  collection: Collection
  isExpanded: boolean
  onToggle: (id: string) => void
  selected: SelectedItem
  editingId: string | null
  editValue: string
  onEditChange: (v: string) => void
  onEditCommit: () => void
  onEditCancel: () => void
  onSelect: (item: SelectedItem) => void
  onLoadRequest: (req: RequestData, collectionId: string) => void
  onDeleteCollection: (id: string) => void
  onDeleteRequest: (collectionId: string, reqId: string) => void
  onContextMenu: (e: React.MouseEvent) => void
  onRequestContextMenu: (e: React.MouseEvent, req: RequestData) => void
  onDoubleClickName: (id: string, name: string) => void
  onRequestDoubleClickName: (id: string, name: string) => void
  onCopyRequest: (req: RequestData) => void
  onPasteRequest: () => void
  clipboardRequest: RequestData | null
}

export default React.memo(function SidebarCollectionItem({
  collection,
  isExpanded,
  onToggle,
  selected,
  editingId,
  editValue,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onSelect,
  onLoadRequest,
  onDeleteCollection,
  onDeleteRequest,
  onContextMenu,
  onRequestContextMenu,
  onDoubleClickName,
  onRequestDoubleClickName,
  onCopyRequest,
  onPasteRequest,
  clipboardRequest,
}: SidebarCollectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: collection.id,
    data: { type: 'collection' },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isCollectionSelected = selected?.type === 'collection' && selected.id === collection.id
  const isEditing = editingId === collection.id

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`collection-item ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div
        className={`collection-header ${isCollectionSelected ? 'selected' : ''}`}
        onClick={() => { onToggle(collection.id); onSelect({ type: 'collection', id: collection.id }) }}
        onContextMenu={onContextMenu}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <FolderOpen size={14} />
        {isEditing ? (
          <input
            className="inline-edit-input"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditCommit()
              if (e.key === 'Escape') onEditCancel()
              e.stopPropagation()
            }}
            onBlur={onEditCommit}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span
              className="collection-name"
              onDoubleClick={(e) => {
                e.stopPropagation()
                onDoubleClickName(collection.id, collection.name)
              }}
            >
              {collection.name}
            </span>
            <span className="collection-request-count">{collection.requests?.length || 0} 个请求</span>
          </>
        )}
        <button
          className="icon-btn delete-btn"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteCollection(collection.id)
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {isExpanded && (
        <div className="collection-requests">
          <SortableContext
            items={collection.requests.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {collection.requests.map((req) => {
              const isReqSelected = selected?.type === 'request' && selected.id === req.id
              const isReqEditing = editingId === req.id
              return (
                <SortableRequestItem
                  key={req.id}
                  req={req}
                  collectionId={collection.id}
                  isSelected={isReqSelected}
                  isEditing={isReqEditing}
                  editValue={editValue}
                  onEditChange={onEditChange}
                  onEditCommit={onEditCommit}
                  onEditCancel={onEditCancel}
                  onLoadRequest={(req) => onLoadRequest(req, collection.id)}
                  onContextMenu={onRequestContextMenu}
                  onDoubleClickName={onRequestDoubleClickName}
                  onDeleteRequest={(reqId) => onDeleteRequest(collection.id, reqId)}
                  onCopyRequest={onCopyRequest}
                />
              )
            })}
          </SortableContext>
          {clipboardRequest && (
            <button
              className="paste-request-btn"
              onClick={(e) => {
                e.stopPropagation()
                onPasteRequest()
              }}
            >
              <ClipboardPaste size={12} />
              <span>Paste Request</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
})