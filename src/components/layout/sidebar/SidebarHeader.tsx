import type { JSX } from 'react'

interface SidebarHeaderProps {
  collapsed: boolean
}

export default function SidebarHeader({ collapsed }: SidebarHeaderProps): JSX.Element {
  return (
    <div className="sidebar-header">
      <div className="sidebar-logo">
        {!collapsed && <span>Workspace</span>}
      </div>
    </div>
  )
}
