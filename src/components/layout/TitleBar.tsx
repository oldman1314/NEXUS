import { useCallback } from 'react'
import { useRequestStore } from '@/stores/useRequestStore'
import { useUIStore } from '@/stores/useUIStore'
import AppMenu from './titlebar/AppMenu'
import ContextArea from './titlebar/ContextArea'
import ToolbarArea from './titlebar/ToolbarArea'
import DroneBar from './titlebar/DroneBar'
import CircuitBar from './titlebar/CircuitBar'
import DataPulseBar from './titlebar/DataPulseBar'
import WarpTunnelBar from './titlebar/WarpTunnelBar'
import PerfMonitor from './titlebar/PerfMonitor'
import './title-bar.css'

export default function TitleBar() {
  const updateActiveRequest = useRequestStore((s) => s.updateActiveRequest)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const view = useUIStore((s) => s.view)

  const handleCommandPaletteOpen = useCallback(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }, [])

  const handleRequestRename = useCallback((name: string) => {
    updateActiveRequest({ name })
  }, [updateActiveRequest])

  const renderCreativeBar = () => {
    switch (view) {
      case 'workflow':
        return <CircuitBar />
      case 'data-table':
        return <DataPulseBar />
      case 'remote-tools':
        return <WarpTunnelBar />
      default:
        return <DroneBar />
    }
  }

  return (
    <div className={`title-bar ${sidebarCollapsed ? 'title-bar--collapsed' : ''}`}>
      <div className="title-bar__left">
        <AppMenu />
        <ContextArea
          onRequestRename={handleRequestRename}
        />
      </div>
      {renderCreativeBar()}
      <div className="title-bar__right">
        <ToolbarArea onCommandPaletteOpen={handleCommandPaletteOpen} />
      </div>
      <PerfMonitor />
    </div>
  )
}
