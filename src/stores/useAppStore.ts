import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Collection, HistoryEntry, Environment, EnvironmentVariable, RequestData, Workflow } from '@/types'
import { storage } from '@/stores/storage'

interface LegacyEnvironmentVariable {
  id: string
  key: string
  value: string
  sensitive?: boolean
}

interface LegacyEnvironment {
  id?: string
  name: string
  variables: LegacyEnvironmentVariable[] | Record<string, string>
  sensitiveVars?: string[]
  color?: string
  baseUrl?: string
  baseUrlEnabled?: boolean
}

function migrateEnvironment(env: LegacyEnvironment | null): Environment {
  if (!env) return { id: 'default', name: 'Default', variables: [] }
  if (Array.isArray(env.variables)) {
    const baseUrlVar = (env.variables as LegacyEnvironmentVariable[]).find((v) => v.key === 'base_url')
    const result: Environment = { ...env } as Environment
    if (baseUrlVar && !env.baseUrl) {
      result.baseUrl = baseUrlVar.value
      result.baseUrlEnabled = true
      result.variables = (env.variables as LegacyEnvironmentVariable[]).filter((v) => v.key !== 'base_url')
    }
    if (result.baseUrl && result.baseUrlEnabled === undefined) {
      result.baseUrlEnabled = true
    }
    return result
  }
  const oldVars: Record<string, string> = env.variables || {}
  const oldSensitive: string[] = env.sensitiveVars || []
  const sensitiveSet = new Set(oldSensitive)
  const variables: EnvironmentVariable[] = Object.entries(oldVars)
    .filter(([key]) => key !== 'base_url')
    .map(([key, value]) => ({
      id: crypto.randomUUID(),
      key,
      value,
      sensitive: sensitiveSet.has(key),
    }))
  const result: Environment = { id: env.id || 'default', name: env.name, variables }
  if (env.color) result.color = env.color
  if (oldVars.base_url) {
    result.baseUrl = oldVars.base_url
    result.baseUrlEnabled = true
  }
  return result
}

interface AppState {
  collections: Collection[]
  addCollection: (name: string) => string
  deleteCollection: (id: string) => void
  updateCollection: (id: string, updates: Partial<Collection>) => void
  duplicateCollection: (id: string) => void
  reorderCollections: (fromIndex: number, toIndex: number) => void
  addRequestToCollection: (collectionId: string, request: RequestData) => void
  deleteRequestFromCollection: (collectionId: string, requestId: string) => void
  updateRequestInCollection: (collectionId: string, requestId: string, updates: Partial<RequestData>) => void
  duplicateRequest: (collectionId: string, requestId: string) => void
  moveRequest: (from: { collectionId: string; requestId: string }, to: { collectionId: string; index?: number }) => void
  reorderRequests: (collectionId: string, fromIndex: number, toIndex: number) => void
  clipboardRequest: RequestData | null
  setClipboardRequest: (request: RequestData | null) => void

  history: HistoryEntry[]
  addHistory: (entry: HistoryEntry) => void
  clearHistory: () => void
  deleteHistoryEntry: (id: string) => void
  toggleStarHistory: (id: string) => void

  environments: Environment[]
  activeEnvId: string | null
  setActiveEnv: (id: string | null) => void
  addEnvironment: (name: string) => void
  deleteEnvironment: (id: string) => void
  updateEnvironment: (id: string, updates: Partial<Environment>) => void
  duplicateEnvironment: (id: string) => void

  workflows: Workflow[]
  addWorkflow: (name: string, nodes?: Workflow['nodes'], edges?: Workflow['edges']) => string
  deleteWorkflow: (id: string) => void
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void

  activeWorkflowId: string | null
  setActiveWorkflowId: (id: string | null) => void

