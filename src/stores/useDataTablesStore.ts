import { create } from 'zustand'
import type { DataTable } from '@/types/data-table'

const STORAGE_KEY = 'dt-tables'

function loadTables(): DataTable[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function persistTables(tables: DataTable[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables))
  } catch {}
}

interface DataTablesStore {
  tables: DataTable[]
  activeTableId: string | null

  addTable: (table: DataTable) => void
  deleteTable: (id: string) => void
  updateTable: (id: string, updates: Partial<DataTable>) => void
  setActiveTable: (id: string | null) => void
}

export const useDataTablesStore = create<DataTablesStore>()((set) => ({
  tables: loadTables(),
  activeTableId: null,

  addTable: (table) =>
    set((state) => {
      const tables = [...state.tables, table]
      persistTables(tables)
      return { tables, activeTableId: table.id }
    }),

  deleteTable: (id) =>
    set((state) => {
      const tables = state.tables.filter((t) => t.id !== id)
      const activeTableId = state.activeTableId === id ? null : state.activeTableId
      persistTables(tables)
      return { tables, activeTableId }
    }),

  updateTable: (id, updates) =>
    set((state) => {
      const tables = state.tables.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      )
      persistTables(tables)
      return { tables }
    }),

  setActiveTable: (id) => set({ activeTableId: id }),
}))
