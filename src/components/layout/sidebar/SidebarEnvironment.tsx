import { useState, lazy, Suspense } from 'react'
import { Variable, Globe } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import Tooltip from '@/components/common/Tooltip'
import './sidebar-environment.css'

const EnvironmentDialog = lazy(() => import('@/components/dialogs/environment/EnvironmentDialog'))

export default function SidebarEnvironment() {
  const [envDialogOpen, setEnvDialogOpen] = useState(false)

  const activeEnv = useAppStore((state) =>
    state.environments.find((e) => e.id === state.activeEnvId)
  )

  return (
    <>
      <div className="sidebar-section sidebar-section-env">
        <div className="section-header">
          <span>Environment</span>
        </div>
        <div className="section-content">
          <Tooltip content="Manage environments">
            <div
              className="env-badge"
              onClick={() => setEnvDialogOpen(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Variable size={12} />
                <span>{activeEnv?.name || 'No Environment'}</span>
              </div>
              {activeEnv && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {activeEnv.baseUrl && (
                    <Tooltip content={`Base URL: ${activeEnv.baseUrl}`}>
                      <Globe size={10} style={{ color: 'var(--accent)' }} />
                    </Tooltip>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    {activeEnv.variables.length}
                  </span>
                </div>
              )}
            </div>
          </Tooltip>
        </div>
      </div>
      {envDialogOpen && <Suspense fallback={null}><EnvironmentDialog onClose={() => setEnvDialogOpen(false)} /></Suspense>}
    </>
  )
}
