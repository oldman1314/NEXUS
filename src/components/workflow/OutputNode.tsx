import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { LogOut } from 'lucide-react'

function OutputNode({ data }: NodeProps) {
  const execStatus = data._execStatus as string | undefined
  const statusClass = execStatus === 'executing' ? 'executing' : execStatus === 'success' ? 'executed-success' : execStatus === 'error' ? 'executed-error' : ''
  return (
    <div className={`wf-node wf-node-output ${statusClass}`}>
      <Handle type="target" position={Position.Top} />
      <div className="wf-node-content">
        <LogOut size={14} className="wf-node-icon" />
        <div className="wf-node-info">
          <span className="wf-node-label">{(data.label as string) || 'Output'}</span>
          <span className="wf-node-format">{(data.format as string) || 'json'}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
}

export default memo(OutputNode)