import { create } from 'zustand'

export interface SshConfig {
  host: string
  port: number
  username: string
  authType: 'password' | 'privateKey'
  password: string
  privateKey: string
  passphrase: string
}

export interface TerminalLine {
  id: string
  text: string
  type: 'output' | 'error' | 'command' | 'info'
}

export type SshConnectionState = 'idle' | 'connecting' | 'shell_ready' | 'error' | 'disconnected'

export type PanelType = 'ssh' | 'browser'

export type LayoutDirection = 'row' | 'column'

export type DropZone = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'tab-before' | 'tab-after'

export interface PanelNode {
  id: string
  type: 'panel'
  panelType: PanelType
  title: string
  size: number
}

export interface SplitNode {
  id: string
  type: 'split'
  direction: LayoutDirection
  children: LayoutNode[]
  size: number
}

export interface TabGroupNode {
  id: string
  type: 'tabgroup'
  activeTabId: string
  children: PanelNode[]
  size: number
}

export type LayoutNode = PanelNode | SplitNode | TabGroupNode

export interface LayoutConfig {
  root: LayoutNode
}

export interface LayoutPanel {
  id: string
  name: string
  layout: LayoutConfig
  sshSessions: Record<string, SshSession>
  browserSessions: Record<string, BrowserSession>
}

export type TerminalStyle = 'classic' | 'light' | 'sepia' | 'ocean'

export interface SshSession {
  id: string
  config: SshConfig
  state: SshConnectionState
  terminalLines: TerminalLine[]
  commandHistory: string[]
  terminalStyle: TerminalStyle
}

export interface BrowserSession {
  id: string
  url: string
  loading: boolean
  history: string[]
}

