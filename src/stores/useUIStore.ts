import { create } from 'zustand'
import type { ViewType } from '@/types'

interface UIState {
  view: ViewType
  setView: (view: ViewType) => void

  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  codeGenOpen: boolean
  setCodeGenOpen: (open: boolean) => void

  importDialogOpen: boolean
  setImportDialogOpen: (open: boolean) => void

  diffDialogOpen: boolean
  setDiffDialogOpen: (open: boolean) => void
  diffData: { left: string; right: string; leftName: string; rightName: string } | null
  setDiffData: (data: { left: string; right: string; leftName: string; rightName: string } | null) => void

  newDataTableDialogOpen: boolean
  setNewDataTableDialogOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  view: 'request',
  setView: (view) => set({ view }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  codeGenOpen: false,
  setCodeGenOpen: (open) => set({ codeGenOpen: open }),

  importDialogOpen: false,
  setImportDialogOpen: (open) => set({ importDialogOpen: open }),

  diffDialogOpen: false,
  setDiffDialogOpen: (open) => set({ diffDialogOpen: open }),
  diffData: null,
  setDiffData: (data) => set({ diffData: data }),

  newDataTableDialogOpen: false,
  setNewDataTableDialogOpen: (open) => set({ newDataTableDialogOpen: open }),
}))
