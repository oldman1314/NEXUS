import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, Copy, Check, AlertTriangle } from 'lucide-react'
import './json-highlighter.css'

interface LazyTreeNode {
  key: string
  value: unknown
  depth: number
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'undefined'
  path: string
  childCount: number
  childrenLoaded: boolean
  children?: LazyTreeNode[]
}

interface FlatRow {
  id: string
  nodeKey: string
  key: string
  value: unknown
  depth: number
  type: LazyTreeNode['type']
  path: string
  childCount: number
  hasChildren: boolean
  isExpanded: boolean
  isLast: boolean
  isRoot: boolean
  isCloseBracket: boolean
}

const ROW_HEIGHT = 22
const OVERSCAN = 8
const LARGE_DATA_THRESHOLD = 1 * 1024 * 1024

function buildTopLevelNodes(data: unknown, key = '', depth = 0, path = ''): LazyTreeNode[] {
  if (data === null) {
    return [{ key, value: null, depth, type: 'null', path, childCount: 0, childrenLoaded: true }]
  }
  if (data === undefined) {
    return [{ key, value: undefined, depth, type: 'undefined' as const, path, childCount: 0, childrenLoaded: true }]
  }
  if (typeof data !== 'object') {
    return [{ key, value: data, depth, type: typeof data as LazyTreeNode['type'], path, childCount: 0, childrenLoaded: true }]
  }

  const isArray = Array.isArray(data)
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(data as Record<string, unknown>)

  if (entries.length === 0) {
    return [{ key, value: data, depth, type: isArray ? 'array' : 'object', path, childCount: 0, childrenLoaded: true, children: [] }]
  }

  return entries.map(([k, v]) => {
    const childPath = `${path}${isArray ? `[${k}]` : `.${k}`}`
    const isContainer = v !== null && typeof v === 'object'
    const childArr = isContainer ? (Array.isArray(v) ? v as unknown[] : Object.values(v as Record<string, unknown>)) : []
    return {
      key: k,
      value: v,
      depth,
      type: Array.isArray(v) ? 'array' : v !== null && typeof v === 'object' ? 'object' : typeof v as LazyTreeNode['type'],
      path: childPath,
      childCount: isContainer ? childArr.length : 0,
      childrenLoaded: false,
      children: undefined,
    }
  })
}