const STORAGE_KEY = 'remote-tools-layout'
const MAX_LAYOUT_DEPTH = 4
const MAX_UNDO_HISTORY = 20

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function findNode(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return root
  if (root.type === 'panel') return null
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function findParentAndIndex(root: LayoutNode, id: string): { parent: SplitNode; index: number } | null {
  if (root.type === 'panel' || root.type === 'tabgroup') return null
  for (let i = 0; i < root.children.length; i++) {
    if (root.children[i].id === id) {
      return { parent: root, index: i }
    }
    if (root.children[i].type === 'split') {
      const found = findParentAndIndex(root.children[i], id)
      if (found) return found
    }
  }
  return null
}

export function findTabGroupOfPanel(root: LayoutNode, panelId: string): TabGroupNode | null {
  if (root.type === 'panel') return null
  if (root.type === 'tabgroup') {
    if (root.children.some((c) => c.id === panelId)) return root
    return null
  }
  for (const child of root.children) {
    const found = findTabGroupOfPanel(child, panelId)
    if (found) return found
  }
  return null
}

export function getAllPanelNodes(root: LayoutNode): PanelNode[] {
  if (root.type === 'panel') return [root]
  if (root.type === 'tabgroup') return root.children.flatMap((c) => getAllPanelNodes(c))
  return root.children.flatMap(getAllPanelNodes)
}

function getLayoutDepth(node: LayoutNode): number {
  if (node.type === 'panel') return 1
  if (node.type === 'tabgroup') return 1
  return 1 + Math.max(...node.children.map(getLayoutDepth))
}

function normalizeSizes(nodes: LayoutNode[]): LayoutNode[] {
  const totalSize = nodes.reduce((sum, n) => sum + n.size, 0)
  if (totalSize <= 0) return nodes.map((n) => ({ ...n, size: 1 / nodes.length }))
  let changed = false
  const result = nodes.map((n) => {
    const newSize = n.size / totalSize
    if (Math.abs(newSize - n.size) > 1e-10) {
      changed = true
      return { ...n, size: newSize }
    }
    return n
  })
  return changed ? result : nodes
}

function normalizePanelSizes(nodes: PanelNode[]): PanelNode[] {
  const totalSize = nodes.reduce((sum, n) => sum + n.size, 0)
  if (totalSize <= 0) return nodes.map((n) => ({ ...n, size: 1 / nodes.length }))
  let changed = false
  const result = nodes.map((n) => {
    const newSize = n.size / totalSize
    if (Math.abs(newSize - n.size) > 1e-10) {
      changed = true
      return { ...n, size: newSize }
    }
    return n
  })
  return changed ? result : nodes
}

function removeNodeFromTree(root: LayoutNode, id: string): LayoutNode {
  if (root.type === 'panel') return root
  if (root.id === id) return root

  if (root.type === 'tabgroup') {
    const newChildren = root.children.filter((c) => c.id !== id)
    if (newChildren.length === root.children.length) return root
    if (newChildren.length === 0) return { ...root, children: [] }
    const newActiveTabId = root.activeTabId === id ? newChildren[0].id : root.activeTabId
    return { ...root, children: newChildren, activeTabId: newActiveTabId }
  }

  const newChildren: LayoutNode[] = []
  let changed = false

  for (const child of root.children) {
    if (child.id === id) {
      changed = true
      continue
    }
    if (child.type === 'split' || child.type === 'tabgroup') {
      const updated = removeNodeFromTree(child, id)
      if (updated !== child) changed = true
      newChildren.push(updated)
    } else {
      newChildren.push(child)
    }
  }

  if (!changed) return root
  if (newChildren.length === 0) return { ...root, children: [] }
  return { ...root, children: normalizeSizes(newChildren) }
}

function cleanEmptySplits(node: LayoutNode): LayoutNode {
  if (node.type === 'panel') return node

  if (node.type === 'tabgroup') {
    if (node.children.length === 0) return node
    if (node.children.length === 1) {
      return { ...node.children[0], size: node.size }
    }
    return node
  }

  let children = node.children.map(cleanEmptySplits)

  children = children.filter((child) => {
    if (child.type === 'split' && child.children.length === 0) return false
    if (child.type === 'tabgroup' && child.children.length === 0) return false
    return true
  })

  children = children.map((child) => {
    if (child.type === 'split' && child.children.length === 1) {
      return { ...child.children[0], size: child.size }
    }
    if (child.type === 'tabgroup' && child.children.length === 1) {
      return { ...child.children[0], size: child.size }
    }
    return child
  })

  if (children.length === 0) return { ...node, children: [] }
  if (children.length === 1) return { ...children[0], size: node.size }

  return { ...node, children: normalizeSizes(children) }
}

function updateNodeInTree(root: LayoutNode, targetId: string, updater: (node: LayoutNode) => LayoutNode): LayoutNode {
  if (root.id === targetId) return updater(root)
  if (root.type === 'panel') return root

  if (root.type === 'tabgroup') {
    const newChildren = root.children.map((child) => updateNodeInTree(child, targetId, updater))
    const hasChanged = newChildren.some((child, index) => child !== root.children[index])
    if (!hasChanged) return root
    return { ...root, children: newChildren as PanelNode[] }
  }

  const newChildren = root.children.map((child) => updateNodeInTree(child, targetId, updater))
  const hasChanged = newChildren.some((child, index) => child !== root.children[index])
  if (!hasChanged) return root
  return { ...root, children: newChildren }
}

function movePanelInTree(root: LayoutNode, activeId: string, overId: string, zone: DropZone): LayoutNode {
  if (activeId === overId) return root

  const activeNode = findNode(root, activeId)
  if (!activeNode || activeNode.type !== 'panel') return root

  const overNode = findNode(root, overId)
  if (!overNode || overNode.type !== 'panel') return root

  const overInTabGroup = findTabGroupOfPanel(root, overId)
  if (overInTabGroup) return root

  const targetDirection: LayoutDirection = (zone === 'top' || zone === 'bottom') ? 'column' : 'row'
  const insertBefore = (zone === 'top' || zone === 'left')

  const activeNodeCopy: PanelNode = { ...activeNode, size: 0.25 }

  let newRoot = removeNodeFromTree(root, activeId)

  const overInfo = findParentAndIndex(newRoot, overId)

  if (!overInfo) {
    const overNodeAfterRemove = findNode(newRoot, overId)
    if (!overNodeAfterRemove) return root

    const newSplit: SplitNode = {
      id: generateId('split'),
      type: 'split',
      direction: targetDirection,
      children: insertBefore
        ? [{ ...activeNodeCopy, size: 0.5 }, { ...overNodeAfterRemove, size: 0.5 }]
        : [{ ...overNodeAfterRemove, size: 0.5 }, { ...activeNodeCopy, size: 0.5 }],
      size: overNodeAfterRemove.size,
    }
    const result = cleanEmptySplits(newSplit)
    if (getLayoutDepth(result) > MAX_LAYOUT_DEPTH) return root
    return result
  }

  const { parent: overParent, index: overIndex } = overInfo

  if (overParent.direction === targetDirection) {
    const insertIndex = insertBefore ? overIndex : overIndex + 1
    const newChildren = [...overParent.children]
    newChildren.splice(insertIndex, 0, activeNodeCopy)

    const totalSize = newChildren.reduce((s, c) => s + c.size, 0)
    const normalizedChildren = newChildren.map((c) => ({ ...c, size: c.size / totalSize }))

    newRoot = updateNodeInTree(newRoot, overParent.id, () => ({
      ...overParent,
      children: normalizedChildren,
    }))
  } else {
    const overNodeInParent = overParent.children[overIndex]
    const newSplit: SplitNode = {
      id: generateId('split'),
      type: 'split',
      direction: targetDirection,
      children: insertBefore
        ? [{ ...activeNodeCopy, size: 0.5 }, { ...overNodeInParent, size: 0.5 }]
        : [{ ...overNodeInParent, size: 0.5 }, { ...activeNodeCopy, size: 0.5 }],
      size: overNodeInParent.size,
    }

    const newChildren = [...overParent.children]
    newChildren[overIndex] = newSplit

    newRoot = updateNodeInTree(newRoot, overParent.id, () => ({
      ...overParent,
      children: newChildren,
    }))
  }

  const result = cleanEmptySplits(newRoot)
  if (getLayoutDepth(result) > MAX_LAYOUT_DEPTH) return root
  return result
}

function movePanelToTabGroupEdge(root: LayoutNode, activeId: string, tabGroupId: string, zone: DropZone): LayoutNode {
  if (activeId === tabGroupId) return root

  const activeNode = findNode(root, activeId)
  if (!activeNode || activeNode.type !== 'panel') return root

  const tabGroupNode = findNode(root, tabGroupId)
  if (!tabGroupNode || tabGroupNode.type !== 'tabgroup') return root

  const targetDirection: LayoutDirection = (zone === 'top' || zone === 'bottom') ? 'column' : 'row'
  const insertBefore = (zone === 'top' || zone === 'left')

  const activeNodeCopy: PanelNode = { ...activeNode }

  let newRoot = removeNodeFromTree(root, activeId)

  const tabGroupAfterRemove = findNode(newRoot, tabGroupId)
  if (!tabGroupAfterRemove) return root

  const parentInfo = findParentAndIndex(newRoot, tabGroupId)

  if (parentInfo) {
    if (parentInfo.parent.direction === targetDirection) {
      const insertIndex = insertBefore ? parentInfo.index : parentInfo.index + 1
      const newChildren = [...parentInfo.parent.children]
      newChildren.splice(insertIndex, 0, { ...activeNodeCopy })
      newRoot = updateNodeInTree(newRoot, parentInfo.parent.id, () => ({
        ...parentInfo.parent,
        children: normalizeSizes(newChildren),
      }))
    } else {
      const tabGroupInParent = parentInfo.parent.children[parentInfo.index]
      const newSplit: SplitNode = {
        id: generateId('split'),
        type: 'split',
        direction: targetDirection,
        children: insertBefore
          ? normalizeSizes([{ ...activeNodeCopy, size: 0.5 }, { ...tabGroupInParent, size: 0.5 }])
          : normalizeSizes([{ ...tabGroupInParent, size: 0.5 }, { ...activeNodeCopy, size: 0.5 }]),
        size: tabGroupInParent.size,
      }

      const newChildren = [...parentInfo.parent.children]
      newChildren[parentInfo.index] = newSplit
      newRoot = updateNodeInTree(newRoot, parentInfo.parent.id, () => ({
        ...parentInfo.parent,
        children: newChildren,
      }))
    }
  } else {
    const newSplit: SplitNode = {
      id: generateId('split'),
      type: 'split',
      direction: targetDirection,
      children: insertBefore
        ? normalizeSizes([{ ...activeNodeCopy, size: 0.5 }, { ...tabGroupAfterRemove, size: 0.5 }])
        : normalizeSizes([{ ...tabGroupAfterRemove, size: 0.5 }, { ...activeNodeCopy, size: 0.5 }]),
      size: 1,
    }
    newRoot = newSplit
  }

  const result = cleanEmptySplits(newRoot)
  if (getLayoutDepth(result) > MAX_LAYOUT_DEPTH) return root
  return result
}

function movePanelToTabGroupInTree(root: LayoutNode, activeId: string, tabGroupId: string, insertIndex?: number): LayoutNode {
  if (activeId === tabGroupId) return root

  const activeNode = findNode(root, activeId)
  if (!activeNode || activeNode.type !== 'panel') return root

  const tabGroupNode = findNode(root, tabGroupId)
  if (!tabGroupNode || tabGroupNode.type !== 'tabgroup') return root

  if (tabGroupNode.children.some((c) => c.id === activeId)) return root

  const activeNodeCopy: PanelNode = { ...activeNode }

  let newRoot = removeNodeFromTree(root, activeId)

  const tabGroupAfterRemove = findNode(newRoot, tabGroupId)
  if (!tabGroupAfterRemove || tabGroupAfterRemove.type !== 'tabgroup') return root

  const newChildren = [...tabGroupAfterRemove.children]
  const actualInsertIndex = insertIndex !== undefined
    ? Math.min(insertIndex, newChildren.length)
    : newChildren.length
  newChildren.splice(actualInsertIndex, 0, { ...activeNodeCopy, size: 1 })

  newRoot = updateNodeInTree(newRoot, tabGroupId, (node) => ({
    ...node,
    children: normalizePanelSizes(newChildren),
    activeTabId: activeNodeCopy.id,
  }))

  const result = cleanEmptySplits(newRoot)
  if (getLayoutDepth(result) > MAX_LAYOUT_DEPTH) return root
  return result
}

function mergePanelsToTabGroupInTree(root: LayoutNode, activeId: string, overId: string): LayoutNode {
  if (activeId === overId) return root

  const activeNode = findNode(root, activeId)
  if (!activeNode || activeNode.type !== 'panel') return root

  const overNode = findNode(root, overId)
  if (!overNode || overNode.type !== 'panel') return root

  const activeNodeCopy: PanelNode = { ...activeNode }

  const overTabGroup = findTabGroupOfPanel(root, overId)

  let newRoot = removeNodeFromTree(root, activeId)

  if (overTabGroup) {
    const tabGroupAfterRemove = findNode(newRoot, overTabGroup.id)
    if (!tabGroupAfterRemove || tabGroupAfterRemove.type !== 'tabgroup') return root

    const newChildren = [...tabGroupAfterRemove.children, { ...activeNodeCopy, size: 1 }]
    newRoot = updateNodeInTree(newRoot, tabGroupAfterRemove.id, (node) => ({
      ...node,
      children: normalizePanelSizes(newChildren),
      activeTabId: activeNodeCopy.id,
    }))
  } else {
    const overNodeAfterRemove = findNode(newRoot, overId)
    if (!overNodeAfterRemove) return root

    const overNodeCopy: PanelNode = { ...overNode }

    if (overNodeAfterRemove.type === 'panel') {
      const newTabGroup: TabGroupNode = {
        id: generateId('tabgroup'),
        type: 'tabgroup',
        activeTabId: activeNodeCopy.id,
        children: normalizePanelSizes([overNodeCopy, activeNodeCopy]),
        size: overNodeAfterRemove.size,
      }

      const parentInfo = findParentAndIndex(newRoot, overId)
      if (parentInfo) {
        const newChildren = [...parentInfo.parent.children]
        newChildren[parentInfo.index] = newTabGroup
        newRoot = updateNodeInTree(newRoot, parentInfo.parent.id, () => ({
          ...parentInfo.parent,
          children: newChildren,
        }))
      } else {
        newRoot = newTabGroup
      }
    } else {
      return root
    }
  }

  const result = cleanEmptySplits(newRoot)
  if (getLayoutDepth(result) > MAX_LAYOUT_DEPTH) return root
  return result
}

function reorderTabsInGroupInTree(root: LayoutNode, tabGroupId: string, fromIndex: number, toIndex: number): LayoutNode {
  const tabGroup = findNode(root, tabGroupId)
  if (!tabGroup || tabGroup.type !== 'tabgroup') return root
  if (fromIndex === toIndex) return root
  if (fromIndex < 0 || fromIndex >= tabGroup.children.length) return root
  if (toIndex < 0 || toIndex >= tabGroup.children.length) return root

  const newChildren = [...tabGroup.children]
  const [moved] = newChildren.splice(fromIndex, 1)
  newChildren.splice(toIndex, 0, moved)

  return updateNodeInTree(root, tabGroupId, (node) => ({
    ...node,
    children: newChildren,
  }))
}

function isValidLayoutNode(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as Record<string, unknown>
  if (n.type === 'panel') {
    return typeof n.id === 'string' && typeof n.panelType === 'string' && typeof n.title === 'string'
  }
  if (n.type === 'split') {
    if (typeof n.id !== 'string' || (n.direction !== 'row' && n.direction !== 'column') || !Array.isArray(n.children)) return false
    return (n.children as unknown[]).every((child) => isValidLayoutNode(child))
  }
  if (n.type === 'tabgroup') {
    if (typeof n.id !== 'string' || typeof n.activeTabId !== 'string' || !Array.isArray(n.children)) return false
    return (n.children as unknown[]).every((child) => isValidLayoutNode(child))
  }
  return false
}

function migrateOldLayout(old: { panels: Array<{ id: string; type: PanelType; title: string; size: number }> }): LayoutConfig {
  if (!old.panels || old.panels.length === 0) {
    return {
      root: { id: generateId('split'), type: 'split', direction: 'row', children: [], size: 1 },
    }
  }
  if (old.panels.length === 1) {
    const p = old.panels[0]
    return {
      root: { id: p.id, type: 'panel', panelType: p.type, title: p.title, size: 1 },
    }
  }
  if (old.panels.length === 2) {
    return {
      root: {
        id: generateId('split'),
        type: 'split',
        direction: 'row',
        children: old.panels.map((p) => ({
          id: p.id,
          type: 'panel' as const,
          panelType: p.type,
          title: p.title,
          size: p.size,
        })),
        size: 1,
      },
    }
  }
  const panelsAsNodes: PanelNode[] = old.panels.map((p) => ({
    id: p.id,
    type: 'panel' as const,
    panelType: p.type,
    title: p.title,
    size: p.size,
  }))
  return {
    root: {
      id: generateId('tabgroup'),
      type: 'tabgroup',
      activeTabId: panelsAsNodes[0].id,
      children: panelsAsNodes,
      size: 1,
    },
  }
}

function loadLayout(): LayoutConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.root && isValidLayoutNode(parsed.root)) return parsed
      if (parsed.panels) return migrateOldLayout(parsed)
    }
  } catch { /* ignore */ }
  return {
    root: {
      id: generateId('split'),
      type: 'split',
      direction: 'row',
      children: [
        { id: generateId('ssh'), type: 'panel', panelType: 'ssh', title: 'SSH Terminal', size: 0.5 },
        { id: generateId('browser'), type: 'panel', panelType: 'browser', title: 'Web Browser', size: 0.5 },
      ],
      size: 1,
    },
  }
}

