import { useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from '@/stores/useToastStore'
import type { SelectedItem } from '@/components/layout/sidebar/SidebarCollectionItem'

export function useCollectionKeyboard(
  selected: SelectedItem | null,
  editingId: string | null,
  startEditing: (id: string, name: string) => void,
  setSelected: (item: SelectedItem | null) => void
) {
  const collections = useAppStore((state) => state.collections)
  const deleteCollection = useAppStore((state) => state.deleteCollection)
  const deleteRequestFromCollection = useAppStore((state) => state.deleteRequestFromCollection)
  const duplicateCollection = useAppStore((state) => state.duplicateCollection)
  const duplicateRequest = useAppStore((state) => state.duplicateRequest)
  const addRequestToCollection = useAppStore((state) => state.addRequestToCollection)
  const clipboardRequest = useAppStore((state) => state.clipboardRequest)
  const setClipboardRequest = useAppStore((state) => state.setClipboardRequest)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId) return
      if (!selected) return
      const isMod = e.ctrlKey || e.metaKey

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        if (selected.type === 'collection') {
          deleteCollection(selected.id)
        } else if (selected.type === 'request') {
          deleteRequestFromCollection(selected.collectionId, selected.id)
        }
        setSelected(null)
      } else if (e.key === 'F2') {
        e.preventDefault()
        if (selected.type === 'collection') {
          const coll = collections.find((c) => c.id === selected.id)
          if (coll) startEditing(selected.id, coll.name)
        } else if (selected.type === 'request') {
          const coll = collections.find((c) => c.id === selected.collectionId)
          const req = coll?.requests.find((r) => r.id === selected.id)
          if (req) startEditing(selected.id, req.name)
        }
      } else if (isMod && e.key === 'c' && selected.type === 'request') {
        e.preventDefault()
        const coll = collections.find((c) => c.id === selected.collectionId)
        const req = coll?.requests.find((r) => r.id === selected.id)
        if (req) {
          setClipboardRequest(req)
          toast('success', 'Request copied!')
        }
      } else if (isMod && e.key === 'v' && selected) {
        e.preventDefault()
        if (clipboardRequest) {
          let targetCollectionId = ''
          if (selected.type === 'collection') {
            targetCollectionId = selected.id
          } else if (selected.type === 'request') {
            targetCollectionId = selected.collectionId
          }
          if (targetCollectionId) {
            addRequestToCollection(targetCollectionId, {
              ...clipboardRequest,
              id: crypto.randomUUID(),
            })
            toast('success', 'Request pasted!')
          }
        }
      } else if (isMod && e.key === 'd') {
        e.preventDefault()
        if (selected.type === 'request') {
          duplicateRequest(selected.collectionId, selected.id)
        } else if (selected.type === 'collection') {
          duplicateCollection(selected.id)
        }
      } else if (e.key === 'Escape') {
        setSelected(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selected, editingId, collections, clipboardRequest, deleteCollection, deleteRequestFromCollection, setClipboardRequest, addRequestToCollection, duplicateRequest, duplicateCollection, startEditing, setSelected])
}
