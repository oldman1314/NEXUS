import { createJSONStorage, type StateStorage } from 'zustand/middleware'

const isElectron = !!window.electronAPI

const memoryStore: Record<string, string> = {}

const writeQueue = new Map<string, ReturnType<typeof setTimeout>>()

const electronStorage: StateStorage = {
  getItem: async (name: string) => {
    try {
      const data = await window.electronAPI!.storeGet(name)
      return data ? JSON.stringify(data) : null
    } catch {
      return memoryStore[name] ?? null
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      const existing = writeQueue.get(name)
      if (existing) clearTimeout(existing)
      writeQueue.set(name, setTimeout(async () => {
        writeQueue.delete(name)
        try {
          await window.electronAPI!.storeSet(name, JSON.parse(value))
        } catch {
          memoryStore[name] = value
        }
      }, 300))
    } catch {
      memoryStore[name] = value
    }
  },
  removeItem: async (name: string) => {
    const existing = writeQueue.get(name)
    if (existing) {
      clearTimeout(existing)
      writeQueue.delete(name)
    }
    try {
      await window.electronAPI!.storeSet(name, null)
    } catch {
      delete memoryStore[name]
    }
  },
}

export const storage = createJSONStorage(() =>
  isElectron ? electronStorage : localStorage
)
