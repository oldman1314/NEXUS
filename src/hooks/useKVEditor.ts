import { useCallback, useRef } from 'react'
import { useRequestStore } from '@/stores/useRequestStore'
import type { KVPair } from '@/types'

export function useKVEditor(field: 'params' | 'headers' | 'formData' | 'urlEncodedData') {
  const updateActiveRequest = useRequestStore((state) => state.updateActiveRequest)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const items = useRequestStore((state) => state.activeRequest?.[field] ?? [])

  const addKVPair = useCallback(() => {
    const request = useRequestStore.getState().activeRequest
    if (!request) return
    const newPair: KVPair = { key: '', value: '', enabled: true, id: crypto.randomUUID() }
    updateActiveRequest({ [field]: [...request[field], newPair] })
  }, [field, updateActiveRequest])

  const updateKVPair = useCallback(
    (index: number, updates: Partial<KVPair>) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        const request = useRequestStore.getState().activeRequest
        if (!request) return
        const list = [...request[field]]
        list[index] = { ...list[index], ...updates }
        updateActiveRequest({ [field]: list })
      }, 80)
    },
    [field, updateActiveRequest]
  )

  const removeKVPair = useCallback(
    (index: number) => {
      const request = useRequestStore.getState().activeRequest
      if (!request) return
      const list = [...request[field]]
      list.splice(index, 1)
      updateActiveRequest({ [field]: list })
    },
    [field, updateActiveRequest]
  )

  const setAllItems = useCallback(
    (newItems: KVPair[]) => {
      updateActiveRequest({ [field]: newItems })
    },
    [field, updateActiveRequest]
  )

  return {
    items,
    addKVPair,
    updateKVPair,
    removeKVPair,
    setAllItems,
  }
}