function saveLayout(layout: LayoutConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch { /* ignore */ }
}

const MAX_PANELS = 8
const MAX_TERMINAL_LINES = 5000
const MAX_BROWSER_HISTORY = 50
const MAX_COMMAND_HISTORY = 100

const DEFAULT_SSH_CONFIG: SshConfig = {
  host: '',
  port: 22,
  username: '',
  authType: 'password',
  password: '',
  privateKey: '',
  passphrase: '',
}

interface LayoutSnapshot {
  layout: LayoutConfig
  sshSessions: Record<string, SshSession>
  browserSessions: Record<string, BrowserSession>
}

interface RemoteToolsState {
  layout: LayoutConfig
  undoStack: LayoutSnapshot[]
  redoStack: LayoutSnapshot[]
  focusedPanelId: string | null
  defaultTerminalStyle: TerminalStyle | 'auto'

  layoutPanels: LayoutPanel[]
  activeLayoutPanelId: string

  addPanel: (type: PanelType) => string | null
  removePanel: (id: string) => void
  movePanelToZone: (activeId: string, overId: string, zone: DropZone) => void
  movePanelToTabGroup: (activeId: string, tabGroupId: string, insertIndex?: number) => void
  reorderTabsInGroup: (tabGroupId: string, fromIndex: number, toIndex: number) => void
  resizeNode: (id: string, delta: number) => void
  setPanelTitle: (id: string, title: string) => void
  setActiveTab: (tabGroupId: string, panelId: string) => void
  resetLayout: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearSshCredentials: (id: string) => void
  syncSessionsAfterRestore: () => void

