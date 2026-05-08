import { createContext, useContext } from 'react'
import type { RequestData } from '@/types'
import type { SelectedItem } from '@/components/layout/sidebar/SidebarCollectionItem'

interface CollectionItemContextValue {
  selected: SelectedItem
  editingId: string | null
  editValue: string
  onEditChange: (v: string) => void
  onEditCommit: () => void
  onEditCancel: () => void
  onLoadRequest: (req: RequestData) => void
  onCopyRequest: (req: RequestData) => void
  onPasteRequest: () => void
  clipboardRequest: RequestData | null
  onRequestDoubleClickName: (reqId: string, reqName: string) => void
  onRequestContextMenu: (e: React.MouseEvent, req: RequestData) => void
  onDeleteRequest: (reqId: string) => void
}

export const CollectionItemContext = createContext<CollectionItemContextValue | null>(null)

export function useCollectionItemContext() {
  const ctx = useContext(CollectionItemContext)
  if (!ctx) throw new Error('useCollectionItemContext must be used within CollectionItemContext.Provider')
  return ctx
}
