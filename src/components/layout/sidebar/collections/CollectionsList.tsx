import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { FolderOpen } from 'lucide-react'
import SidebarCollectionItem, { type SelectedItem } from '../SidebarCollectionItem'
import { CollectionItemContext } from '../CollectionItemContext'
import { DragOverlayContent } from './DragOverlayContent'
import type { RequestData, Collection } from '@/types'

interface CollectionsListProps {
  collections: Collection[]
  selected: SelectedItem
  editingId: string | null
  editValue: string
  expandedCollections: Set<string>
  clipboardRequest: RequestData | null
  activeDragId: string | null
  activeDragData: { type: string; requestId?: string; collectionId?: string } | null
  onEditChange: (v: string) => void
  onEditCommit: () => void
  onEditCancel: () => void
  onSelect: (s: SelectedItem) => void
  onToggleCollection: (id: string) => void
  onLoadRequest: (req: RequestData) => void
  onLoadRequestFromCollection: (req: RequestData, collId: string) => void
  onDeleteCollection: (id: string) => void
  onDeleteRequest: (collId: string, reqId: string) => void
  onCopyRequest: (req: RequestData) => void
  onPasteRequest: (collId: string) => void
  onDoubleClickName: (id: string, name: string) => void
  onDragStart: (event: DragStartEvent) => void
  onDragEnd: (event: DragEndEvent) => void
  onCollectionContextMenu: (e: React.MouseEvent, collectionId: string) => void
  onRequestContextMenu: (e: React.MouseEvent, req: RequestData, collectionId: string) => void
}

export function CollectionsList({
  collections, selected, editingId, editValue, expandedCollections,
  clipboardRequest, activeDragId, activeDragData,
  onEditChange, onEditCommit, onEditCancel, onSelect,
  onToggleCollection, onLoadRequest, onLoadRequestFromCollection,
  onDeleteCollection, onDeleteRequest, onCopyRequest, onPasteRequest,
  onDoubleClickName, onDragStart, onDragEnd,
  onCollectionContextMenu, onRequestContextMenu,
}: CollectionsListProps) {
  const addRequestToCollection = null as any
  return (
    <div className="section-content" onClick={() => onSelect(null)}>
      {collections.length === 0 && (
        <div className="empty-state">
          <FolderOpen size={24} className="empty-state-icon" />
          <span>No collections yet</span>
          <span className="empty-state-hint">Click + to create one</span>
        </div>
      )}
      <CollectionItemContext.Provider value={{
        selected,
        editingId,
        editValue,
        onEditChange,
        onEditCommit,
        onEditCancel,
        onLoadRequest,
        onCopyRequest,
        onPasteRequest: () => {
          if (clipboardRequest) {
          }
        },
        clipboardRequest,
        onRequestDoubleClickName: (reqId, reqName) => onDoubleClickName(reqId, reqName),
        onRequestContextMenu: (e, _req) => {
          e.preventDefault()
          e.stopPropagation()
        },
        onDeleteRequest: () => { },
      }}>
        <DndContext
          sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }))}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={collections.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {collections.map((collection) => (
              <SidebarCollectionItem
                key={collection.id}
                collection={collection}
                isExpanded={expandedCollections.has(collection.id)}
                onToggle={onToggleCollection}
                selected={selected}
                editingId={editingId}
                editValue={editValue}
                onEditChange={onEditChange}
                onEditCommit={onEditCommit}
                onEditCancel={onEditCancel}
                onSelect={onSelect}
                onLoadRequest={onLoadRequestFromCollection}
                onDeleteCollection={onDeleteCollection}
                onDeleteRequest={onDeleteRequest}
                onCopyRequest={onCopyRequest}
                onPasteRequest={() => onPasteRequest(collection.id)}
                clipboardRequest={clipboardRequest}
                onContextMenu={(e) => onCollectionContextMenu(e, collection.id)}
                onRequestContextMenu={(e, req) => onRequestContextMenu(e, req, collection.id)}
                onDoubleClickName={onDoubleClickName}
                onRequestDoubleClickName={onDoubleClickName}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            <DragOverlayContent activeDragId={activeDragId} activeDragData={activeDragData} collections={collections} />
          </DragOverlay>
        </DndContext>
      </CollectionItemContext.Provider>
    </div>
  )
}
