import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Variable } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import EnvSidebar from './EnvSidebar'
import EnvEditor from './EnvEditor'
import './environment-dialog.css'

interface EnvironmentDialogProps {
  onClose: () => void
}

export default function EnvironmentDialog({ onClose }: EnvironmentDialogProps) {
  const environments = useAppStore((state) => state.environments)
  const activeEnvId = useAppStore((state) => state.activeEnvId)
  const setActiveEnv = useAppStore((state) => state.setActiveEnv)
  const addEnvironment = useAppStore((state) => state.addEnvironment)
  const deleteEnvironment = useAppStore((state) => state.deleteEnvironment)
  const updateEnvironment = useAppStore((state) => state.updateEnvironment)
  const duplicateEnvironment = useAppStore((state) => state.duplicateEnvironment)

  const [selectedEnvId, setSelectedEnvId] = useState(activeEnvId || 'default')

  const selectedEnv = environments.find((e) => e.id === selectedEnvId)

  const handleAddEnvironment = (name: string) => {
    addEnvironment(name)
    const newEnvs = useAppStore.getState().environments
    const created = newEnvs[newEnvs.length - 1]
    if (created) {
      setSelectedEnvId(created.id)
    }
  }

  const handleDeleteEnvironment = (id: string) => {
    deleteEnvironment(id)
    if (selectedEnvId === id) {
      setSelectedEnvId('default')
    }
  }

  return createPortal(
    <div className="env-dialog-overlay" onClick={onClose}>
      <div className="env-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="env-dialog-header">
          <h3>
            <Variable size={16} />
            Environments
          </h3>
          <button className="env-dialog-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="env-dialog-body">
          <EnvSidebar
            environments={environments}
            selectedEnvId={selectedEnvId}
            activeEnvId={activeEnvId}
            onSelect={(id) => setSelectedEnvId(id)}
            onAdd={handleAddEnvironment}
            onDuplicate={duplicateEnvironment}
            onDelete={handleDeleteEnvironment}
          />
          {selectedEnv ? (
            <EnvEditor
              environment={selectedEnv}
              isActive={activeEnvId === selectedEnv.id}
              onUpdate={updateEnvironment}
              onSetActive={setActiveEnv}
            />
          ) : (
            <div className="env-content" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              Select an environment
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
