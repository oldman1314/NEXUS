import { Plus, Trash2, GitBranch, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useUIStore } from '@/stores/useUIStore'
import Tooltip from '@/components/common/Tooltip'
import './sidebar-workflows.css'

export default function SidebarWorkflows() {
  const workflows = useAppStore((s) => s.workflows)
  const addWorkflow = useAppStore((s) => s.addWorkflow)
  const deleteWorkflow = useAppStore((s) => s.deleteWorkflow)
  const activeWorkflowId = useAppStore((s) => s.activeWorkflowId)
  const setActiveWorkflowId = useAppStore((s) => s.setActiveWorkflowId)
  const setView = useUIStore((s) => s.setView)

  return (
    <div className="sidebar-section sidebar-section-workflows">
      <div className="section-header">
        <span>Workflows</span>
        <div className="section-actions">
          <Tooltip content="New Workflow">
            <button className="icon-btn" onClick={() => addWorkflow('New Workflow')}>
              <Plus size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {workflows.length === 0 ? (
          <div className="empty-state">
            <GitBranch size={24} className="empty-state-icon" />
            <span>No workflows yet</span>
            <span className="empty-state-hint">Click + to create one</span>
          </div>
        ) : (
          workflows.map((wf) => (
            <div key={wf.id} className={`workflow-item${wf.id === activeWorkflowId ? ' active' : ''}`}>
              <button className="workflow-item-header" onClick={() => { setView('workflow'); setActiveWorkflowId(wf.id) }}>
                <ChevronRight size={12} className="workflow-chevron" />
                <GitBranch size={14} className="workflow-icon" />
                <span className="workflow-name">{wf.name}</span>{' '}
                <span className="workflow-node-count">
                  {(wf.nodes || []).length} nodes
                </span>
                <div className="workflow-item-actions">
                  <Tooltip content="Delete workflow">
                    <button
                      className="icon-btn workflow-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteWorkflow(wf.id)
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </Tooltip>
                </div>
              </button>
              {wf.description && (
                <span className="workflow-desc">{wf.description}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
