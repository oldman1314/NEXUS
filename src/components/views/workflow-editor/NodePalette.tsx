import { memo } from 'react'
import { Zap, ArrowRight, GitBranch, Code, LogOut, FolderOpen, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { Workflow } from '@/types'

interface NodePaletteProps {
  showSaved: boolean
  workflows: Workflow[]
  activeWorkflowId: string | null
  onAddNode: (type: string) => void
  onDragStart: (event: React.DragEvent, nodeType: string) => void
  onToggleSaved: () => void
  onLoadWorkflow: (workflow: Workflow) => void
  onDeleteWorkflow: (id: string) => void
  onNewWorkflow: () => void
}

const NodePalette = memo(({
  showSaved, workflows, activeWorkflowId,
  onAddNode, onDragStart, onToggleSaved,
  onLoadWorkflow, onDeleteWorkflow, onNewWorkflow,
}: NodePaletteProps) => {
  const nodeItems = [
    { type: 'start', Icon: Zap, label: 'Start', className: 'start' },
    { type: 'api', Icon: ArrowRight, label: 'API Request', className: 'api' },
    { type: 'condition', Icon: GitBranch, label: 'Condition', className: 'condition' },
    { type: 'transform', Icon: Code, label: 'Transform', className: 'transform' },
    { type: 'output', Icon: LogOut, label: 'Output', className: 'output' },
  ]

  return (
    <div className="node-palette">
      <div className="palette-title">Nodes</div>
      {nodeItems.map(({ type, Icon, label, className }) => (
        <button
          key={type}
          className="palette-item"
          onClick={() => onAddNode(type)}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
        >
          <Icon size={14} className={`palette-icon ${className}`} />
          <span>{label}</span>
        </button>
      ))}

      <div className="palette-divider" />

      <div className="palette-title saved-title" onClick={onToggleSaved}>
        {showSaved ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Saved Workflows
        <span className="saved-count">{workflows.length}</span>
      </div>
      {showSaved && (
        <div className="saved-workflows">
          {workflows.length === 0 && (
            <div className="saved-empty">No saved workflows</div>
          )}
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className={`saved-item ${activeWorkflowId === wf.id ? 'active' : ''}`}
              onClick={() => onLoadWorkflow(wf)}
            >
              <FolderOpen size={12} />
              <span className="saved-name">{wf.name}</span>
              <button
                className="saved-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteWorkflow(wf.id)
                  if (activeWorkflowId === wf.id) {
                    onNewWorkflow()
                  }
                }}
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

NodePalette.displayName = 'NodePalette'

export default NodePalette
