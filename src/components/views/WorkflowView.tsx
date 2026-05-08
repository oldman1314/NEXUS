import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type ReactFlowInstance,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAppStore } from '@/stores/useAppStore'
import { toast } from '@/stores/useToastStore'
import { useWorkflowAnimationStore, type WorkflowAnimationState } from '@/stores/useWorkflowAnimationStore'
import { executeWorkflow } from '@/utils/workflow-engine'
import { validateWorkflow } from '@/utils/workflow-validation'
import type { WorkflowLog, Workflow } from '@/types'
import NodeConfigPanel from '@/components/workflow/NodeConfigPanel'
import WorkflowLogs from '@/components/workflow/WorkflowLogs'
import { nodeTypes, edgeTypes, TEMPLATES } from './workflow-editor/WorkflowUtils'
import WorkflowToolbar from './workflow-editor/WorkflowToolbar'
import NodePalette from './workflow-editor/NodePalette'
import SaveWorkflowDialog from './workflow-editor/SaveWorkflowDialog'
import EmptyCanvasGuide from './workflow-editor/EmptyCanvasGuide'
import './workflow-view.css'
import '../workflow/workflow-nodes.css'

export default function WorkflowView() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [rocketState, setRocketState] = useState<'idle' | 'launching' | 'flying' | 'returning'>('idle')
  const [showLogs, setShowLogs] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, 'executing' | 'success' | 'error'>>({})
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveDialogName, setSaveDialogName] = useState('')
  const [saveDialogDescription, setSaveDialogDescription] = useState('')
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set())
  const [nodeOffset, setNodeOffset] = useState(0)
  const [isDirty, setIsDirty] = useState(false)
  const [logsHeight, setLogsHeight] = useState(240)
  const containerRef = useRef<HTMLDivElement>(null)
  const workflowAbortRef = useRef<AbortController | null>(null)

  const workflows = useAppStore((state) => state.workflows)
  const addWorkflow = useAppStore((state) => state.addWorkflow)
  const deleteWorkflow = useAppStore((state) => state.deleteWorkflow)
  const updateWorkflow = useAppStore((state) => state.updateWorkflow)
  const activeWorkflowId = useAppStore((state) => state.activeWorkflowId)
  const setActiveWorkflowId = useAppStore((state) => state.setActiveWorkflowId)

  const setWorkflowRunning = useWorkflowAnimationStore((s: WorkflowAnimationState) => s.setWorkflowRunning)
  const setRocketStateAnim = useWorkflowAnimationStore((s: WorkflowAnimationState) => s.setRocketState)
  const setNodeProgress = useWorkflowAnimationStore((s: WorkflowAnimationState) => s.setNodeProgress)
  const setCircuitState = useWorkflowAnimationStore((s: WorkflowAnimationState) => s.setCircuitState)
  const triggerCombo = useWorkflowAnimationStore((s: WorkflowAnimationState) => s.triggerCombo)
  const resetAnimation = useWorkflowAnimationStore((s: WorkflowAnimationState) => s.resetAnimation)
  const nodeProgressRef = useRef({ executed: 0, total: 0 })

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (connection.source === connection.target) {
        toast('warning', 'Cannot connect a node to itself')
        return
      }
      if (edges.some((e) => e.source === connection.source && e.target === connection.target)) {
        toast('warning', 'Connection already exists')
        return
      }
      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)
      if (targetNode?.type === 'start') {
        toast('warning', 'Start node cannot have incoming connections')
        return
      }
      if (sourceNode?.type === 'output') {
        toast('warning', 'Output node cannot have outgoing connections')
        return
      }
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds))
      setIsDirty(true)
    },
    [setEdges, edges, nodes]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const addNode = useCallback((type: string, position?: { x: number; y: number }) => {
    if (type === 'start' && nodes.some((n) => n.type === 'start')) {
      toast('warning', 'Workflow can only have one Start node')
      return
    }

    const id = `${type}_${crypto.randomUUID()}`

    let nodePosition: { x: number; y: number }
    if (position) {
      nodePosition = position
    } else if (rfInstance) {
      const viewport = rfInstance.getViewport()
      const wrapper = document.querySelector('.reactflow-wrapper')
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        nodePosition = rfInstance.screenToFlowPosition({
          x: centerX - viewport.x,
          y: centerY - viewport.y,
        })
      } else {
        nodePosition = { x: 250, y: 150 }
      }
    } else {
      nodePosition = { x: 250, y: 150 }
    }

    const offset = nodeOffset * 30
    nodePosition = { x: nodePosition.x + offset, y: nodePosition.y + offset }
    setNodeOffset((prev) => prev + 1)

    const baseData = { label: type.charAt(0).toUpperCase() + type.slice(1) }
    let data: Record<string, unknown> = baseData

    if (type === 'api') {
      data = { ...baseData, method: 'GET', url: '', headers: [], params: [], bodyType: 'none', bodyRaw: '' }
    } else if (type === 'condition') {
      data = { ...baseData, expression: '{{prev.status}} === 200' }
    } else if (type === 'transform') {
      data = { ...baseData, script: 'return input;' }
    } else if (type === 'output') {
      data = { ...baseData, format: 'json' }
    }

    setNodes((nds) => [...nds, { id, type, position: nodePosition, data }])
    setIsDirty(true)
  }, [setNodes, rfInstance, nodeOffset, nodes])

  const updateNodeData = useCallback((nodeId: string, newData: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n))
    )
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev))
    setIsDirty(true)
  }, [setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode((prev) => (prev?.id === nodeId ? null : prev))
    setIsDirty(true)
  }, [setNodes, setEdges])

  const handleNodesChange = useCallback<OnNodesChange<Node>>((changes) => {
    onNodesChange(changes)
    const hasStructureChange = changes.some((c) => c.type === 'remove' || c.type === 'add' || c.type === 'position')
    if (hasStructureChange) setIsDirty(true)
  }, [onNodesChange])

  const handleEdgesChange = useCallback<OnEdgesChange<Edge>>((changes) => {
    onEdgesChange(changes)
    const hasStructureChange = changes.some((c) => c.type === 'remove' || c.type === 'add')
    if (hasStructureChange) setIsDirty(true)
  }, [onEdgesChange])

  const confirmDiscard = useCallback((): boolean => {
    if (isDirty) {
      return window.confirm('You have unsaved changes. Discard them?')
    }
    return true
  }, [isDirty])

  const handleRun = useCallback(async () => {
    const validation = validateWorkflow(
      nodes.map((n) => ({ id: n.id, type: n.type || '' })),
      edges.map((e) => ({ source: e.source, target: e.target }))
    )

    if (!validation.valid) {
      validation.errors.forEach((err) => toast('error', err))
      return
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((w) => toast('warning', w))
    }

    setIsRunning(true)
    setLogs([])
    setShowLogs(true)
    setNodeStatuses({})
    setActiveEdges(new Set())
    setRocketState('launching')
    setRocketStateAnim('launching')
    setWorkflowRunning(true)
    setNodeProgress(0, nodes.length)
    nodeProgressRef.current = { executed: 0, total: nodes.length }
    setTimeout(() => {
      setRocketState('flying')
      setRocketStateAnim('flying')
    }, 350)

    const controller = new AbortController()
    workflowAbortRef.current = controller

    try {
      const onLog = (log: WorkflowLog) => {
        setLogs((prev) => [...prev, log])
        if (log.status === 'success') {
          setNodeStatuses((prev) => ({ ...prev, [log.nodeId]: 'success' }))
          nodeProgressRef.current.executed += 1
          setNodeProgress(nodeProgressRef.current.executed, nodeProgressRef.current.total)
          triggerCombo()
        } else if (log.status === 'error') {
          setNodeStatuses((prev) => ({ ...prev, [log.nodeId]: 'error' }))
          setCircuitState('error')
        }

        setActiveEdges((prev) => {
          const next = new Set(prev)
          const incoming = edges.filter((e) => e.target === log.nodeId)
          incoming.forEach((e) => next.add(e.id))
          return next
        })
      }

      const onNodeStart = (nodeId: string) => {
        setNodeStatuses((prev) => ({ ...prev, [nodeId]: 'executing' }))
      }

      await executeWorkflow(nodes as unknown as import('@/types').WorkflowNode[], edges as unknown as import('@/types').WorkflowEdge[], onLog, controller.signal, onNodeStart)
    } catch (error) {
      console.error('Workflow execution failed:', error)
    } finally {
      setIsRunning(false)
      workflowAbortRef.current = null
      setRocketState('returning')
      setRocketStateAnim('returning')
      setTimeout(() => {
        setRocketState('idle')
        setRocketStateAnim('idle')
        setActiveEdges(new Set())
        resetAnimation()
      }, 1000)
    }
  }, [nodes, edges])

  const handleStopWorkflow = useCallback(() => {
    workflowAbortRef.current?.abort()
    workflowAbortRef.current = null
  }, [])

  const performSave = useCallback((name: string, description: string) => {
    const workflowNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type || 'default',
      position: n.position,
      data: n.data as Record<string, unknown>,
    }))
    const workflowEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || undefined,
      label: typeof e.label === 'string' ? e.label : undefined,
    }))
    if (activeWorkflowId) {
      updateWorkflow(activeWorkflowId, {
        name,
        description,
        nodes: workflowNodes,
        edges: workflowEdges,
      })
    } else {
      const newId = addWorkflow(name, workflowNodes, workflowEdges)
      setActiveWorkflowId(newId)
    }
  }, [nodes, edges, activeWorkflowId, updateWorkflow, addWorkflow, setActiveWorkflowId])

  const handleSaveWorkflow = useCallback((forceDialog = false) => {
    if (activeWorkflowId && !forceDialog) {
      const wf = workflows.find((w) => w.id === activeWorkflowId)
      performSave(wf?.name || 'Untitled', wf?.description || '')
      setIsDirty(false)
    } else {
      const wf = workflows.find((w) => w.id === activeWorkflowId)
      setSaveDialogName(wf?.name || '')
      setSaveDialogDescription(wf?.description || '')
      setShowSaveDialog(true)
    }
  }, [activeWorkflowId, workflows, performSave])

  const handleSaveDialogConfirm = useCallback(() => {
    if (!saveDialogName.trim()) return
    performSave(saveDialogName.trim(), saveDialogDescription.trim())
    setShowSaveDialog(false)
    setIsDirty(false)
  }, [saveDialogName, saveDialogDescription, performSave])

  const handleLoadWorkflow = useCallback((workflow: Workflow) => {
    if (!confirmDiscard()) return
    setLogs([])
    setNodeStatuses({})
    const loadedNodes = workflow.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    })) as Node[]
    const loadedEdges = workflow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      label: e.label,
      animated: true,
    })) as Edge[]
    setNodes(loadedNodes)
    setEdges(loadedEdges)
    setActiveWorkflowId(workflow.id)
    setIsDirty(false)
  }, [setNodes, setEdges, confirmDiscard, setActiveWorkflowId])

  const handleNewWorkflow = useCallback(() => {
    if (!confirmDiscard()) return
    setNodes([])
    setEdges([])
    setActiveWorkflowId(null)
    setSelectedNode(null)
    setNodeStatuses({})
    setNodeOffset(0)
    setIsDirty(false)
  }, [setNodes, setEdges, confirmDiscard, setActiveWorkflowId])

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const nodeType = event.dataTransfer.getData('application/reactflow')
    if (!nodeType || !rfInstance) return
    const position = rfInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })
    addNode(nodeType, position)
  }, [rfInstance, addNode])

  const handleTemplate = useCallback((templateIndex: number) => {
    const template = TEMPLATES[templateIndex]
    if (!template) return
    const { nodes: tNodes, edges: tEdges } = template.create()
    setNodes(tNodes as Node[])
    setEdges(tEdges as Edge[])
    setNodeOffset(0)
    setActiveWorkflowId(null)
    setIsDirty(true)
  }, [setNodes, setEdges, setActiveWorkflowId])

  useEffect(() => {
    if (!activeWorkflowId) return
    const workflow = workflows.find((w) => w.id === activeWorkflowId)
    if (!workflow) return
    const currentWorkflowNodes = nodes.map((n) => n.id).sort().join(',')
    const targetNodes = workflow.nodes.map((n) => n.id).sort().join(',')
    if (currentWorkflowNodes === targetNodes) return
    const loadedNodes = workflow.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    })) as Node[]
    const loadedEdges = workflow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      label: e.label,
      animated: true,
    })) as Edge[]
    setNodes(loadedNodes)
    setEdges(loadedEdges)
    setLogs([])
    setNodeStatuses({})
    setIsDirty(false)
  }, [activeWorkflowId, workflows, setNodes, setEdges, nodes])

  useEffect(() => {
    if (Object.keys(nodeStatuses).length === 0) return
    setNodes((nds) =>
      nds.map((n) => {
        const status = nodeStatuses[n.id]
        if (status && n.data._execStatus !== status) {
          return { ...n, data: { ...n.data, _execStatus: status } }
        }
        return n
      })
    )

    if (!isRunning && Object.keys(nodeStatuses).length > 0 && !Object.values(nodeStatuses).includes('executing')) {
      const hasError = Object.values(nodeStatuses).includes('error')
      if (!hasError) {
        setCircuitState('success')
      }
    }
  }, [nodeStatuses, setNodes, isRunning, setCircuitState])

  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => {
        const isActive = activeEdges.has(e.id)
        const newType = isActive ? 'animated' : undefined
        if (e.type !== newType) {
          return { ...e, type: newType as string | undefined }
        }
        return e
      })
    )
  }, [activeEdges, setEdges])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showSaveDialog) {
        if (event.key === 'Escape') {
          setShowSaveDialog(false)
        }
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNode && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
          event.preventDefault()
          deleteNode(selectedNode.id)
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        handleSaveWorkflow(event.shiftKey)
      }

      if (event.key === 'Escape') {
        if (selectedNode) {
          setSelectedNode(null)
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, deleteNode, handleSaveWorkflow, showSaveDialog])

  const currentWorkflowName = activeWorkflowId
    ? workflows.find((w) => w.id === activeWorkflowId)?.name
    : null

  return (
    <div className="workflow-view" ref={containerRef} tabIndex={0}>
      <WorkflowToolbar
        nodeCount={nodes.length}
        isRunning={isRunning}
        rocketState={rocketState}
        activeWorkflowName={currentWorkflowName ?? null}
        onNew={handleNewWorkflow}
        onSave={handleSaveWorkflow}
        onRun={handleRun}
        onStop={handleStopWorkflow}
      />

      <div className="workflow-canvas-wrapper">
        <NodePalette
          showSaved={showSaved}
          workflows={workflows}
          activeWorkflowId={activeWorkflowId}
          onAddNode={addNode}
          onDragStart={onDragStart}
          onToggleSaved={() => setShowSaved(!showSaved)}
          onLoadWorkflow={handleLoadWorkflow}
          onDeleteWorkflow={deleteWorkflow}
          onNewWorkflow={handleNewWorkflow}
        />

        <div className="reactflow-wrapper" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setRfInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background gap={16} size={1} color="var(--border-light)" />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start': return '#34c759'
                  case 'api': return '#007aff'
                  case 'condition': return '#ff9500'
                  case 'transform': return '#af52de'
                  case 'output': return '#5856d6'
                  default: return '#86868b'
                }
              }}
              maskColor="var(--bg-modal)"
            />
            {nodes.length === 0 && (
              <EmptyCanvasGuide onAddNode={addNode} onTemplate={handleTemplate} />
            )}
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={(data) => updateNodeData(selectedNode.id, data)}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {showLogs && <WorkflowLogs logs={logs} onClose={() => setShowLogs(false)} height={logsHeight} onHeightChange={setLogsHeight} />}

      {showSaveDialog && (
        <SaveWorkflowDialog
          name={saveDialogName}
          description={saveDialogDescription}
          onNameChange={setSaveDialogName}
          onDescriptionChange={setSaveDialogDescription}
          onConfirm={handleSaveDialogConfirm}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  )
}
