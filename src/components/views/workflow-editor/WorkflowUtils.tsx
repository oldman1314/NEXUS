import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import StartNode from '@/components/workflow/StartNode'
import ApiNode from '@/components/workflow/ApiNode'
import ConditionNode from '@/components/workflow/ConditionNode'
import TransformNode from '@/components/workflow/TransformNode'
import OutputNode from '@/components/workflow/OutputNode'

export const nodeTypes = {
  start: StartNode,
  api: ApiNode,
  condition: ConditionNode,
  transform: TransformNode,
  output: OutputNode,
}

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{ ...style, stroke: 'var(--accent)', strokeWidth: 2 }}
      className="animated-edge"
    />
  )
}

export const edgeTypes = {
  animated: AnimatedEdge,
}

export const TEMPLATES = [
  {
    name: 'API Chain',
    create: () => {
      const nodes = [
        { id: 'start_0', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } },
        { id: 'api_0', type: 'api', position: { x: 250, y: 180 }, data: { label: 'API', method: 'GET', url: '', headers: [], params: [], bodyType: 'none', bodyRaw: '' } },
        { id: 'api_1', type: 'api', position: { x: 250, y: 310 }, data: { label: 'API', method: 'GET', url: '', headers: [], params: [], bodyType: 'none', bodyRaw: '' } },
        { id: 'output_0', type: 'output', position: { x: 250, y: 440 }, data: { label: 'Output', format: 'json' } },
      ]
      const edges = [
        { id: 'e_start_api0', source: 'start_0', target: 'api_0', animated: true },
        { id: 'e_api0_api1', source: 'api_0', target: 'api_1', animated: true },
        { id: 'e_api1_output0', source: 'api_1', target: 'output_0', animated: true },
      ]
      return { nodes, edges }
    },
  },
  {
    name: 'Conditional Branch',
    create: () => {
      const nodes = [
        { id: 'start_0', type: 'start', position: { x: 300, y: 50 }, data: { label: 'Start' } },
        { id: 'api_0', type: 'api', position: { x: 300, y: 180 }, data: { label: 'API', method: 'GET', url: '', headers: [], params: [], bodyType: 'none', bodyRaw: '' } },
        { id: 'cond_0', type: 'condition', position: { x: 300, y: 310 }, data: { label: 'Condition', expression: '{{prev.status}} === 200' } },
        { id: 'api_1', type: 'api', position: { x: 120, y: 440 }, data: { label: 'API', method: 'GET', url: '', headers: [], params: [], bodyType: 'none', bodyRaw: '' } },
        { id: 'transform_0', type: 'transform', position: { x: 480, y: 440 }, data: { label: 'Transform', script: 'return input;' } },
        { id: 'output_0', type: 'output', position: { x: 300, y: 570 }, data: { label: 'Output', format: 'json' } },
      ]
      const edges = [
        { id: 'e_start_api0', source: 'start_0', target: 'api_0', animated: true },
        { id: 'e_api0_cond0', source: 'api_0', target: 'cond_0', animated: true },
        { id: 'e_cond0_api1', source: 'cond_0', target: 'api_1', sourceHandle: 'true', animated: true, label: 'True' },
        { id: 'e_cond0_transform0', source: 'cond_0', target: 'transform_0', sourceHandle: 'false', animated: true, label: 'False' },
        { id: 'e_api1_output0', source: 'api_1', target: 'output_0', animated: true },
        { id: 'e_transform0_output0', source: 'transform_0', target: 'output_0', animated: true },
      ]
      return { nodes, edges }
    },
  },
  {
    name: 'Data Pipeline',
    create: () => {
      const nodes = [
        { id: 'start_0', type: 'start', position: { x: 250, y: 50 }, data: { label: 'Start' } },
        { id: 'api_0', type: 'api', position: { x: 250, y: 180 }, data: { label: 'API', method: 'GET', url: '', headers: [], params: [], bodyType: 'none', bodyRaw: '' } },
        { id: 'transform_0', type: 'transform', position: { x: 250, y: 310 }, data: { label: 'Transform', script: 'return input;' } },
        { id: 'output_0', type: 'output', position: { x: 250, y: 440 }, data: { label: 'Output', format: 'json' } },
      ]
      const edges = [
        { id: 'e_start_api0', source: 'start_0', target: 'api_0', animated: true },
        { id: 'e_api0_transform0', source: 'api_0', target: 'transform_0', animated: true },
        { id: 'e_transform0_output0', source: 'transform_0', target: 'output_0', animated: true },
      ]
      return { nodes, edges }
    },
  },
]
