import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

function ConditionNode({ data }: NodeProps) {
  const execStatus = data._execStatus as string | undefined
  const statusClass = execStatus === 'executing' ? 'executing' : execStatus === 'success' ? 'executed-success' : execStatus === 'error' ? 'executed-error' : ''
  return (
    <div className={`wf-node wf-node-condition ${statusClass}`}>
      <Handle type="target" position={Position.Top} />
      <div className="wf-node-content">
        <GitBranch size={14} className="wf-node-icon" />
        <div className="wf-node-info">
          <span className="wf-node-label">{(data.label as string) || 'Condition'}</span>
        </div>
      </div>
      <div className="wf-node-expression">
        {(data.expression as string) || 'No expression'}
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '35%', background: 'var(--success)', border: '2px solid var(--success-light)', transition: 'box-shadow 0.15s ease-out' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '65%', background: 'var(--error)', border: '2px solid var(--error-light)', transition: 'box-shadow 0.15s ease-out' }} />
      <div className="condition-labels">
        <span className="condition-label true">
          <span className="condition-dot" style={{ background: 'var(--success)' }} />
          True
        </span>
        <span className="condition-label false">
          <span className="condition-dot" style={{ background: 'var(--error)' }} />
          False
        </span>
      </div>
    </div>
  )
}

export default memo(ConditionNode)