function loadChildren(node: LazyTreeNode): LazyTreeNode[] {
  if (node.childrenLoaded) return node.children || []
  const data = node.value
  if (data === null || data === undefined || typeof data !== 'object') return []

  const isArray = Array.isArray(data)
  const entries = isArray
    ? (data as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(data as Record<string, unknown>)

  return entries.map(([k, v]) => {
    const childPath = `${node.path}${isArray ? `[${k}]` : `.${k}`}`
    const isContainer = v !== null && typeof v === 'object'
    const childArr = isContainer ? (Array.isArray(v) ? v as unknown[] : Object.values(v as Record<string, unknown>)) : []
    return {
      key: k,
      value: v,
      depth: node.depth + 1,
      type: Array.isArray(v) ? 'array' : v !== null && typeof v === 'object' ? 'object' : typeof v as LazyTreeNode['type'],
      path: childPath,
      childCount: isContainer ? childArr.length : 0,
      childrenLoaded: false,
      children: undefined,
    }
  })
}

function flattenTree(roots: LazyTreeNode[], expandedKeys: Set<string>, nodeMap: Map<string, LazyTreeNode>): FlatRow[] {
  const rows: FlatRow[] = []

  function walk(node: LazyTreeNode, isLast: boolean, isRoot: boolean) {
    const nodeKey = node.path || '__root__'
    const hasChildren = node.type === 'object' || node.type === 'array'
    const isExpanded = expandedKeys.has(nodeKey)

    rows.push({
      id: nodeKey,
      nodeKey,
      key: node.key,
      value: node.value,
      depth: node.depth,
      type: node.type,
      path: node.path,
      childCount: node.childCount,
      hasChildren,
      isExpanded,
      isLast,
      isRoot,
      isCloseBracket: false,
    })

    if (hasChildren && isExpanded) {
      const children = node.childrenLoaded ? node.children || [] : loadChildren(node)
      if (!node.childrenLoaded) {
        node.children = children
        node.childrenLoaded = true
        nodeMap.set(nodeKey, node)
      }
      children.forEach((child, i) => {
        walk(child, i === children.length - 1, false)
      })
      rows.push({
        id: `${nodeKey}__close`,
        nodeKey,
        key: '__close__',
        value: null,
        depth: node.depth,
        type: node.type,
        path: node.path,
        childCount: 0,
        hasChildren: false,
        isExpanded: false,
        isLast,
        isRoot: false,
        isCloseBracket: true,
      })
    }
  }

  roots.forEach((node, i) => {
    walk(node, i === roots.length - 1, true)
  })

  return rows
}

const JsonValue = React.memo(function JsonValue({ value, type }: { value: unknown; type: string }) {
  if (type === 'string') return <span className="json-string">"{String(value)}"</span>
  if (type === 'number') return <span className="json-number">{String(value)}</span>
  if (type === 'boolean') return <span className="json-boolean">{String(value)}</span>
  if (type === 'null') return <span className="json-null">null</span>
  if (type === 'undefined') return <span className="json-null">undefined</span>
  return <span>{String(value)}</span>
})

const VirtualRow = React.memo(function VirtualRow({
  row,
  onToggle,
}: {
  row: FlatRow
  onToggle: (nodeKey: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const text = JSON.stringify(row.value, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [row.value])

  if (row.isCloseBracket) {
    const bracketClose = row.type === 'array' ? ']' : '}'
    return (
      <div className="jv-line" style={{ height: ROW_HEIGHT, paddingLeft: `${row.depth * 20}px` }}>
        <span className="jv-bracket">{bracketClose}</span>
        {!row.isLast && <span className="jv-comma">,</span>}
      </div>
    )
  }

  const isExpandable = row.hasChildren
  const bracketOpen = row.type === 'array' ? '[' : '{'
  const bracketClose = row.type === 'array' ? ']' : '}'

  if (!isExpandable) {
    return (
      <div className="jv-line" style={{ height: ROW_HEIGHT, paddingLeft: `${row.depth * 20}px` }}>
        {!row.isRoot && (
          <>
            <span className="jv-key">"{row.key}"</span>
            <span className="jv-colon">: </span>
          </>
        )}
        <JsonValue value={row.value} type={row.type} />
        {!row.isLast && <span className="jv-comma">,</span>}
        <button className="jv-copy-btn" onClick={handleCopy} title={`Copy ${row.path}`}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>
      </div>
    )
  }

  const isEmpty = row.childCount === 0

  return (
    <div className="jv-line" style={{ height: ROW_HEIGHT, paddingLeft: `${row.depth * 20}px` }}>
      {!row.isRoot && (
        <>
          <span className="jv-key">"{row.key}"</span>
          <span className="jv-colon">: </span>
        </>
      )}
      <button
        className={`jv-toggle ${row.isExpanded ? 'expanded' : ''}`}
        onClick={() => onToggle(row.nodeKey)}
        disabled={isEmpty}
        title={row.isExpanded ? 'Collapse' : 'Expand'}
      >
        {isEmpty ? (
          <span className="jv-empty-toggle" />
        ) : row.isExpanded ? (
          <ChevronDown size={12} />
        ) : (
          <ChevronRight size={12} />
        )}
      </button>
      <span className="jv-bracket">{bracketOpen}</span>
      {!row.isExpanded && !isEmpty && (
        <>
          <span className="jv-summary">
            {row.childCount} {row.type === 'array' ? 'item' : 'key'}{row.childCount !== 1 ? 's' : ''}
          </span>
          <span className="jv-bracket">{bracketClose}</span>
          {!row.isLast && <span className="jv-comma">,</span>}
        </>
      )}
      {isEmpty && (
        <>
          <span className="jv-bracket">{bracketClose}</span>
          {!row.isLast && <span className="jv-comma">,</span>}
        </>
      )}
      <button className="jv-copy-btn" onClick={handleCopy} title={`Copy ${row.path}`}>
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  )
})

export default function JsonHighlighter({ data, rawMode = false, forceRaw = false }: { data: unknown; rawMode?: boolean; forceRaw?: boolean }) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set())
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeMapRef = useRef<Map<string, LazyTreeNode>>(new Map())

  const rootNodes = useMemo(() => buildTopLevelNodes(data), [data])

  useEffect(() => {
    const initialExpanded = new Set<string>()
    rootNodes.forEach((node) => {
      if (node.depth < 2 && (node.type === 'object' || node.type === 'array')) {
        const nodeKey = node.path || '__root__'
        initialExpanded.add(nodeKey)
      }
    })
    setExpandedKeys(initialExpanded)
  }, [rootNodes])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setViewportHeight(el.clientHeight)
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const flatRows = useMemo(() => flattenTree(rootNodes, expandedKeys, nodeMapRef.current), [rootNodes, expandedKeys])

  const totalHeight = flatRows.length * ROW_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(flatRows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN)
  const visibleRows = flatRows.slice(startIndex, endIndex)
  const offsetY = startIndex * ROW_HEIGHT

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const handleToggle = useCallback((nodeKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(nodeKey)) {
        next.delete(nodeKey)
      } else {
        next.add(nodeKey)
      }
      return next
    })
  }, [])

  const rawText = useMemo(
    () => (typeof data === 'string' ? data : JSON.stringify(data, null, 2)),
    [data]
  )

  const dataSize = useMemo(() => {
    if (typeof data === 'string') return data.length
    try { return JSON.stringify(data).length } catch { return 0 }
  }, [data])

  const isLargeData = dataSize > LARGE_DATA_THRESHOLD

  if (rawMode || forceRaw) {
    return (
      <div className="json-viewer">
        <pre className="jv-raw">
          <code>{rawText}</code>
        </pre>
      </div>
    )
  }

  if (isLargeData && !forceRaw) {
    return (
      <div className="json-viewer">
        <div className="jv-large-warning">
          <AlertTriangle size={14} />
          <span>Large response ({(dataSize / 1024 / 1024).toFixed(1)} MB). Using virtual rendering for performance.</span>
        </div>
        <div
          ref={containerRef}
          className="jv-tree-virtual"
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleRows.map((row) => (
                <VirtualRow key={row.id} row={row} onToggle={handleToggle} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="json-viewer">
      <div
        ref={containerRef}
        className="jv-tree-virtual"
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleRows.map((row) => (
              <VirtualRow key={row.id} row={row} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
