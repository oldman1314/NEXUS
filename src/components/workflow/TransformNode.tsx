import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Code } from 'lucide-react'

function TransformNode({ data }: NodeProps) {
  const execStatus = data._execStatus as string | undefined
  const statusClass = execStatus === 'executing' ? 'executing' : execStatus === 'success' ? 'executed-success' : execStatus === 'error' ? 'executed-error' : ''
  return (
    <div className={`wf-node wf-node-transform ${statusClass}`}>
      <Handle type="target" position={Position.Top} />
      <div className="wf-node-content">
        <Code size={14} className="wf-node-icon" />
        <div className="wf-node-info">
          <span className="wf-node-label">{(data.label as string) || 'Transform'}</span>
        </div>
      </div>
      <div className="wf-node-script">
        {(data.script as string) || 'return input;'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(TransformNode)