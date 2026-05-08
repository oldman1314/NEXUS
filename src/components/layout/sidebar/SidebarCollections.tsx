import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '@/stores/useAppStore'
import { useRequestStore } from '@/stores/useRequestStore'
import { useUIStore } from '@/stores/useUIStore'
import { toast } from '@/stores/useToastStore'
import type { RequestData } from '@/types'
import ContextMenu from '@/components/common/ContextMenu'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { type SelectedItem } from './SidebarCollectionItem'
import { useCollectionContextMenu } from '@/hooks/useCollectionContextMenu'
import { useCollectionKeyboard } from '@/hooks/useCollectionKeyboard'
import { CollectionsHeader } from './collections/CollectionsHeader'
import { CollectionsList } from './collections/CollectionsList'
import './sidebar-collections.css'

export { type SelectedItem } from './SidebarCollectionItem'

type PendingAction = { type: 'new-request' } | { type: 'load-request'; request: RequestData } | { type: 'load-collection-request'; request: RequestData; collectionId: string }

export default function SidebarCollections() {
  const [selected, setSelected] = useState<SelectedItem>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    items: React.ComponentProps<typeof ContextMenu>['items']
  } | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activeDragData, setActiveDragData] = useState<{ type: string; requestId?: string; collectionId?: string } | null>(null)
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const collections = useAppStore((state) => state.collections)
  const addCollection = useAppStore((state) => state.addCollection)
  const deleteCollection = useAppStore((state) => state.deleteCollection)
  const updateCollection = useAppStore((state) => state.updateCollection)
  const addRequestToCollection = useAppStore((state) => state.addRequestToCollection)
  const deleteRequestFromCollection = useAppStore((state) => state.deleteRequestFromCollection)
  const updateRequestInCollection = useAppStore((state) => state.updateRequestInCollection)
  const reorderCollections = useAppStore((state) => state.reorderCollections)
  const reorderRequests = useAppStore((state) => state.reorderRequests)
  const moveRequest = useAppStore((state) => state.moveRequest)
  const clipboardRequest = useAppStore((state) => state.clipboardRequest)
  const setClipboardRequest = useAppStore((state) => state.setClipboardRequest)
  const activeRequest = useRequestStore((state) => state.activeRequest)
  const activeCollectionId = useRequestStore((state) => state.activeCollectionId)
  const isDirty = useRequestStore((state) => state.isDirty)
  const markClean = useRequestStore((state) => state.markClean)
  const openTab = useRequestStore((state) => state.openTab)
  const setView = useUIStore((state) => state.setView)
  const setImportDialogOpen = useUIStore((state) => state.setImportDialogOpen)
  const exportCollections = useAppStore((state) => state.exportCollections)
  const importCollections = useAppStore((state) => state.importCollections)

  const startEditing = useCallback((id: string, name: string) => {
    setEditingId(id)
    setEditValue(name)
  }, [])

  const commitEdit = useCallback(() => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null)
      return
    }
    if (selected?.type === 'collection') {
      updateCollection(editingId, { name: editValue.trim() })
    } else if (selected?.type === 'request') {
      updateRequestInCollection(selected.collectionId, editingId, { name: editValue.trim() })
    }
    setEditingId(null)
  }, [editingId, editValue, selected, updateCollection, updateRequestInCollection])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  const { getCollectionContextMenu, getRequestContextMenu } = useCollectionContextMenu(startEditing)
  useCollectionKeyboard(selected, editingId, startEditing, setSelected)

  const toggleCollection = useCallback((id: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleNewCollection = useCallback(() => {
    const id = addCollection('New Collection')
    setExpandedCollections((prev) => new Set(prev).add(id))
    setSelected({ type: 'collection', id })
    setEditingId(id)
    setEditValue('New Collection')
  }, [addCollection])

  const handleLoadRequest = useCallback((request: RequestData) => {
    if (isDirty) {
      setPendingAction({ type: 'load-request', request })
      return
    }
    openTab({ ...request }, null)
    setView('request')
  }, [openTab, setView, isDirty])

  const handleLoadRequestFromCollection = useCallback((request: RequestData, collectionId: string) => {
    if (isDirty) {
      setPendingAction({ type: 'load-collection-request', request, collectionId })
      return
    }
    openTab({ ...request }, collectionId)
    setView('request')
  }, [openTab, setView, isDirty])

  const handleNewRequest = useCallback(() => {
    if (isDirty) {
      setPendingAction({ type: 'new-request' })
      return
    }
    createRequestAndActivate()
  }, [isDirty])

  const createRequestAndActivate = useCallback(() => {
    const newId = crypto.randomUUID()
    const newRequest: RequestData = {
      id: newId, name: 'New Request', method: 'GET', url: '', params: [],
      headers: [], bodyType: 'none', bodyRaw: '', formData: [], urlEncodedData: [],
      authType: 'none', authConfig: {}, preRequestScript: '', testScript: '', savedResponses: [],
    }
    const existingScratchpad = collections.find((c) => c.name === 'Scratchpad')
    const scratchpadId = existingScratchpad ? existingScratchpad.id : addCollection('Scratchpad')
    addRequestToCollection(scratchpadId, newRequest)
    openTab(newRequest, scratchpadId)
    setView('request')
  }, [collections, addCollection, addRequestToCollection, openTab, setView])

  const proceedWithDiscard = useCallback(() => {
    const action = pendingAction
    setPendingAction(null)
    if (!action) return
    if (action.type === 'new-request') {
      createRequestAndActivate()
    } else if (action.type === 'load-request') {
      openTab({ ...action.request }, null)
      setView('request')
    } else if (action.type === 'load-collection-request') {
      openTab({ ...action.request }, action.collectionId)
      setView('request')
    }
  }, [pendingAction, createRequestAndActivate, openTab, setView])

  const saveAndProceed = useCallback(() => {
    if (activeRequest && activeCollectionId) {
      updateRequestInCollection(activeCollectionId, activeRequest.id, activeRequest)
      markClean()
      toast('success', 'Request saved!')
    }
    proceedWithDiscard()
  }, [activeRequest, activeCollectionId, updateRequestInCollection, markClean, proceedWithDiscard])

  const handleCopyRequest = useCallback((req: RequestData) => {
    setClipboardRequest(req)
    toast('success', 'Request copied!')
  }, [setClipboardRequest])

  const handleExport = useCallback(async () => {
    const json = exportCollections()
    await navigator.clipboard.writeText(json)
    toast('success', 'Exported to clipboard!')
  }, [exportCollections])

  const handleImport = useCallback(async () => {
    const json = await navigator.clipboard.readText()
    const ok = importCollections(json)
    if (ok) {
      toast('success', 'Imported successfully!')
    } else {
      toast('error', 'Invalid import data')
    }
  }, [importCollections])

  const handleDragStart = useCallback((event: any) => {
    const id = String(event.active.id)
    setActiveDragId(id)
    setActiveDragData(event.active.data.current as { type: string; requestId?: string; collectionId?: string })
  }, [])

  const handleDragEnd = useCallback((event: any) => {
    setActiveDragId(null)
    setActiveDragData(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeCollIndex = collections.findIndex((c) => c.id === activeId)
    const overCollIndex = collections.findIndex((c) => c.id === overId)

    if (activeCollIndex !== -1 && overCollIndex !== -1) {
      reorderCollections(activeCollIndex, overCollIndex)
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.requestId && overData?.requestId) {
      const activeCollId = activeData.collectionId as string
      const overCollId = overData.collectionId as string
      const activeReqId = activeData.requestId as string
      const overReqId = overData.requestId as string

      if (activeCollId === overCollId) {
        const coll = collections.find((c) => c.id === activeCollId)
        if (!coll) return
        const fromIdx = coll.requests.findIndex((r) => r.id === activeReqId)
        const toIdx = coll.requests.findIndex((r) => r.id === overReqId)
        if (fromIdx !== -1 && toIdx !== -1) {
          reorderRequests(activeCollId, fromIdx, toIdx)
        }
      } else {
        moveRequest(
          { collectionId: activeCollId, requestId: activeReqId },
          { collectionId: overCollId }
        )
      }
    }
  }, [collections, reorderCollections, reorderRequests, moveRequest])

  const handleCollectionContextMenu = useCallback((e: React.MouseEvent, collectionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelected({ type: 'collection', id: collectionId })
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: getCollectionContextMenu(collectionId),
    })
  }, [getCollectionContextMenu])

  const handleRequestContextMenu = useCallback((e: React.MouseEvent, req: RequestData, collectionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelected({ type: 'request', id: req.id, collectionId })
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: getRequestContextMenu(collectionId, req.id),
    })
  }, [getRequestContextMenu])

  const handlePasteRequest = useCallback((collectionId: string) => {
    if (clipboardRequest) {
      addRequestToCollection(collectionId, { ...clipboardRequest, id: crypto.randomUUID() })
      toast('success', 'Request pasted!')
    }
  }, [clipboardRequest, addRequestToCollection])

  return (
    <div className="sidebar-section sidebar-section-collections">
      <CollectionsHeader
        onNewRequest={handleNewRequest}
        onExport={handleExport}
        onImport={handleImport}
        onImportFile={() => setImportDialogOpen(true)}
        onNewCollection={handleNewCollection}
      />
      <CollectionsList
        collections={collections}
        selected={selected}
        editingId={editingId}
        editValue={editValue}
        expandedCollections={expandedCollections}
        clipboardRequest={clipboardRequest}
        activeDragId={activeDragId}
        activeDragData={activeDragData}
        onEditChange={setEditValue}
        onEditCommit={commitEdit}
        onEditCancel={cancelEdit}
        onSelect={setSelected}
        onToggleCollection={toggleCollection}
        onLoadRequest={handleLoadRequest}
        onLoadRequestFromCollection={handleLoadRequestFromCollection}
        onDeleteCollection={deleteCollection}
        onDeleteRequest={deleteRequestFromCollection}
        onCopyRequest={handleCopyRequest}
        onPasteRequest={handlePasteRequest}
        onDoubleClickName={startEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onCollectionContextMenu={handleCollectionContextMenu}
        onRequestContextMenu={handleRequestContextMenu}
      />

      {contextMenu &&
        createPortal(
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onClose={() => setContextMenu(null)}
          />,
          document.body
        )}

      <ConfirmDialog
        open={pendingAction !== null}
        title="Unsaved Changes"
        message={`"${activeRequest?.name || 'Untitled'}" has unsaved changes.`}
        detail="Would you like to save before continuing?"
        confirmLabel={activeCollectionId ? 'Save & Continue' : 'Discard'}
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={activeCollectionId ? saveAndProceed : proceedWithDiscard}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  )
}
