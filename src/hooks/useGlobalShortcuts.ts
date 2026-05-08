import { useEffect } from 'react'
import { useRequestStore } from '@/stores/useRequestStore'
import { useAppStore } from '@/stores/useAppStore'
import { useUIStore } from '@/stores/useUIStore'
import { toast } from '@/stores/useToastStore'

export function useGlobalShortcuts() {
  const openTab = useRequestStore((s) => s.openTab)
  const closeTab = useRequestStore((s) => s.closeTab)
  const activeRequest = useRequestStore((s) => s.activeRequest)
  const activeCollectionId = useRequestStore((s) => s.activeCollectionId)
  const isDirty = useRequestStore((s) => s.isDirty)
  const markClean = useRequestStore((s) => s.markClean)
  const tabs = useRequestStore((s) => s.tabs)
  const activeTabId = useRequestStore((s) => s.activeTabId)

  const collections = useAppStore((s) => s.collections)
  const addCollection = useAppStore((s) => s.addCollection)
  const addRequestToCollection = useAppStore((s) => s.addRequestToCollection)
  const updateRequestInCollection = useAppStore((s) => s.updateRequestInCollection)

  const setView = useUIStore((s) => s.setView)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        const newId = crypto.randomUUID()
        const newRequest = {
          id: newId,
          name: 'New Request',
          method: 'GET' as const,
          url: '',
          params: [] as never[],
          headers: [] as never[],
          bodyType: 'none' as const,
          bodyRaw: '',
          formData: [] as never[],
          urlEncodedData: [] as never[],
          authType: 'none' as const,
          authConfig: {},
          preRequestScript: '',
          testScript: '',
          savedResponses: [] as never[],
        }
        const existingScratchpad = collections.find((c) => c.name === 'Scratchpad')
        const scratchpadId = existingScratchpad
          ? existingScratchpad.id
          : addCollection('Scratchpad')
        addRequestToCollection(scratchpadId, newRequest)
        openTab(newRequest, scratchpadId)
        setView('request')
      }

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        if (!activeRequest || !activeCollectionId || !isDirty) return
        updateRequestInCollection(activeCollectionId, activeRequest.id, activeRequest)
        markClean()
        toast('success', 'Request saved!')
      }

      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        if (tabs.length > 0 && activeTabId) {
          closeTab(activeTabId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    openTab, closeTab, activeRequest, activeCollectionId, isDirty, markClean,
    tabs, activeTabId, collections, addCollection, addRequestToCollection,
    updateRequestInCollection, setView,
  ])
}
