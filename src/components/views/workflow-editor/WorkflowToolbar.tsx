import { memo } from 'react'
import { Play, Save, FolderOpen, Zap } from 'lucide-react'
import RocketIcon from '@/components/common/RocketIcon'

interface WorkflowToolbarProps {
  nodeCount: number
  isRunning: boolean
  rocketState: 'idle' | 'launching' | 'flying' | 'returning'
  activeWorkflowName: string | null
  onNew: () => void
  onSave: (forceDialog?: boolean) => void
  onRun: () => void
  onStop: () => void
}

const WorkflowToolbar = memo(({
  nodeCount, isRunning, rocketState, activeWorkflowName,
  onNew, onSave, onRun, onStop,
}: WorkflowToolbarProps) => {
  return (
    <div className="workflow-toolbar">
      <div className="toolbar-left">
        <h2>Workflow Editor</h2>
        <span className="workflow-count">{nodeCount} nodes</span>
        {activeWorkflowName && (
          <span className="workflow-active-name">
            {activeWorkflowName}
          </span>
        )}
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={onNew}>
          <FolderOpen size={14} />
          New
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onSave(false)}
          disabled={nodeCount === 0}
        >
          <Save size={14} />
          Save
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onSave(true)}
          disabled={nodeCount === 0}
        >
          <Save size={14} />
          Save As
        </button>
        {isRunning ? (
          <button className="toolbar-btn stop-btn" onClick={onStop}>
            <Zap size={14} />
            Stop
          </button>
        ) : (
          <button
            className="toolbar-btn run-btn"
            onClick={onRun}
            disabled={nodeCount === 0}
          >
            <Play size={14} />
            Run
            <RocketIcon size={48} state={rocketState} />
          </button>
        )}
      </div>
    </div>
  )
})

WorkflowToolbar.displayName = 'WorkflowToolbar'

export default WorkflowToolbar
