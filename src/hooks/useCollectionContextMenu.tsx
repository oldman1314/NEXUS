import { useCallback } from 'react'
import { Copy, ClipboardPaste, Edit3, FolderOpen, Plus, Trash2, GitFork, FileOutput } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useRequestStore, defaultRequest } from '@/stores/useRequestStore'
import { useUIStore } from '@/stores/useUIStore'
import { toast } from '@/stores/useToastStore'
import type { ContextMenuItem } from '@/components/common/ContextMenu'

export function useCollectionContextMenu(
  startEditing: (id: string, name: string) => void
) {
  const collections = useAppStore((state) => state.collections)
  const duplicateCollection = useAppStore((state) => state.duplicateCollection)
  const addRequestToCollection = useAppStore((state) => state.addRequestToCollection)
  const deleteCollection = useAppStore((state) => state.deleteCollection)
  const duplicateRequest = useAppStore((state) => state.duplicateRequest)
  const deleteRequestFromCollection = useAppStore((state) => state.deleteRequestFromCollection)
  const moveRequest = useAppStore((state) => state.moveRequest)
  const clipboardRequest = useAppStore((state) => state.clipboardRequest)
  const setClipboardRequest = useAppStore((state) => state.setClipboardRequest)
  const openTab = useRequestStore((state) => state.openTab)
  const addWorkflow = useAppStore((state) => state.addWorkflow)
  const setView = useUIStore((state) => state.setView)
  const setActiveWorkflowId = useAppStore((state) => state.setActiveWorkflowId)

  const getCollectionContextMenu = useCallback(
    (collectionId: string): ContextMenuItem[] => [
      {
        label: 'New Request',
        icon: <Plus size={12} />,
        shortcut: 'Ctrl+N',
        action: () => {
          const newReq = { ...defaultRequest, id: crypto.randomUUID(), name: 'New Request' }
          addRequestToCollection(collectionId, newReq)
          openTab(newReq, collectionId)
          setView('request')
          toast('success', 'Request created!')
        },
      },
      { label: '---' },
      {
        label: 'Rename',
        icon: <Edit3 size={12} />,
        shortcut: 'F2',
        action: () => {
          const coll = collections.find((c) => c.id === collectionId)
          if (coll) {
            startEditing(collectionId, coll.name)
          }
        },
      },
      {
        label: 'Duplicate',
        icon: <Copy size={12} />,
        shortcut: 'Ctrl+D',
        action: () => duplicateCollection(collectionId),
      },
      { label: '---' },
      {
        label: 'Paste Request',
        icon: <ClipboardPaste size={12} />,
        shortcut: 'Ctrl+V',
        disabled: !clipboardRequest,
        action: () => {
          if (clipboardRequest) {
            addRequestToCollection(collectionId, { ...clipboardRequest, id: crypto.randomUUID() })
            toast('success', 'Request pasted!')
          }
        },
      },
      { label: '---' },
      {
        label: 'Export',
        icon: <FileOutput size={12} />,
        action: async () => {
          const coll = collections.find((c) => c.id === collectionId)
          if (coll) {
            await navigator.clipboard.writeText(JSON.stringify([coll], null, 2))
            toast('success', 'Collection exported to clipboard!')
          }
        },
      },
      { label: '---' },
      {
        label: 'Delete',
        icon: <Trash2 size={12} />,
        shortcut: 'Del',
        danger: true,
        action: () => deleteCollection(collectionId),
      },
    ],
    [collections, clipboardRequest, duplicateCollection, addRequestToCollection, deleteCollection, startEditing, openTab, setView]
  )

  const getRequestContextMenu = useCallback(
    (collectionId: string, requestId: string): ContextMenuItem[] => {
      const otherCollections = collections.filter((c) => c.id !== collectionId)
      return [
        {
          label: 'Rename',
          icon: <Edit3 size={12} />,
          shortcut: 'F2',
          action: () => {
            const coll = collections.find((c) => c.id === collectionId)
            const req = coll?.requests.find((r) => r.id === requestId)
            if (req) startEditing(requestId, req.name)
          },
        },
        {
          label: 'Duplicate',
          icon: <Copy size={12} />,
          shortcut: 'Ctrl+D',
          action: () => duplicateRequest(collectionId, requestId),
        },
        {
          label: 'Open in New Tab',
          icon: <Plus size={12} />,
          shortcut: 'Ctrl+Enter',
          action: () => {
            const coll = collections.find((c) => c.id === collectionId)
            const req = coll?.requests.find((r) => r.id === requestId)
            if (req) {
              openTab({ ...req, id: crypto.randomUUID() }, collectionId)
              setView('request')
            }
          },
        },
        {
          label: 'Add to Workflow',
          icon: <GitFork size={12} />,
          action: () => {
            const coll = collections.find((c) => c.id === collectionId)
            const req = coll?.requests.find((r) => r.id === requestId)
            if (req) {
              const wfId = addWorkflow(`${req.name} Workflow`)
              setActiveWorkflowId(wfId)
              setView('workflow')
              toast('success', 'Added to workflow!')
            }
          },
        },
        {
          label: 'Copy',
          icon: <Copy size={12} />,
          shortcut: 'Ctrl+C',
          action: () => {
            const coll = collections.find((c) => c.id === collectionId)
            const req = coll?.requests.find((r) => r.id === requestId)
            if (req) {
              setClipboardRequest(req)
              toast('success', 'Request copied!')
            }
          },
        },
        ...(otherCollections.length > 0
          ? [
            {
              label: 'Move to',
              icon: <FolderOpen size={12} />,
              submenu: otherCollections.map((c) => ({
                label: c.name,
                action: () => {
                  moveRequest(
                    { collectionId, requestId },
                    { collectionId: c.id }
                  )
                  toast('success', `Moved to ${c.name}`)
                },
              })),
            },
          ]
          : []),
        { label: '---' },
        {
          label: 'Delete',
          icon: <Trash2 size={12} />,
          shortcut: 'Del',
          danger: true,
          action: () => deleteRequestFromCollection(collectionId, requestId),
        },
      ]
    },
    [collections, duplicateRequest, setClipboardRequest, moveRequest, deleteRequestFromCollection, startEditing, openTab, addWorkflow, setView, setActiveWorkflowId]
  )

  return { getCollectionContextMenu, getRequestContextMenu }
}
