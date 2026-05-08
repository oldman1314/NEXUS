import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'
import './sidebar-footer.css'

interface SidebarFooterProps {
  collapsed: boolean
  onToggle: () => void
}

export default function SidebarFooter({ collapsed, onToggle }: SidebarFooterProps) {
  return (
    <div className="sidebar-footer">
      <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
        <button className="sidebar-toggle-area" onClick={onToggle}>
          <span className="toggle-area-icon">
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </span>
          {!collapsed && <span className="toggle-area-label">Collapse</span>}
        </button>
      </Tooltip>
    </div>
  )
}
