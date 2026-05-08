import { useUIStore } from '@/stores/useUIStore'
import { useAppStore } from '@/stores/useAppStore'
import { useRequestStore } from '@/stores/useRequestStore'
import Breadcrumb from './Breadcrumb'
import { GitBranch, Table2, Terminal } from 'lucide-react'
import type { ViewType } from '@/types'
import './context-area.css'

interface ContextAreaProps {
  onRequestRename: (name: string) => void
}

export default function ContextArea({ onRequestRename }: ContextAreaProps) {
  const view = useUIStore((s) => s.view) as ViewType
  const collections = useAppStore((s) => s.collections)
  const request = useRequestStore((s) => s.activeRequest)
  const activeCollectionId = useRequestStore((s) => s.activeCollectionId)

  if (view === 'request') {
    return (
      <div className="tb-context-area tb-context-area--visible" style={{ display: 'var(--tb-show-context)' }}>
        <Breadcrumb
          collections={collections}
          request={request}
          activeCollectionId={activeCollectionId}
          onRequestRename={onRequestRename}
        />
      </div>
    )
  }

  if (view === 'workflow') {
    return (
      <div className="tb-context-area tb-context-area--visible" style={{ display: 'var(--tb-show-context)' }}>
        <GitBranch size={14} className="tb-context-icon" />
        <span className="tb-context-label">Workflow View</span>
      </div>
    )
  }

  if (view === 'data-table') {
    return (
      <div className="tb-context-area tb-context-area--visible" style={{ display: 'var(--tb-show-context)' }}>
        <Table2 size={14} className="tb-context-icon" />
        <span className="tb-context-label">Data Table</span>
      </div>
    )
  }

  if (view === 'remote-tools') {
    return (
      <div className="tb-context-area tb-context-area--visible" style={{ display: 'var(--tb-show-context)' }}>
        <Terminal size={14} className="tb-context-icon" />
        <span className="tb-context-label">Remote Tools</span>
      </div>
    )
  }

  return null
}
