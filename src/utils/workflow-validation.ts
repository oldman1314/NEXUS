function detectCycle(
  nodes: { id: string }[],
  edges: { source: string; target: string }[]
): boolean {
  const adj = new Map<string, string[]>()
  for (const node of nodes) {
    adj.set(node.id, [])
  }
  for (const edge of edges) {
    const neighbors = adj.get(edge.source)
    if (neighbors) {
      neighbors.push(edge.target)
    }
  }

  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = adj.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }

  return false
}

function findOrphanNodes(
  nodes: { id: string; type: string }[],
  edges: { source: string; target: string }[]
): string[] {
  const startNode = nodes.find((n) => n.type === 'start')
  if (!startNode) {
    return nodes.map((n) => n.id)
  }

  const adj = new Map<string, string[]>()
  for (const node of nodes) {
    adj.set(node.id, [])
  }
  for (const edge of edges) {
    const neighbors = adj.get(edge.source)
    if (neighbors) {
      neighbors.push(edge.target)
    }
  }

  const visited = new Set<string>()
  const queue: string[] = [startNode.id]
  visited.add(startNode.id)

  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbors = adj.get(current) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  return nodes.filter((n) => !visited.has(n.id)).map((n) => n.id)
}

export function validateWorkflow(
  nodes: { id: string; type: string }[],
  edges: { source: string; target: string }[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  const startNodes = nodes.filter((n) => n.type === 'start')
  if (startNodes.length === 0) {
    errors.push('Workflow must have a start node')
  } else if (startNodes.length > 1) {
    errors.push('Workflow must have exactly one start node')
  }

  if (detectCycle(nodes, edges)) {
    errors.push('Workflow contains a cycle')
  }

  const orphans = findOrphanNodes(nodes, edges)
  if (orphans.length > 0) {
    warnings.push(`Orphan nodes detected: ${orphans.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
