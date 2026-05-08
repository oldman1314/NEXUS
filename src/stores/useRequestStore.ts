import { create } from 'zustand'
import type { RequestData, ResponseData } from '@/types'

export interface RequestTab {
  id: string
  request: RequestData
  collectionId: string | null
  response: ResponseData | null
  isDirty: boolean
}

interface RequestState {
  activeRequest: RequestData | null
  setActiveRequest: (request: RequestData | null) => void
  updateActiveRequest: (updates: Partial<RequestData>) => void
  resetActiveRequest: () => void
  activeCollectionId: string | null
  setActiveCollectionId: (id: string | null) => void

  isDirty: boolean
  markClean: () => void

  tabs: RequestTab[]
  activeTabId: string | null
  openTab: (request: RequestData, collectionId: string | null) => void
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  updateActiveTab: (updates: Partial<RequestData>) => void
  saveActiveTab: () => void

  requestTimeout: number
  setRequestTimeout: (timeout: number) => void

  response: ResponseData | null
  setResponse: (response: ResponseData | null) => void

  lastScriptVariables: Record<string, unknown>
  setLastScriptVariables: (variables: Record<string, unknown>) => void
}

export const defaultRequest: RequestData = {
  id: 'default',
  name: 'New Request',
  method: 'GET',
  url: '',
  params: [],
  headers: [],
  bodyType: 'none',
  bodyRaw: '',
  formData: [],
  urlEncodedData: [],
  authType: 'none',
  authConfig: {},
  preRequestScript: '',
  testScript: '',
  savedResponses: [],
}

function syncActiveFromTab(tab: RequestTab): Partial<RequestState> {
  return {
    activeRequest: tab.request,
    activeCollectionId: tab.collectionId,
    response: tab.response,
    isDirty: tab.isDirty,
  }
}

export const useRequestStore = create<RequestState>()((set, get) => ({
  activeRequest: null,
  setActiveRequest: (request) => {
    const currentTab = get().tabs.find((t) => t.id === get().activeTabId)
    if (currentTab && request) {
      const updatedTabs = get().tabs.map((t) =>
        t.id === currentTab.id
          ? { ...t, request, isDirty: false, response: null }
          : t
      )
      set({
        tabs: updatedTabs,
        activeRequest: request,
        activeCollectionId: currentTab.collectionId,
        response: null,
        isDirty: false,
      })
    } else {
      set({ activeRequest: request, isDirty: false })
    }
  },
  updateActiveRequest: (updates) => {
    const current = get().activeRequest
    if (current) {
      const updated = { ...current, ...updates }
      const state = get()
      const updatedTabs = state.tabs.map((t) =>
        t.id === state.activeTabId
          ? { ...t, request: updated, isDirty: true }
          : t
      )
      set({ activeRequest: updated, isDirty: true, tabs: updatedTabs })
    }
  },
  resetActiveRequest: () => {
    set({
      activeRequest: { ...defaultRequest, id: crypto.randomUUID() },
      response: null,
      activeCollectionId: null,
      isDirty: false,
    })
  },
  activeCollectionId: null,
  setActiveCollectionId: (id) => set({ activeCollectionId: id }),

  isDirty: false,
  markClean: () => {
    const state = get()
    const updatedTabs = state.tabs.map((t) =>
      t.id === state.activeTabId ? { ...t, isDirty: false } : t
    )
    set({ isDirty: false, tabs: updatedTabs })
  },

  tabs: [],
  activeTabId: null,

  openTab: (request, collectionId) => {
    const state = get()
    const existing = state.tabs.find(
      (t) => t.request.id === request.id && t.collectionId === collectionId
    )
    if (existing) {
      set({ ...syncActiveFromTab(existing), activeTabId: existing.id })
      return
    }
    const tab: RequestTab = {
      id: crypto.randomUUID(),
      request,
      collectionId,
      response: null,
      isDirty: false,
    }
    set({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
      ...syncActiveFromTab(tab),
    })
  },

  closeTab: (tabId) => {
    const state = get()
    const nextTabs = state.tabs.filter((t) => t.id !== tabId)
    if (nextTabs.length === 0) {
      set({
        tabs: [],
        activeTabId: null,
        activeRequest: null,
        activeCollectionId: null,
        response: null,
        isDirty: false,
      })
      return
    }
    const activeTab = state.activeTabId === tabId
      ? nextTabs[nextTabs.length - 1]
      : nextTabs.find((t) => t.id === state.activeTabId) || nextTabs[nextTabs.length - 1]
    set({
      tabs: nextTabs,
      activeTabId: activeTab.id,
      ...syncActiveFromTab(activeTab),
    })
  },

  switchTab: (tabId) => {
    const tab = get().tabs.find((t) => t.id === tabId)
    if (!tab) return
    set({ activeTabId: tabId, ...syncActiveFromTab(tab) })
  },

  updateActiveTab: (updates) => {
    const state = get()
    const updatedTabs = state.tabs.map((t) =>
      t.id === state.activeTabId
        ? { ...t, request: { ...t.request, ...updates }, isDirty: true }
        : t
    )
    const current = state.activeRequest
    if (current) {
      set({
        activeRequest: { ...current, ...updates },
        isDirty: true,
        tabs: updatedTabs,
      })
    }
  },

  saveActiveTab: () => {
    const state = get()
    const updatedTabs = state.tabs.map((t) =>
      t.id === state.activeTabId ? { ...t, isDirty: false } : t
    )
    set({ isDirty: false, tabs: updatedTabs })
  },

  requestTimeout: 30000,
  setRequestTimeout: (timeout) => set({ requestTimeout: timeout }),

  response: null,
  setResponse: (response) => {
    const state = get()
    const updatedTabs = state.tabs.map((t) =>
      t.id === state.activeTabId ? { ...t, response } : t
    )
    set({ response, tabs: updatedTabs })
  },

  lastScriptVariables: {},
  setLastScriptVariables: (variables) => set({ lastScriptVariables: variables }),
}))