  addLayoutPanel: (name?: string) => string
  removeLayoutPanel: (id: string) => void
  switchLayoutPanel: (id: string) => void
  renameLayoutPanel: (id: string, name: string) => void

  sshSessions: Record<string, SshSession>
  initSshSession: (id: string) => void
  updateSshConfig: (id: string, config: Partial<SshConfig>) => void
  setSshState: (id: string, state: SshConnectionState) => void
  addTerminalLine: (id: string, line: Omit<TerminalLine, 'id'>) => void
  clearTerminal: (id: string) => void
  addCommandHistory: (id: string, command: string) => void
  setTerminalStyle: (id: string, style: TerminalStyle) => void
  setDefaultTerminalStyle: (style: TerminalStyle | 'auto') => void
  resolveTerminalStyle: (sessionStyle: TerminalStyle) => TerminalStyle

  browserSessions: Record<string, BrowserSession>
  initBrowserSession: (id: string) => void
  setBrowserUrl: (id: string, url: string) => void
  setBrowserLoading: (id: string, loading: boolean) => void
  addBrowserHistory: (id: string, url: string) => void
}

function resolveAutoStyle(): TerminalStyle {
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
  return isDark ? 'classic' : 'light'
}

function createSshSession(id: string, style?: TerminalStyle): SshSession {
  return {
    id,
    config: { ...DEFAULT_SSH_CONFIG },
    state: 'idle',
    terminalLines: [],
    commandHistory: [],
    terminalStyle: style ?? resolveAutoStyle(),
  }
}

function createBrowserSession(id: string): BrowserSession {
  return {
    id,
    url: '',
    loading: false,
    history: [],
  }
}

