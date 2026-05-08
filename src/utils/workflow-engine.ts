import type { WorkflowNode, WorkflowEdge, ResponseData, WorkflowLog } from '@/types'

interface WorkflowContext {
  nodeOutputs: Record<string, unknown>
  prevOutputs: Record<string, unknown>
  variables: Record<string, unknown>
  logs: WorkflowLog[]
}

function createWorkflowContext(): WorkflowContext {
  return {
    nodeOutputs: {},
    prevOutputs: {},
    variables: {},
    logs: [],
  }
}

function resolveTemplate(template: string, context: WorkflowContext, currentNodeId?: string): string {
  if (!template) return template
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
    const value = resolveValue(path.trim(), context, currentNodeId)
    return value !== undefined ? String(value) : match
  })
}

function resolveValue(path: string, context: WorkflowContext, currentNodeId?: string): unknown {
  const parts = path.split('.')
  let current: unknown

  if (parts[0] === 'prev' && currentNodeId) {
    current = context.prevOutputs[currentNodeId]
    parts.shift()
  } else if (parts[0].startsWith('node_') || parts[0].startsWith('step_')) {
    current = context.nodeOutputs[parts[0]]
    parts.shift()
  } else {
    current = context.variables
  }

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (Array.isArray(current)) {
      const index = parseInt(part, 10)
      if (!isNaN(index)) current = current[index]
      else return undefined
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return current
}

function evaluateExpression(expression: string, context: WorkflowContext, currentNodeId?: string): { result: boolean; error?: string } {
  const resolved = resolveTemplate(expression, context, currentNodeId)
  if (resolved === 'true') return { result: true }
  if (resolved === 'false') return { result: false }
  try {
    const fn = new Function('context', `with(context) { return ${resolved}; }`)
    return { result: !!fn({ ...context.variables, ...context.nodeOutputs }) }
  } catch (err) {
    return { result: false, error: err instanceof Error ? err.message : 'Expression evaluation failed' }
  }
}

function executeTransform(script: string, input: unknown): unknown {
  try {
    const fn = new Function('input', script)
    return fn(input)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Transform error' }
  }
}

function buildAdjacencyMap(edges: WorkflowEdge[]): Map<string, WorkflowEdge[]> {
  const map = new Map<string, WorkflowEdge[]>()
  for (const edge of edges) {
    const list = map.get(edge.source) || []
    list.push(edge)
    map.set(edge.source, list)
  }
  return map
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function voidBranch(
  nodeId: string,
  inDegree: Map<string, number>,
  adjacencyMap: Map<string, WorkflowEdge[]>,
  voided: Set<string>,
  completed: Set<string>,
  nodeMap: Map<string, WorkflowNode>,
  context: WorkflowContext,
  onLog?: (log: WorkflowLog) => void
): void {
  if (voided.has(nodeId) || completed.has(nodeId)) return
  voided.add(nodeId)
  const node = nodeMap.get(nodeId)
  if (node) {
    const log: WorkflowLog = {
      nodeId,
      nodeName: (node.data?.label as string) || node.type,
      status: 'skipped',
      output: null,
      duration: 0,
      timestamp: Date.now(),
    }
    context.logs.push(log)
    onLog?.(log)
  }
  const outgoing = adjacencyMap.get(nodeId) || []
  for (const edge of outgoing) {
    const current = inDegree.get(edge.target) || 0
    const newDegree = current - 1
    inDegree.set(edge.target, newDegree)
    if (newDegree === 0) {
      voidBranch(edge.target, inDegree, adjacencyMap, voided, completed, nodeMap, context, onLog)
    }
  }
}

export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  onLog?: (log: WorkflowLog) => void,
  signal?: AbortSignal,
  onNodeStart?: (nodeId: string) => void
): Promise<WorkflowContext> {
  const context = createWorkflowContext()
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const adjacencyMap = buildAdjacencyMap(edges)

  const startNode = nodes.find((n) => n.type === 'start')
  if (!startNode) {
    throw new Error('Workflow must have a start node')
  }

  const inDegree = new Map<string, number>()
  const predecessors = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    predecessors.set(node.id, [])
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    const preds = predecessors.get(edge.target)
    if (preds) preds.push(edge.source)
  }

  const queue: string[] = []
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId)
    }
  }

  const completed = new Set<string>()
  const voided = new Set<string>()

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (voided.has(nodeId)) continue

    await yieldToMain()
    if (signal?.aborted) break

    const node = nodeMap.get(nodeId)
    if (!node) continue

    onNodeStart?.(nodeId)

    const preds = predecessors.get(nodeId) || []
    if (preds.length === 0) {
      context.prevOutputs[nodeId] = undefined
    } else if (preds.length === 1) {
      context.prevOutputs[nodeId] = context.nodeOutputs[preds[0]]
    } else {
      const merged: Record<string, unknown> = {}
      let lastOutput: unknown = undefined
      for (const predId of preds) {
        if (!completed.has(predId)) continue
        const predOutput = context.nodeOutputs[predId]
        lastOutput = predOutput
        if (predOutput && typeof predOutput === 'object' && !Array.isArray(predOutput)) {
          Object.assign(merged, predOutput as Record<string, unknown>)
        }
      }
      context.prevOutputs[nodeId] = Object.keys(merged).length > 0 ? merged : lastOutput
    }

    const startTime = performance.now()
    let output: unknown
    let status: WorkflowLog['status'] = 'success'

    try {
      switch (node.type) {
        case 'start':
          output = { started: true, timestamp: Date.now() }
          break

        case 'api': {
          const data = node.data as {
            url: string
            method: string
            headers?: Array<{ key: string; value: string; enabled: boolean }>
            bodyType: string
            bodyRaw?: string
            params?: Array<{ key: string; value: string; enabled: boolean }>
            formData?: Array<{ key: string; value: string; enabled: boolean }>
            urlEncodedData?: Array<{ key: string; value: string; enabled: boolean }>
          }
          const url = resolveTemplate(data.url, context, nodeId)
          const headers: Record<string, string> = {}
            ; (data.headers || [])
              .filter((h) => h.enabled && h.key)
              .forEach((h) => {
                headers[resolveTemplate(h.key, context, nodeId)] = resolveTemplate(h.value, context, nodeId)
              })

          let fullUrl = url
          const params = new URLSearchParams()
            ; (data.params || [])
              .filter((p) => p.enabled && p.key)
              .forEach((p) => {
                params.append(
                  resolveTemplate(p.key, context, nodeId),
                  resolveTemplate(p.value, context, nodeId)
                )
              })
          if (params.toString()) {
            const sep = fullUrl.includes('?') ? '&' : '?'
            fullUrl = `${fullUrl}${sep}${params.toString()}`
          }

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)
          if (signal) {
            signal.addEventListener('abort', () => { clearTimeout(timeoutId); controller.abort() }, { once: true })
          }

          const options: RequestInit = { method: data.method, headers, signal: controller.signal }
          if (['POST', 'PUT', 'PATCH'].includes(data.method) && data.bodyType !== 'none') {
            if (data.bodyType === 'json') {
              options.body = resolveTemplate(data.bodyRaw || '', context, nodeId)
              headers['Content-Type'] = 'application/json'
            } else if (data.bodyType === 'text') {
              options.body = resolveTemplate(data.bodyRaw || '', context, nodeId)
              headers['Content-Type'] = 'text/plain'
            } else if (data.bodyType === 'form-data') {
              const formData = new FormData()
                ; (data.formData || [])
                  .filter((item) => item.enabled && item.key)
                  .forEach((item) => {
                    formData.append(
                      resolveTemplate(item.key, context, nodeId),
                      resolveTemplate(item.value, context, nodeId)
                    )
                  })
              options.body = formData
            } else if (data.bodyType === 'x-www-form-urlencoded') {
              const urlParams = new URLSearchParams()
                ; (data.urlEncodedData || [])
                  .filter((item) => item.enabled && item.key)
                  .forEach((item) => {
                    urlParams.append(
                      resolveTemplate(item.key, context, nodeId),
                      resolveTemplate(item.value, context, nodeId)
                    )
                  })
              options.body = urlParams.toString()
              headers['Content-Type'] = 'application/x-www-form-urlencoded'
            }
          }

          try {
            const response = await fetch(fullUrl, options)
            clearTimeout(timeoutId)
            const contentType = response.headers.get('content-type') || ''
            let body: unknown
            const responseText = await response.text()
            try {
              body = contentType.includes('json') ? JSON.parse(responseText) : responseText
            } catch {
              body = responseText
            }

            output = {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body,
              ok: response.ok,
            } as ResponseData
          } catch (fetchError) {
            clearTimeout(timeoutId)
            const isTimeout = !signal?.aborted && controller.signal.aborted
            if (isTimeout) {
              output = { status: 0, ok: false, error: 'Request timed out after 30000ms', errorType: 'timeout' as const }
            } else if (signal?.aborted) {
              output = { status: 0, ok: false, error: 'Workflow was cancelled', errorType: 'abort' as const }
            } else {
              output = { status: 0, ok: false, error: fetchError instanceof Error ? fetchError.message : 'Network error', errorType: 'network' as const }
            }
          }
          break
        }

        case 'condition': {
          const condData = node.data as { expression: string }
          const evalResult = evaluateExpression(condData.expression, context, nodeId)
          output = { result: evalResult.result, expression: condData.expression, error: evalResult.error }
          if (evalResult.error) {
            status = 'error'
          }
          break
        }

        case 'transform': {
          const transData = node.data as { script: string }
          const input = context.prevOutputs[nodeId]
          output = executeTransform(transData.script, input)
          break
        }

        case 'output': {
          const outData = node.data as { format: string }
          output = {
            format: outData.format,
            data: context.prevOutputs[nodeId],
            allOutputs: context.nodeOutputs,
          }
          break
        }

        default:
          output = null
      }
    } catch (error) {
      status = 'error'
      output = { error: error instanceof Error ? error.message : 'Execution error' }
    }

    context.nodeOutputs[nodeId] = output
    completed.add(nodeId)

    const log: WorkflowLog = {
      nodeId,
      nodeName: (node.data?.label as string) || node.type,
      status,
      output,
      duration: Math.round(performance.now() - startTime),
      timestamp: Date.now(),
    }
    context.logs.push(log)
    onLog?.(log)

    if (status === 'error' && node.type !== 'condition') {
      const outgoing = adjacencyMap.get(nodeId) || []
      for (const edge of outgoing) {
        const current = inDegree.get(edge.target) || 0
        const newDegree = current - 1
        inDegree.set(edge.target, newDegree)
        if (newDegree === 0) {
          voidBranch(edge.target, inDegree, adjacencyMap, voided, completed, nodeMap, context, onLog)
        }
      }
      continue
    }

    const outgoing = adjacencyMap.get(nodeId) || []

    if (node.type === 'condition' && outgoing.some((e) => e.sourceHandle)) {
      const condOutput = output as { result: boolean; error?: string }
      const result = condOutput?.result ?? false
      const handleToFollow = result ? 'true' : 'false'

      for (const edge of outgoing) {
        if (edge.sourceHandle === handleToFollow) {
          const current = inDegree.get(edge.target) || 0
          const newDegree = current - 1
          inDegree.set(edge.target, newDegree)
          if (newDegree === 0 && !completed.has(edge.target) && !voided.has(edge.target)) {
            queue.push(edge.target)
          }
        } else {
          const current = inDegree.get(edge.target) || 0
          const newDegree = current - 1
          inDegree.set(edge.target, newDegree)
          if (newDegree === 0) {
            voidBranch(edge.target, inDegree, adjacencyMap, voided, completed, nodeMap, context, onLog)
          }
        }
      }
    } else {
      for (const edge of outgoing) {
        const current = inDegree.get(edge.target) || 0
        const newDegree = current - 1
        inDegree.set(edge.target, newDegree)
        if (newDegree === 0 && !completed.has(edge.target) && !voided.has(edge.target)) {
          queue.push(edge.target)
        }
      }
    }
  }

  return context
}
