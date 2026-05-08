import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ArrowRight } from 'lucide-react'
import type { HttpMethod } from '@/types'

function ApiNode({ data }: NodeProps) {
  const method = (data.method as HttpMethod) || 'GET'
  const execStatus = data._execStatus as string | undefined

  const statusClass = execStatus === 'executing' ? 'executing' : execStatus === 'success' ? 'executed-success' : execStatus === 'error' ? 'executed-error' : ''

  return (
    <div className={`wf-node wf-node-api ${statusClass}`}>
      <Handle type="target" position={Position.Top} />
      <div className="wf-node-content">
        <ArrowRight size={14} className="wf-node-icon" />
        <div className="wf-node-info">
          <span className="wf-node-label">{(data.label as string) || 'API Request'}</span>
          <span className={`wf-node-method method-${method.toLowerCase()}`}>{method}</span>
        </div>
      </div>
      <div className="wf-node-url">{(data.url as string) || 'No URL'}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(ApiNode)