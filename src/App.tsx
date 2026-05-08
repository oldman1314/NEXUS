import { lazy, Suspense } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import Sidebar from './components/layout/Sidebar'
import TitleBar from './components/layout/TitleBar'
import DarkModeStars from './components/common/DarkModeStars'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import './styles/app.css'

const RequestView = lazy(() => import('./components/views/RequestView'))
const WorkflowView = lazy(() => import('./components/views/WorkflowView'))
const RemoteToolsView = lazy(() => import('./components/views/RemoteToolsView'))
const DataTableView = lazy(() => import('./components/data-table/DataTableView').then(m => ({ default: m.DataTableView })))

function ViewFallback() {
  return (
    <div className="view-loading">
      <div className="view-loading-spinner" />
    </div>
  )
}

function App() {
  const view = useUIStore((s) => s.view)
  useGlobalShortcuts()

  return (
    <div className="app">
      <DarkModeStars />
      <TitleBar />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <Suspense fallback={<ViewFallback />}>
            {view === 'request' && <RequestView />}
            {view === 'workflow' && <WorkflowView />}
            {view === 'data-table' && <DataTableView />}
            {view === 'remote-tools' && <RemoteToolsView />}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default App
