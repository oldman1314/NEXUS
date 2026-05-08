import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'

function StartNode({ data }: NodeProps) {
  const execStatus = data._execStatus as string | undefined
  const statusClass = execStatus === 'executing' ? 'executing' : execStatus === 'success' ? 'executed-success' : execStatus === 'error' ? 'executed-error' : ''
  return (
    <div className={`wf-node wf-node-start ${statusClass}`}>
      <div className="wf-node-content">
        <Zap size={14} className="wf-node-icon" />
        <div className="wf-node-info">
          <span className="wf-node-label">{(data.label as string) || 'Start'}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(StartNode)