function takeSnapshot(state: { layout: LayoutConfig; sshSessions: Record<string, SshSession>; browserSessions: Record<string, BrowserSession> }): LayoutSnapshot {
  return {
    layout: { root: state.layout.root },
    sshSessions: { ...state.sshSessions },
    browserSessions: { ...state.browserSessions },
  }
}

function loadLayoutPanels(): { panels: LayoutPanel[]; activeId: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY + '-panels')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.panels) && parsed.panels.length > 0 && parsed.activeId) {
        return { panels: parsed.panels, activeId: parsed.activeId }
      }
    }
  } catch { /* ignore */ }

  const initialLayout = loadLayout()
  const allPanels = getAllPanelNodes(initialLayout.root)
  const panel: LayoutPanel = {
    id: generateId('panel'),
    name: 'Layout 1',
    layout: initialLayout,
    sshSessions: {},
    browserSessions: {},
  }
  for (const p of allPanels) {
    if (p.panelType === 'ssh') {
      panel.sshSessions[p.id] = createSshSession(p.id)
    } else {
      panel.browserSessions[p.id] = createBrowserSession(p.id)
    }
  }
  return { panels: [panel], activeId: panel.id }
}

function saveLayoutPanels(panels: LayoutPanel[], activeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY + '-panels', JSON.stringify({ panels, activeId }))
  } catch { /* ignore */ }
}