  exportCollections: () => string
  importCollections: (json: string) => boolean
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      collections: [],
      addCollection: (name) => {
        const collection: Collection = {
          id: crypto.randomUUID(),
          name,
          requests: [],
          createdAt: new Date().toISOString(),
        }
        set({ collections: [...get().collections, collection] })
        return collection.id
      },
      deleteCollection: (id) => {
        set({ collections: get().collections.filter((c) => c.id !== id) })
      },
      updateCollection: (id, updates) => {
        set({
          collections: get().collections.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })
      },
      duplicateCollection: (id) => {
        const coll = get().collections.find((c) => c.id === id)
        if (!coll) return
        const newColl: Collection = {
          id: crypto.randomUUID(),
          name: `${coll.name} (Copy)`,
          requests: coll.requests.map((r) => ({ ...r, id: crypto.randomUUID() })),
          createdAt: new Date().toISOString(),
        }
        set({ collections: [...get().collections, newColl] })
      },
      reorderCollections: (fromIndex, toIndex) => {
        const cols = [...get().collections]
        const [moved] = cols.splice(fromIndex, 1)
        cols.splice(toIndex, 0, moved)
        set({ collections: cols })
      },
      addRequestToCollection: (collectionId, request) => {
        set({
          collections: get().collections.map((c) =>
            c.id === collectionId ? { ...c, requests: [...c.requests, request] } : c
          ),
        })
      },
      deleteRequestFromCollection: (collectionId, requestId) => {
        set({
          collections: get().collections.map((c) =>
            c.id === collectionId
              ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
              : c
          ),
        })
      },
      updateRequestInCollection: (collectionId, requestId, updates) => {
        set({
          collections: get().collections.map((c) =>
            c.id === collectionId
              ? { ...c, requests: c.requests.map((r) => r.id === requestId ? { ...r, ...updates } : r) }
              : c
          ),
        })
      },
      duplicateRequest: (collectionId, requestId) => {
        const coll = get().collections.find((c) => c.id === collectionId)
        if (!coll) return
        const req = coll.requests.find((r) => r.id === requestId)
        if (!req) return
        const idx = coll.requests.indexOf(req)
        const newReq: RequestData = { ...req, id: crypto.randomUUID(), name: `${req.name} (Copy)` }
        const newRequests = [...coll.requests]
        newRequests.splice(idx + 1, 0, newReq)
        set({
          collections: get().collections.map((c) =>
            c.id === collectionId ? { ...c, requests: newRequests } : c
          ),
        })
      },
      moveRequest: (from, to) => {
        const srcColl = get().collections.find((c) => c.id === from.collectionId)
        if (!srcColl) return
        const req = srcColl.requests.find((r) => r.id === from.requestId)
        if (!req) return
        const movedReq = { ...req, id: crypto.randomUUID() }
        set({
          collections: get().collections.map((c) => {
            if (c.id === from.collectionId) {
              return { ...c, requests: c.requests.filter((r) => r.id !== from.requestId) }
            }
            if (c.id === to.collectionId) {
              const requests = [...c.requests]
              const idx = to.index ?? requests.length
              requests.splice(idx, 0, movedReq)
              return { ...c, requests }
            }
            return c
          }),
        })
      },
      reorderRequests: (collectionId, fromIndex, toIndex) => {
        set({
          collections: get().collections.map((c) => {
            if (c.id !== collectionId) return c
            const requests = [...c.requests]
            const [moved] = requests.splice(fromIndex, 1)
            requests.splice(toIndex, 0, moved)
            return { ...c, requests }
          }),
        })
      },
      clipboardRequest: null,
      setClipboardRequest: (request) => set({ clipboardRequest: request }),

      history: [],
      addHistory: (entry) => {
        const list = [entry, ...get().history]
        if (list.length > 100) list.pop()
        set({ history: list })
      },
      clearHistory: () => set({ history: [] }),
      deleteHistoryEntry: (id) => {
        set({ history: get().history.filter((h) => h.id !== id) })
      },
      toggleStarHistory: (id) => {
        set({
          history: get().history.map((h) =>
            h.id === id ? { ...h, starred: !h.starred } : h
          ),
        })
      },

      environments: [{ id: 'default', name: 'Default', variables: [] }],
      activeEnvId: 'default',
      setActiveEnv: (id) => set({ activeEnvId: id }),
      addEnvironment: (name) => {
        const envColors = ['#4A90D9', '#50C878', '#D97A4A', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12', '#3498DB']
        const usedColors = new Set(get().environments.map((e) => e.color).filter(Boolean))
        const availableColor = envColors.find((c) => !usedColors.has(c)) || envColors[Math.floor(Math.random() * envColors.length)]

        const env: Environment = {
          id: crypto.randomUUID(),
          name,
          variables: [],
          color: availableColor,
        }
        set({ environments: [...get().environments, env] })
      },
      deleteEnvironment: (id) => {
        if (id === 'default') return
        set({
          environments: get().environments.filter((e) => e.id !== id),
          activeEnvId: get().activeEnvId === id ? 'default' : get().activeEnvId,
        })
      },
      updateEnvironment: (id, updates) => {
        set({
          environments: get().environments.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })
      },
      duplicateEnvironment: (id) => {
        const env = get().environments.find((e) => e.id === id)
        if (!env) return
        const newEnv: Environment = {
          id: crypto.randomUUID(),
          name: `${env.name} (Copy)`,
          variables: env.variables.map((v) => ({ ...v, id: crypto.randomUUID() })),
          color: env.color,
          baseUrl: env.baseUrl,
          baseUrlEnabled: env.baseUrlEnabled,
        }
        set({ environments: [...get().environments, newEnv] })
      },

      workflows: [],
      addWorkflow: (name, nodes = [], edges = []): string => {
        const id = crypto.randomUUID()
        const workflow: Workflow = {
          id,
          name,
          description: '',
          nodes,
          edges,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set({ workflows: [...get().workflows, workflow] })
        return id
      },
      deleteWorkflow: (id) => {
        set({ workflows: get().workflows.filter((w) => w.id !== id) })
      },
      updateWorkflow: (id, updates) => {
        set({
          workflows: get().workflows.map((w) =>
            w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
          ),
        })
      },

      activeWorkflowId: null,
      setActiveWorkflowId: (id) => set({ activeWorkflowId: id }),

      exportCollections: () => {
        const data = {
          collections: get().collections,
          environments: get().environments,
          workflows: get().workflows,
          version: '1.0',
          exportedAt: new Date().toISOString(),
        }
        return JSON.stringify(data, null, 2)
      },
      importCollections: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.collections && Array.isArray(data.collections)) {
            set({ collections: data.collections })
          }
          if (data.environments && Array.isArray(data.environments)) {
            set({ environments: data.environments })
          }
          if (data.workflows && Array.isArray(data.workflows)) {
            set({ workflows: data.workflows })
          }
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'app-storage',
      storage,
      partialize: (state) => ({
        collections: state.collections,
        history: state.history,
        environments: state.environments,
        activeEnvId: state.activeEnvId,
        workflows: state.workflows,
        activeWorkflowId: state.activeWorkflowId,
      }),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<AppState>) }
        if (merged.environments) {
          merged.environments = merged.environments.map(migrateEnvironment)
        }
        return merged
      },
    }
  )
)
