import { useUIStore } from '@/stores/useUIStore'
import SidebarHeader from './sidebar/SidebarHeader'
import SidebarNav from './sidebar/SidebarNav'
import SidebarCollections from './sidebar/SidebarCollections'
import SidebarRecent from './sidebar/SidebarRecent'
import SidebarHistory from './sidebar/SidebarHistory'
import SidebarWorkflows from './sidebar/SidebarWorkflows'
import SidebarDataTable from './sidebar/SidebarDataTable'
import SidebarRemoteTools from './sidebar/SidebarRemoteTools'
import SidebarFooter from './sidebar/SidebarFooter'
import SidebarWisdom from './sidebar/SidebarWisdom'
import './sidebar/sidebar-base.css'
import './sidebar/sidebar-header.css'
import './sidebar/sidebar-nav.css'
import './sidebar/sidebar-footer.css'

export default function Sidebar() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const view = useUIStore((state) => state.view)
  const setView = useUIStore((state) => state.setView)

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <SidebarHeader collapsed={sidebarCollapsed} />
      <SidebarNav view={view} collapsed={sidebarCollapsed} setView={setView} />
      {!sidebarCollapsed && (
        <>
          {view === 'request' ? (
            <>
              <SidebarCollections />
              <SidebarRecent />
              <SidebarHistory />
            </>
          ) : view === 'workflow' ? (
            <SidebarWorkflows />
          ) : view === 'data-table' ? (
            <SidebarDataTable />
          ) : view === 'remote-tools' ? (
            <SidebarRemoteTools />
          ) : null}
        </>
      )}
      {sidebarCollapsed && <SidebarWisdom />}
      <SidebarFooter collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
    </aside>
  )
}