export const useRemoteToolsStore = create<RemoteToolsState>()((set, get) => {
  const { panels: initialPanels, activeId: initialActiveId } = loadLayoutPanels()
  const activePanel = initialPanels.find((p) => p.id === initialActiveId) ?? initialPanels[0]

  return {
    layout: activePanel.layout,
    undoStack: [],
    redoStack: [],
    focusedPanelId: null,
    defaultTerminalStyle: 'auto',
    layoutPanels: initialPanels,
    activeLayoutPanelId: initialActiveId,

    sshSessions: activePanel.sshSessions,
    browserSessions: activePanel.browserSessions,

    addPanel: (type) => {
      const panelId = generateId(type)
      set((state) => {
        const allPanels = getAllPanelNodes(state.layout.root)
        if (allPanels.length >= MAX_PANELS) return state

        const newPanel: PanelNode = {
          id: panelId,
          type: 'panel',
          panelType: type,
          title: type === 'ssh' ? 'SSH Terminal' : 'Web Browser',
          size: 1,
        }

        let newRoot: LayoutNode

        if (state.layout.root.type === 'panel') {
          newRoot = {
            id: generateId('tabgroup'),
            type: 'tabgroup',
            activeTabId: newPanel.id,
            children: normalizePanelSizes([{ ...state.layout.root, size: 1 }, newPanel]),
            size: 1,
          }
        } else if (state.focusedPanelId) {
          const focusedTabGroup = findTabGroupOfPanel(state.layout.root, state.focusedPanelId)
          if (focusedTabGroup) {
            const newChildren = [...focusedTabGroup.children, newPanel]
            newRoot = updateNodeInTree(state.layout.root, focusedTabGroup.id, (node) => ({
              ...node,
              children: normalizePanelSizes(newChildren),
              activeTabId: newPanel.id,
            }))
          } else {
            const focusedNode = findNode(state.layout.root, state.focusedPanelId)
            if (focusedNode && focusedNode.type === 'panel') {
              const newTabGroup: TabGroupNode = {
                id: generateId('tabgroup'),
                type: 'tabgroup',
                activeTabId: newPanel.id,
                children: normalizePanelSizes([{ ...focusedNode, size: 1 }, newPanel]),
                size: focusedNode.size,
              }
              const parentInfo = findParentAndIndex(state.layout.root, state.focusedPanelId)
              if (parentInfo) {
                const newChildren = [...parentInfo.parent.children]
                newChildren[parentInfo.index] = newTabGroup
                newRoot = updateNodeInTree(state.layout.root, parentInfo.parent.id, () => ({
                  ...parentInfo.parent,
                  children: newChildren,
                }))
              } else {
                newRoot = newTabGroup
              }
            } else {
              newRoot = state.layout.root
            }
          }
        } else if (state.layout.root.type === 'tabgroup') {
          const newChildren = [...state.layout.root.children, newPanel]
          newRoot = {
            ...state.layout.root,
            children: normalizePanelSizes(newChildren),
            activeTabId: newPanel.id,
          }
        } else if (state.layout.root.type === 'split') {
          const firstChild = state.layout.root.children[0]
          if (firstChild) {
            if (firstChild.type === 'tabgroup') {
              const newChildren = [...firstChild.children, newPanel]
              newRoot = updateNodeInTree(state.layout.root, firstChild.id, () => ({
                ...firstChild,
                children: normalizePanelSizes(newChildren),
                activeTabId: newPanel.id,
              }))
            } else if (firstChild.type === 'panel') {
              const newTabGroup: TabGroupNode = {
                id: generateId('tabgroup'),
                type: 'tabgroup',
                activeTabId: newPanel.id,
                children: normalizePanelSizes([{ ...firstChild, size: 1 }, newPanel]),
                size: firstChild.size,
              }
              const newChildren = [...state.layout.root.children]
              newChildren[0] = newTabGroup
              newRoot = { ...state.layout.root, children: normalizeSizes(newChildren) }
            } else {
              newRoot = state.layout.root
            }
          } else {
            newRoot = state.layout.root
          }
        } else {
          newRoot = state.layout.root
        }

        const layout = { ...state.layout, root: newRoot }
        saveLayout(layout)

        const newSshSessions = { ...state.sshSessions }
        const newBrowserSessions = { ...state.browserSessions }
        if (type === 'ssh') {
          newSshSessions[panelId] = createSshSession(panelId)
        } else {
          newBrowserSessions[panelId] = createBrowserSession(panelId)
        }

        const undoStack = [...state.undoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId
            ? { ...p, layout, sshSessions: newSshSessions, browserSessions: newBrowserSessions }
            : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, sshSessions: newSshSessions, browserSessions: newBrowserSessions, undoStack, redoStack: [], layoutPanels: newLayoutPanels }
      })
      return panelId
    },

    removePanel: (id) => {
      set((state) => {
        let newRoot = removeNodeFromTree(state.layout.root, id)
        newRoot = cleanEmptySplits(newRoot)

        const undoStack = [...state.undoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)

        if (newRoot.type === 'split' && newRoot.children.length === 0) {
          const layout: LayoutConfig = { root: { id: generateId('split'), type: 'split', direction: 'row', children: [], size: 1 } }
          saveLayout(layout)
          const newSshSessions = { ...state.sshSessions }
          const newBrowserSessions = { ...state.browserSessions }
          delete newSshSessions[id]
          delete newBrowserSessions[id]

          const newLayoutPanels = state.layoutPanels.map((p) =>
            p.id === state.activeLayoutPanelId
              ? { ...p, layout, sshSessions: newSshSessions, browserSessions: newBrowserSessions }
              : p
          )
          saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

          return { layout, sshSessions: newSshSessions, browserSessions: newBrowserSessions, undoStack, redoStack: [], layoutPanels: newLayoutPanels }
        }

        const layout = { ...state.layout, root: newRoot }
        saveLayout(layout)

        const newSshSessions = { ...state.sshSessions }
        const newBrowserSessions = { ...state.browserSessions }
        delete newSshSessions[id]
        delete newBrowserSessions[id]

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId
            ? { ...p, layout, sshSessions: newSshSessions, browserSessions: newBrowserSessions }
            : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, sshSessions: newSshSessions, browserSessions: newBrowserSessions, undoStack, redoStack: [], layoutPanels: newLayoutPanels }
      })
    },

    movePanelToZone: (activeId, overId, zone) => {
      set((state) => {
        let newRoot: LayoutNode

        if (zone === 'center') {
          const overNode = findNode(state.layout.root, overId)
          if (overNode?.type === 'tabgroup') {
            newRoot = movePanelToTabGroupInTree(state.layout.root, activeId, overId)
          } else {
            newRoot = mergePanelsToTabGroupInTree(state.layout.root, activeId, overId)
          }
        } else if (zone === 'tab-before' || zone === 'tab-after') {
          const overTabGroup = findTabGroupOfPanel(state.layout.root, overId)
          if (overTabGroup) {
            const overIndex = overTabGroup.children.findIndex((c) => c.id === overId)
            const insertIndex = zone === 'tab-before' ? overIndex : overIndex + 1
            newRoot = movePanelToTabGroupInTree(state.layout.root, activeId, overTabGroup.id, insertIndex)
          } else {
            newRoot = state.layout.root
          }
        } else {
          const overNode = findNode(state.layout.root, overId)
          if (overNode?.type === 'tabgroup') {
            newRoot = movePanelToTabGroupEdge(state.layout.root, activeId, overId, zone)
          } else {
            newRoot = movePanelInTree(state.layout.root, activeId, overId, zone)
          }
        }

        if (newRoot === state.layout.root) return state

        const layout = { ...state.layout, root: newRoot }
        saveLayout(layout)
        const undoStack = [...state.undoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId ? { ...p, layout } : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, undoStack, redoStack: [], layoutPanels: newLayoutPanels }
      })
    },

    movePanelToTabGroup: (activeId, tabGroupId, insertIndex) => {
      set((state) => {
        const newRoot = movePanelToTabGroupInTree(state.layout.root, activeId, tabGroupId, insertIndex)
        if (newRoot === state.layout.root) return state

        const layout = { ...state.layout, root: newRoot }
        saveLayout(layout)
        const undoStack = [...state.undoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId ? { ...p, layout } : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, undoStack, redoStack: [], layoutPanels: newLayoutPanels }
      })
    },

    reorderTabsInGroup: (tabGroupId, fromIndex, toIndex) => {
      set((state) => {
        const newRoot = reorderTabsInGroupInTree(state.layout.root, tabGroupId, fromIndex, toIndex)
        if (newRoot === state.layout.root) return state

        const layout = { ...state.layout, root: newRoot }
        saveLayout(layout)
        const undoStack = [...state.undoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId ? { ...p, layout } : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, undoStack, redoStack: [], layoutPanels: newLayoutPanels }
      })
    },

    resizeNode: (id, delta) => {
      set((state) => {
        const parentInfo = findParentAndIndex(state.layout.root, id)
        if (!parentInfo) return state
        const { index } = parentInfo
        const parentId = parentInfo.parent.id

        const newRoot = updateNodeInTree(state.layout.root, parentId, (node) => {
          if (node.type !== 'split') return node
          const children = node.children.map((c) => ({ ...c }))
          if (index >= children.length - 1) return node
          const newSize = children[index].size + delta
          const newNextSize = children[index + 1].size - delta
          if (newSize < 0.1 || newNextSize < 0.1) return node
          children[index] = { ...children[index], size: newSize }
          children[index + 1] = { ...children[index + 1], size: newNextSize }
          const totalSize = children.reduce((sum, c) => sum + c.size, 0)
          return { ...node, children: children.map(c => ({ ...c, size: c.size / totalSize })) }
        })

        if (newRoot === state.layout.root) return state

        const layout = { ...state.layout, root: newRoot }
        saveLayout(layout)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId ? { ...p, layout } : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, layoutPanels: newLayoutPanels }
      })
    },

    setPanelTitle: (id, title) => {
      set((state) => {
        const newRoot = updateNodeInTree(state.layout.root, id, (node) => {
          if (node.type === 'panel') return { ...node, title }
          if (node.type === 'tabgroup') {
            return {
              ...node,
              children: node.children.map((c) =>
                c.id === id ? { ...c, title } : c
              ),
            }
          }
          return node
        })

        if (newRoot === state.layout.root) return state

        const layout = { ...state.layout, root: newRoot }
        saveLayout(layout)
        const undoStack = [...state.undoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId ? { ...p, layout } : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, undoStack, redoStack: [], layoutPanels: newLayoutPanels }
      })
    },

    setActiveTab: (tabGroupId, panelId) => {
      set((state) => {
        const newRoot = updateNodeInTree(state.layout.root, tabGroupId, (node) => {
          if (node.type !== 'tabgroup') return node
          if (!node.children.some((c) => c.id === panelId)) return node
          return { ...node, activeTabId: panelId }
        })

        if (newRoot === state.layout.root) return state

        const layout = { ...state.layout, root: newRoot }
        saveLayout(layout)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId ? { ...p, layout } : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, layoutPanels: newLayoutPanels }
      })
    },

    resetLayout: () => {
      set((state) => {
        for (const panel of getAllPanelNodes(state.layout.root)) {
          if (panel.panelType === 'ssh') {
            window.electronAPI?.sshDisconnect(panel.id)
            window.electronAPI?.sshDestroySession(panel.id)
          }
        }
        const layout: LayoutConfig = {
          root: {
            id: generateId('split'),
            type: 'split',
            direction: 'row',
            children: [
              { id: generateId('ssh'), type: 'panel', panelType: 'ssh', title: 'SSH Terminal', size: 0.5 },
              { id: generateId('browser'), type: 'panel', panelType: 'browser', title: 'Web Browser', size: 0.5 },
            ],
            size: 1,
          },
        }
        saveLayout(layout)
        const sshSessions: Record<string, SshSession> = {}
        const browserSessions: Record<string, BrowserSession> = {}
        for (const panel of getAllPanelNodes(layout.root)) {
          if (panel.panelType === 'ssh') {
            sshSessions[panel.id] = createSshSession(panel.id)
          } else {
            browserSessions[panel.id] = createBrowserSession(panel.id)
          }
        }
        const undoStack = [...state.undoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId
            ? { ...p, layout, sshSessions, browserSessions }
            : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return { layout, sshSessions, browserSessions, undoStack, redoStack: [], layoutPanels: newLayoutPanels }
      })
    },

    undo: () => {
      set((state) => {
        if (state.undoStack.length === 0) return state
        const snapshot = state.undoStack[state.undoStack.length - 1]
        const redoStack = [...state.redoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)
        saveLayout(snapshot.layout)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId
            ? { ...p, layout: snapshot.layout, sshSessions: snapshot.sshSessions, browserSessions: snapshot.browserSessions }
            : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return {
          layout: snapshot.layout,
          sshSessions: snapshot.sshSessions,
          browserSessions: snapshot.browserSessions,
          undoStack: state.undoStack.slice(0, -1),
          redoStack,
          layoutPanels: newLayoutPanels,
        }
      })
    },

    redo: () => {
      set((state) => {
        if (state.redoStack.length === 0) return state
        const snapshot = state.redoStack[state.redoStack.length - 1]
        const undoStack = [...state.undoStack, takeSnapshot(state)].slice(-MAX_UNDO_HISTORY)
        saveLayout(snapshot.layout)

        const newLayoutPanels = state.layoutPanels.map((p) =>
          p.id === state.activeLayoutPanelId
            ? { ...p, layout: snapshot.layout, sshSessions: snapshot.sshSessions, browserSessions: snapshot.browserSessions }
            : p
        )
        saveLayoutPanels(newLayoutPanels, state.activeLayoutPanelId)

        return {
          layout: snapshot.layout,
          sshSessions: snapshot.sshSessions,
          browserSessions: snapshot.browserSessions,
          undoStack,
          redoStack: state.redoStack.slice(0, -1),
          layoutPanels: newLayoutPanels,
        }
      })
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    clearSshCredentials: (id) => {
      set((state) => {
        const session = state.sshSessions[id]
        if (!session) return state
        return {
          sshSessions: {
            ...state.sshSessions,
            [id]: {
              ...session,
              config: {
                ...session.config,
                password: '',
                privateKey: '',
                passphrase: '',
              },
            },
          },
        }
      })
    },

    syncSessionsAfterRestore: () => {
      set((state) => {
        const panels = getAllPanelNodes(state.layout.root)
        const panelIds = new Set(panels.map((p) => p.id))
        const newSshSessions = { ...state.sshSessions }
        const newBrowserSessions = { ...state.browserSessions }

        for (const id of Object.keys(newSshSessions)) {
          if (!panelIds.has(id)) delete newSshSessions[id]
        }
        for (const id of Object.keys(newBrowserSessions)) {
          if (!panelIds.has(id)) delete newBrowserSessions[id]
        }

        for (const panel of panels) {
          if (panel.panelType === 'ssh' && !newSshSessions[panel.id]) {
            newSshSessions[panel.id] = createSshSession(panel.id)
          } else if (panel.panelType === 'browser' && !newBrowserSessions[panel.id]) {
            newBrowserSessions[panel.id] = createBrowserSession(panel.id)
          }
        }

        return { sshSessions: newSshSessions, browserSessions: newBrowserSessions }
      })
    },

    addLayoutPanel: (name) => {
      const id = generateId('panel')
      const panelName = name || `Layout ${get().layoutPanels.length + 1}`
      const newPanel: LayoutPanel = {
        id,
        name: panelName,
        layout: {
          root: {
            id: generateId('split'),
            type: 'split',
            direction: 'row',
            children: [],
            size: 1,
          },
        },
        sshSessions: {},
        browserSessions: {},
      }
      set((state) => {
        const newPanels = [...state.layoutPanels, newPanel]
        saveLayoutPanels(newPanels, id)
        return {
          layoutPanels: newPanels,
          activeLayoutPanelId: id,
          layout: newPanel.layout,
          sshSessions: newPanel.sshSessions,
          browserSessions: newPanel.browserSessions,
          undoStack: [],
          redoStack: [],
        }
      })
      return id
    },

    removeLayoutPanel: (id) => {
      set((state) => {
        if (state.layoutPanels.length <= 1) return state

        for (const panel of getAllPanelNodes(state.layout.root)) {
          if (panel.panelType === 'ssh') {
            window.electronAPI?.sshDisconnect(panel.id)
            window.electronAPI?.sshDestroySession(panel.id)
          }
        }

        const newPanels = state.layoutPanels.filter((p) => p.id !== id)
        const newActiveId = state.activeLayoutPanelId === id ? newPanels[0].id : state.activeLayoutPanelId
        const activePanel = newPanels.find((p) => p.id === newActiveId) ?? newPanels[0]

        saveLayoutPanels(newPanels, newActiveId)

        return {
          layoutPanels: newPanels,
          activeLayoutPanelId: newActiveId,
          layout: activePanel.layout,
          sshSessions: activePanel.sshSessions,
          browserSessions: activePanel.browserSessions,
          undoStack: [],
          redoStack: [],
        }
      })
    },

    switchLayoutPanel: (id) => {
      set((state) => {
        if (state.activeLayoutPanelId === id) return state

        const currentPanel = state.layoutPanels.find((p) => p.id === state.activeLayoutPanelId)
        const targetPanel = state.layoutPanels.find((p) => p.id === id)
        if (!targetPanel) return state

        const updatedPanels = state.layoutPanels.map((p) => {
          if (p.id === state.activeLayoutPanelId && currentPanel) {
            return {
              ...p,
              layout: state.layout,
              sshSessions: state.sshSessions,
              browserSessions: state.browserSessions,
            }
          }
          return p
        })

        saveLayoutPanels(updatedPanels, id)

        return {
          layoutPanels: updatedPanels,
          activeLayoutPanelId: id,
          layout: targetPanel.layout,
          sshSessions: targetPanel.sshSessions,
          browserSessions: targetPanel.browserSessions,
          undoStack: [],
          redoStack: [],
        }
      })
    },

    renameLayoutPanel: (id, name) => {
      set((state) => {
        const newPanels = state.layoutPanels.map((p) =>
          p.id === id ? { ...p, name } : p
        )
        saveLayoutPanels(newPanels, state.activeLayoutPanelId)
        return { layoutPanels: newPanels }
      })
    },

    initSshSession: (id) => {
      const resolvedStyle = get().resolveTerminalStyle('classic')
      set((state) => ({
        sshSessions: { ...state.sshSessions, [id]: createSshSession(id, resolvedStyle) },
      }))
    },
    updateSshConfig: (id, config) =>
      set((state) => {
        const session = state.sshSessions[id]
        if (!session) return state
        return {
          sshSessions: {
            ...state.sshSessions,
            [id]: { ...session, config: { ...session.config, ...config } },
          },
        }
      }),
    setSshState: (id, sshState) =>
      set((state) => {
        const session = state.sshSessions[id]
        if (!session) return state
        return {
          sshSessions: { ...state.sshSessions, [id]: { ...session, state: sshState } },
        }
      }),
    addTerminalLine: (id, line) =>
      set((state) => {
        const session = state.sshSessions[id]
        if (!session) return state
        const updated = [
          ...session.terminalLines,
          { ...line, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` },
        ].slice(-MAX_TERMINAL_LINES)
        return {
          sshSessions: { ...state.sshSessions, [id]: { ...session, terminalLines: updated } },
        }
      }),
    clearTerminal: (id) =>
      set((state) => {
        const session = state.sshSessions[id]
        if (!session) return state
        return {
          sshSessions: { ...state.sshSessions, [id]: { ...session, terminalLines: [] } },
        }
      }),
    addCommandHistory: (id, command) =>
      set((state) => {
        const session = state.sshSessions[id]
        if (!session) return state
        const trimmed = command.trim()
        if (!trimmed) return state
        const filtered = session.commandHistory.filter((c) => c !== trimmed)
        const updated = [...filtered, trimmed].slice(-MAX_COMMAND_HISTORY)
        return {
          sshSessions: { ...state.sshSessions, [id]: { ...session, commandHistory: updated } },
        }
      }),

    setTerminalStyle: (id, style) =>
      set((state) => {
        const session = state.sshSessions[id]
        if (!session) return state
        return {
          sshSessions: { ...state.sshSessions, [id]: { ...session, terminalStyle: style } },
        }
      }),

    setDefaultTerminalStyle: (style) =>
      set({ defaultTerminalStyle: style }),

    resolveTerminalStyle: (_sessionStyle) => {
      const { defaultTerminalStyle } = get()
      if (defaultTerminalStyle !== 'auto') return defaultTerminalStyle
      return resolveAutoStyle()
    },

    initBrowserSession: (id) =>
      set((state) => ({
        browserSessions: { ...state.browserSessions, [id]: createBrowserSession(id) },
      })),
    setBrowserUrl: (id, url) =>
      set((state) => {
        const session = state.browserSessions[id]
        if (!session) return state
        return {
          browserSessions: { ...state.browserSessions, [id]: { ...session, url } },
        }
      }),
    setBrowserLoading: (id, loading) =>
      set((state) => {
        const session = state.browserSessions[id]
        if (!session) return state
        return {
          browserSessions: { ...state.browserSessions, [id]: { ...session, loading } },
        }
      }),
    addBrowserHistory: (id, url) =>
      set((state) => {
        const session = state.browserSessions[id]
        if (!session) return state
        if (session.history.includes(url)) return state
        const updated = [...session.history, url].slice(-MAX_BROWSER_HISTORY)
        return {
          browserSessions: { ...state.browserSessions, [id]: { ...session, history: updated } },
        }
      }),
  }
})
