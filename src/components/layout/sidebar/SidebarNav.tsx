import { Send, GitBranch, Table2, Monitor } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'

interface SidebarNavProps {
  view: string
  collapsed: boolean
  setView: (view: 'request' | 'workflow' | 'data-table' | 'remote-tools') => void
}

export default function SidebarNav({ view, collapsed, setView }: SidebarNavProps) {
  return (
    <nav className="sidebar-nav">
      <Tooltip content="Requests" placement="right" shortcut="⌘1">
        <button
          className={`nav-item ${view === 'request' ? 'active' : ''}`}
          onClick={() => setView('request')}
        >
          <Send size={16} />
          {!collapsed && (
            <>
              <span>Requests</span>
              <span className="nav-shortcut">⌘1</span>
            </>
          )}
        </button>
      </Tooltip>
      <Tooltip content="Workflow" placement="right" shortcut="⌘2">
        <button
          className={`nav-item ${view === 'workflow' ? 'active' : ''}`}
          onClick={() => setView('workflow')}
        >
          <GitBranch size={16} />
          {!collapsed && (
            <>
              <span>Workflow</span>
              <span className="nav-shortcut">⌘2</span>
            </>
          )}
        </button>
      </Tooltip>
      <Tooltip content="Data Table" placement="right" shortcut="⌘3">
        <button
          className={`nav-item ${view === 'data-table' ? 'active' : ''}`}
          onClick={() => setView('data-table')}
        >
          <Table2 size={16} />
          {!collapsed && (
            <>
              <span>Data Table</span>
              <span className="nav-shortcut">⌘3</span>
            </>
          )}
        </button>
      </Tooltip>
      <Tooltip content="Remote Tools" placement="right" shortcut="⌘4">
        <button
          className={`nav-item nav-item--remote-tools ${view === 'remote-tools' ? 'active' : ''}`}
          onClick={() => setView('remote-tools')}
        >
          <Monitor size={16} />
          {!collapsed && (
            <>
              <span>Remote Tools</span>
              <span className="nav-shortcut">⌘4</span>
            </>
          )}
        </button>
      </Tooltip>
    </nav>
  )
}
