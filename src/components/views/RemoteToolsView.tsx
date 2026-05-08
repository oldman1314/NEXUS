import React, { useCallback, useRef, Fragment, useState, useEffect, Suspense, lazy } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragMoveEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  CollisionDetection,
  Over,
  Modifier,
  DroppableContainer,
} from '@dnd-kit/core'
import { Terminal, Globe, LayoutGrid, RotateCcw, Undo2, Redo2, X, Plus, Palette } from 'lucide-react'
import {
  useRemoteToolsStore,
  type PanelType,
  type PanelNode,
  type LayoutNode,
  type DropZone,
  type TabGroupNode,
  type TerminalStyle,
  getAllPanelNodes,
  findNode,
} from '@/stores/useRemoteToolsStore'
const SshTerminal = lazy(() => import('@/components/remote-tools/SshTerminal'))
const WebBrowser = lazy(() => import('@/components/remote-tools/WebBrowser'))
import PanelContainer from '@/components/remote-tools/PanelContainer'
import PanelErrorBoundary from '@/components/remote-tools/PanelErrorBoundary'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Tooltip from '@/components/common/Tooltip'
import Popover from '@/components/common/Popover'
import '../remote-tools/remote-tools-view.css'

const snapCenterToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (draggingNodeRect && activatorEvent instanceof MouseEvent) {
    const activatorOffsetX = activatorEvent.clientX - draggingNodeRect.left
    const activatorOffsetY = activatorEvent.clientY - draggingNodeRect.top
    return {
      ...transform,
      x: transform.x + activatorOffsetX - draggingNodeRect.width / 2,
      y: transform.y + activatorOffsetY - draggingNodeRect.height / 2,
    }
  }
  return transform
}

interface DropZoneInfo {
  overId: string
  zone: DropZone
  tabInsertIndex?: number
}

interface DraggablePanelProps {
  panel: PanelNode
  onClose: (id: string) => void
  onTitleChange: (id: string, title: string) => void
  dropZoneInfo: DropZoneInfo | null
  deadZoneOverId: string | null
  focusedPanelId: string | null
  onPanelFocus: (id: string) => void
  isNewSshPanel: boolean
}

const DraggablePanel = React.memo(function DraggablePanel({ panel, onClose, onTitleChange, dropZoneInfo, deadZoneOverId, focusedPanelId, onPanelFocus, isNewSshPanel }: DraggablePanelProps) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: panel.id,
    data: { type: 'panel', panel },
  })

  const { setNodeRef: setDropRef } = useDroppable({
    id: panel.id,
    data: { type: 'panel', panel },
  })

  const setNodeRef = useCallback((node: HTMLElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }, [setDragRef, setDropRef])

  const isDropTarget = (dropZoneInfo?.overId === panel.id || deadZoneOverId === panel.id) && !isDragging
  const zone = dropZoneInfo?.overId === panel.id ? dropZoneInfo.zone : null
  const isCenterTarget = zone === 'center'
  const isEdgeZone = zone && ['top', 'bottom', 'left', 'right'].includes(zone)
  const isDeadZoneTarget = deadZoneOverId === panel.id && !zone && !isDragging

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
  }

  const className = [
    'remote-tools-panel-wrapper',
    isDropTarget && isEdgeZone ? 'remote-tools-panel-drop-target' : '',
    isCenterTarget ? 'remote-tools-panel-center-target' : '',
    isDeadZoneTarget ? 'remote-tools-panel-dead-zone' : '',
    focusedPanelId === panel.id ? 'remote-tools-panel-focused' : '',
  ].filter(Boolean).join(' ')

  return (
    <div ref={setNodeRef} style={style} className={className} onClick={() => onPanelFocus(panel.id)}>
      {isEdgeZone && <div className={`drop-indicator drop-indicator-${zone}`} />}
      {isCenterTarget && <div className="drop-indicator drop-indicator-center" />}
      <PanelErrorBoundary panelId={panel.id} panelTitle={panel.title}>
        <PanelContainer
          panelId={panel.id}
          panelType={panel.panelType}
          title={panel.title}
          onClose={onClose}
          onTitleChange={onTitleChange}
          dragHandleProps={listeners}
          dragHandleAttrs={attributes}
          autoOpenSshSettings={isNewSshPanel}
        >
          {panel.panelType === 'ssh' ? (
            <Suspense fallback={<div className="panel-loading-skeleton"><div className="panel-loading-skeleton-bar" /><div className="panel-loading-skeleton-bar" /><div className="panel-loading-skeleton-bar" /></div>}>
              <SshTerminal sessionId={panel.id} />
            </Suspense>
          ) : (
            <Suspense fallback={<div className="panel-loading-skeleton"><div className="panel-loading-skeleton-bar" /><div className="panel-loading-skeleton-bar" /><div className="panel-loading-skeleton-bar" /></div>}>
              <WebBrowser sessionId={panel.id} />
            </Suspense>
          )}
        </PanelContainer>
      </PanelErrorBoundary>
    </div>
  )
})

interface ResizeHandleProps {
  resizeChildId: string
  isRow: boolean
  onResizeStart: (resizeChildId: string, isRow: boolean, e: React.MouseEvent) => void
}

function ResizeHandle({ resizeChildId, isRow, onResizeStart }: ResizeHandleProps) {
  return (
    <div
      className={`resize-handle ${isRow ? 'resize-handle-row' : 'resize-handle-col'}`}
      onMouseDown={(e) => onResizeStart(resizeChildId, isRow, e)}
    >
      <div className={`resize-handle-line ${isRow ? 'resize-handle-vertical' : 'resize-handle-horizontal'}`} />
    </div>
  )
}

interface TabGroupRendererProps {
  node: TabGroupNode
  onClose: (id: string) => void
  onTitleChange: (id: string, title: string) => void
  onSetActiveTab: (tabGroupId: string, panelId: string) => void
  onPanelFocus: (id: string) => void
  dropZoneInfo: DropZoneInfo | null
}

const TabGroupRenderer = React.memo(function TabGroupRenderer({ node, onClose, onTitleChange, onSetActiveTab, onPanelFocus, dropZoneInfo }: TabGroupRendererProps) {
  const { setNodeRef: setDropRef } = useDroppable({
    id: node.id,
    data: { type: 'tabgroup', node },
  })

  const activePanel = node.children.find((c) => c.id === node.activeTabId) ?? node.children[0]
  if (!activePanel) return null

  const isCenterTarget = dropZoneInfo?.overId === node.id && dropZoneInfo.zone === 'center'
  const isEdgeTarget = dropZoneInfo?.overId === node.id && ['top', 'bottom', 'left', 'right'].includes(dropZoneInfo.zone)
  const zone = isEdgeTarget ? dropZoneInfo.zone : null

  return (
    <div ref={setDropRef} data-id={node.id} className="layout-tabgroup" style={{ position: 'relative' }}>
      {zone && <div className={`drop-indicator drop-indicator-${zone}`} />}
      {isCenterTarget && <div className="drop-indicator drop-indicator-center" />}
      <div className="layout-tabgroup-tabs">
        {node.children.map((child) => {
          const isTabDropBefore = dropZoneInfo?.overId === child.id && dropZoneInfo.zone === 'tab-before'
          const isTabDropAfter = dropZoneInfo?.overId === child.id && dropZoneInfo.zone === 'tab-after'

          return (
            <DraggableTab
              key={child.id}
              child={child}
              tabGroupId={node.id}
              isActive={child.id === activePanel.id}
              isTabDropBefore={isTabDropBefore}
              isTabDropAfter={isTabDropAfter}
              onSetActiveTab={onSetActiveTab}
              onClose={onClose}
            />
          )
        })}
      </div>
      <div className="layout-tabgroup-content" onClick={() => onPanelFocus(activePanel.id)}>
        <PanelErrorBoundary panelId={activePanel.id} panelTitle={activePanel.title}>
          <PanelContainer
            panelId={activePanel.id}
            panelType={activePanel.panelType}
            title={activePanel.title}
            onClose={onClose}
            onTitleChange={onTitleChange}
          >
            {activePanel.panelType === 'ssh' ? (
              <Suspense fallback={<div className="panel-loading-skeleton"><div className="panel-loading-skeleton-bar" /><div className="panel-loading-skeleton-bar" /><div className="panel-loading-skeleton-bar" /></div>}>
                <SshTerminal sessionId={activePanel.id} />
              </Suspense>
            ) : (
              <Suspense fallback={<div className="panel-loading-skeleton"><div className="panel-loading-skeleton-bar" /><div className="panel-loading-skeleton-bar" /><div className="panel-loading-skeleton-bar" /></div>}>
                <WebBrowser sessionId={activePanel.id} />
              </Suspense>
            )}
          </PanelContainer>
        </PanelErrorBoundary>
      </div>
    </div>
  )
})

interface DraggableTabProps {
  child: PanelNode
  tabGroupId: string
  isActive: boolean
  isTabDropBefore: boolean
  isTabDropAfter: boolean
  onSetActiveTab: (tabGroupId: string, panelId: string) => void
  onClose: (id: string) => void
}

const DraggableTab = React.memo(function DraggableTab({ child, tabGroupId, isActive, isTabDropBefore, isTabDropAfter, onSetActiveTab, onClose }: DraggableTabProps) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `tab-${child.id}`,
    data: { type: 'tab', panel: child, tabGroupId },
  })

  const { setNodeRef: setDropRef } = useDroppable({
    id: child.id,
    data: { type: 'tab', panel: child, tabGroupId },
  })

  const setNodeRef = useCallback((node: HTMLElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }, [setDragRef, setDropRef])

  return (
    <div
      ref={setNodeRef}
      data-panel-id={child.id}
      style={{ position: 'relative', opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
    >
      {isTabDropBefore && <div className="drop-indicator-tab drop-indicator-tab-before" />}
      <button
        className={`layout-tabgroup-tab ${isActive ? 'layout-tabgroup-tab-active' : ''}`}
        onClick={() => onSetActiveTab(tabGroupId, child.id)}
      >
        <span className="layout-tabgroup-tab-icon">
          {child.panelType === 'ssh' ? <Terminal size={11} /> : <Globe size={11} />}
        </span>
        <span className="layout-tabgroup-tab-title">{child.title}</span>
        <button
          className="layout-tabgroup-tab-close"
          onClick={(e) => {
            e.stopPropagation()
            onClose(child.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X size={10} />
        </button>
      </button>
      {isTabDropAfter && <div className="drop-indicator-tab drop-indicator-tab-after" />}
    </div>
  )
})

interface LayoutNodeRendererProps {
  node: LayoutNode
  onClose: (id: string) => void
  onTitleChange: (id: string, title: string) => void
  onSetActiveTab: (tabGroupId: string, panelId: string) => void
  dropZoneInfo: DropZoneInfo | null
  deadZoneOverId: string | null
  onResizeStart: (resizeChildId: string, isRow: boolean, e: React.MouseEvent) => void
  focusedPanelId: string | null
  onPanelFocus: (id: string) => void
  newSshPanelIds: Set<string>
  depth?: number
}

const LayoutNodeRenderer = React.memo(function LayoutNodeRenderer({ node, onClose, onTitleChange, onSetActiveTab, dropZoneInfo, deadZoneOverId, onResizeStart, focusedPanelId, onPanelFocus, newSshPanelIds, depth = 0 }: LayoutNodeRendererProps) {
  if (node.type === 'panel') {
    return (
      <DraggablePanel panel={node} onClose={onClose} onTitleChange={onTitleChange} dropZoneInfo={dropZoneInfo} deadZoneOverId={deadZoneOverId} focusedPanelId={focusedPanelId} onPanelFocus={onPanelFocus} isNewSshPanel={node.panelType === 'ssh' && newSshPanelIds.has(node.id)} />
    )
  }

  if (node.type === 'tabgroup') {
    return (
      <TabGroupRenderer node={node} onClose={onClose} onTitleChange={onTitleChange} onSetActiveTab={onSetActiveTab} onPanelFocus={onPanelFocus} dropZoneInfo={dropZoneInfo} />
    )
  }

  if (depth > 10) {
    console.warn('[LayoutNodeRenderer] Max render depth exceeded, stopping recursion')
    return null
  }

  return (
    <div
      className="layout-split"
      data-direction={node.direction}
      style={{ flexDirection: node.direction }}
    >
      {node.children.map((child, index) => (
        <Fragment key={child.id}>
          <div className="layout-split-child" style={{ flexGrow: child.size }}>
            <LayoutNodeRenderer
              node={child}
              onClose={onClose}
              onTitleChange={onTitleChange}
              onSetActiveTab={onSetActiveTab}
              dropZoneInfo={dropZoneInfo}
              deadZoneOverId={deadZoneOverId}
              onResizeStart={onResizeStart}
              focusedPanelId={focusedPanelId}
              onPanelFocus={onPanelFocus}
              newSshPanelIds={newSshPanelIds}
              depth={depth + 1}
            />
          </div>
          {index < node.children.length - 1 && (
            <ResizeHandle
              resizeChildId={child.id}
              isRow={node.direction === 'row'}
              onResizeStart={onResizeStart}
            />
          )}
        </Fragment>
      ))}
    </div>
  )
})

function customCollisionDetection(args: Parameters<CollisionDetection>[0]): Over[] {
  const { active, droppableContainers, collisionRect } = args
  const activeIdStr = String(active.id)
  const activePanelId = activeIdStr.startsWith('tab-') ? activeIdStr.slice(4) : activeIdStr

  const pointerX = collisionRect.left + collisionRect.width / 2
  const pointerY = collisionRect.top + collisionRect.height / 2

  let bestTab: DroppableContainer | null = null
  let bestTabDist = Infinity
  let bestOther: DroppableContainer | null = null
  let bestOtherDist = Infinity

  for (const droppable of droppableContainers) {
    if (droppable.id === active.id) continue
    const droppableIdStr = String(droppable.id)
    if (droppableIdStr === `tab-${activeIdStr}` || activeIdStr === `tab-${droppableIdStr}`) continue
    if (activeIdStr.startsWith('tab-') && droppableIdStr === activePanelId) continue
    if (droppableIdStr.startsWith('tab-') && activeIdStr === droppableIdStr.replace('tab-', '')) continue

    const rect = droppable.rect.current
    if (!rect) continue

    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dist = Math.sqrt((pointerX - cx) ** 2 + (pointerY - cy) ** 2)

    const overData = droppable.data.current as { type?: string } | undefined
    const isTab = overData?.type === 'tab'

    if (isTab) {
      const inRect = pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom
      if (inRect && dist < bestTabDist) {
        bestTabDist = dist
        bestTab = droppable
      }
    } else {
      if (dist < bestOtherDist) {
        bestOtherDist = dist
        bestOther = droppable
      }
    }
  }

  const best = bestTab || bestOther
  if (!best) return []

  const bestRect = best.rect.current
  if (!bestRect) return []

  return [{
    id: best.id,
    disabled: best.disabled,
    rect: bestRect,
    data: best.data,
  }] as unknown as Over[]
}

function computeZone(
  pointerPos: { x: number; y: number },
  overRect: { left: number; top: number; width: number; height: number }
): DropZone {
  const relX = (pointerPos.x - overRect.left) / overRect.width - 0.5
  const relY = (pointerPos.y - overRect.top) / overRect.height - 0.5
  const minDimension = Math.min(overRect.width, overRect.height)
  const edgeThreshold = Math.max(0.06, Math.min(0.12, 10 / minDimension))
  if (Math.abs(relX) < edgeThreshold && Math.abs(relY) < edgeThreshold) return 'center'
  if (Math.abs(relX) > Math.abs(relY)) {
    return relX > 0 ? 'right' : 'left'
  }
  return relY > 0 ? 'bottom' : 'top'
}

function computeZoneForTab(
  pointerPos: { x: number; y: number },
  tabEl: HTMLElement
): 'tab-before' | 'tab-after' | null {
  const rect = tabEl.getBoundingClientRect()
  const relX = (pointerPos.x - rect.left) / rect.width
  return relX < 0.5 ? 'tab-before' : 'tab-after'
}

function findTabElementAtPointer(
  pointerPos: { x: number; y: number },
  containerEl: HTMLElement
): { tabEl: HTMLElement; panelId: string } | null {
  const tabsBar = containerEl.querySelector('.layout-tabgroup-tabs')
  if (!tabsBar) return null

  const tabsBarRect = tabsBar.getBoundingClientRect()
  if (pointerPos.y < tabsBarRect.top || pointerPos.y > tabsBarRect.bottom) return null
  if (pointerPos.x < tabsBarRect.left || pointerPos.x > tabsBarRect.right) return null

  const tabEls = tabsBar.querySelectorAll('.layout-tabgroup-tab')
  for (const tabEl of tabEls) {
    const tabRect = tabEl.getBoundingClientRect()
    if (pointerPos.x >= tabRect.left && pointerPos.x <= tabRect.right) {
      const wrapper = tabEl.closest('[style*="position: relative"]')
      const panelId = wrapper?.getAttribute('data-panel-id')
      if (panelId) return { tabEl: tabEl as HTMLElement, panelId }
    }
  }

  return null
}

function isInputElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

function updateDropZoneFromEvent(
  event: DragOverEvent | DragMoveEvent,
  pointerPos: { x: number; y: number } | null,
  setDropZoneInfo: React.Dispatch<React.SetStateAction<DropZoneInfo | null>>,
  setDeadZoneOverId: React.Dispatch<React.SetStateAction<string | null>>,
  dropZoneInfoRef: React.MutableRefObject<DropZoneInfo | null>,
  allowClearRef: boolean
): void {
  const { active, over } = event

  if (!over) {
    if (allowClearRef || dropZoneInfoRef.current) {
      setDropZoneInfo(null)
      setDeadZoneOverId(null)
      dropZoneInfoRef.current = null
    }
    return
  }

  const activeIdStr = String(active.id)
  const overIdStr = String(over.id)
  const activePanelId = activeIdStr.startsWith('tab-') ? activeIdStr.slice(4) : activeIdStr
  const overPanelId = overIdStr.startsWith('tab-') ? overIdStr.slice(4) : overIdStr

  if (activePanelId === overPanelId) {
    if (allowClearRef || dropZoneInfoRef.current) {
      setDropZoneInfo(null)
      setDeadZoneOverId(null)
      dropZoneInfoRef.current = null
    }
    return
  }

  if (!pointerPos) return

  const overData = over.data.current as { type?: string; panel?: PanelNode; tabGroupId?: string; node?: TabGroupNode } | undefined
  const overType = overData?.type

  if (overType === 'tab' && overData?.panel) {
    const tabEl = document.querySelector(`[data-panel-id="${overData.panel.id}"] .layout-tabgroup-tab`)
    if (tabEl instanceof HTMLElement) {
      const tabZone = computeZoneForTab(pointerPos, tabEl)
      if (tabZone) {
        const info: DropZoneInfo = { overId: overData.panel.id, zone: tabZone }
        if (allowClearRef) {
          setDropZoneInfo((prev) => {
            if (prev?.overId === info.overId && prev?.zone === info.zone) return prev
            return info
          })
        } else {
          setDropZoneInfo(info)
        }
        setDeadZoneOverId(null)
        dropZoneInfoRef.current = info
        return
      }
    }
  }

  if (overType === 'tabgroup' && overData?.node) {
    const overNode = overData.node
    const overEl = document.querySelector(`[data-id="${overNode.id}"]`)
    if (overEl instanceof HTMLElement) {
      const tabHit = findTabElementAtPointer(pointerPos, overEl)
      if (tabHit) {
        const tabZone = computeZoneForTab(pointerPos, tabHit.tabEl)
        if (tabZone) {
          const info: DropZoneInfo = { overId: tabHit.panelId, zone: tabZone }
          if (allowClearRef) {
            setDropZoneInfo((prev) => {
              if (prev?.overId === info.overId && prev?.zone === info.zone) return prev
              return info
            })
          } else {
            setDropZoneInfo(info)
          }
          setDeadZoneOverId(null)
          dropZoneInfoRef.current = info
          return
        }
      }
    }

    const zone = computeZone(pointerPos, over.rect)
    const info: DropZoneInfo = { overId: overNode.id, zone }
    if (allowClearRef) {
      setDropZoneInfo((prev) => {
        if (prev?.overId === info.overId && prev?.zone === info.zone) return prev
        return info
      })
    } else {
      setDropZoneInfo(info)
    }
    setDeadZoneOverId(null)
    dropZoneInfoRef.current = info
    return
  }

  const zone = computeZone(pointerPos, over.rect)
  const info: DropZoneInfo = { overId: overIdStr, zone }

  if (allowClearRef) {
    setDropZoneInfo((prev) => {
      if (prev?.overId === info.overId && prev?.zone === info.zone) return prev
      return info
    })
  } else {
    setDropZoneInfo(info)
  }
  setDeadZoneOverId(null)
  dropZoneInfoRef.current = info
}

const DEFAULT_STYLE_OPTIONS: { value: TerminalStyle | 'auto'; label: string; desc: string }[] = [
  { value: 'auto', label: 'Auto', desc: 'Follow app theme' },
  { value: 'classic', label: 'Classic', desc: 'Dark terminal' },
  { value: 'light', label: 'Light', desc: 'Light terminal' },
  { value: 'sepia', label: 'Sepia', desc: 'Warm tones' },
  { value: 'ocean', label: 'Ocean', desc: 'Deep blue' },
]

function DefaultTerminalStyleButton() {
  const defaultTerminalStyle = useRemoteToolsStore((state) => state.defaultTerminalStyle)
  const setDefaultTerminalStyle = useRemoteToolsStore((state) => state.setDefaultTerminalStyle)

  return (
    <Popover
      trigger={
        <Tooltip content="Default Terminal Style">
          <button className="remote-tools-add-btn">
            <Palette size={13} />
          </button>
        </Tooltip>
      }
      placement="bottom-end"
    >
      <div className="default-terminal-style-popup">
        <div className="default-terminal-style-title">Default Terminal Style</div>
        {DEFAULT_STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`default-terminal-style-item ${defaultTerminalStyle === opt.value ? 'default-terminal-style-item-active' : ''}`}
            onClick={() => setDefaultTerminalStyle(opt.value)}
          >
            <span className="default-terminal-style-item-label">{opt.label}</span>
            <span className="default-terminal-style-item-desc">{opt.desc}</span>
          </button>
        ))}
      </div>
    </Popover>
  )
}

export default function RemoteToolsView() {
  const layout = useRemoteToolsStore((state) => state.layout)
  const addPanel = useRemoteToolsStore((state) => state.addPanel)
  const removePanel = useRemoteToolsStore((state) => state.removePanel)
  const movePanelToZone = useRemoteToolsStore((state) => state.movePanelToZone)
  const resizeNode = useRemoteToolsStore((state) => state.resizeNode)
  const resetLayout = useRemoteToolsStore((state) => state.resetLayout)
  const undo = useRemoteToolsStore((state) => state.undo)
  const redo = useRemoteToolsStore((state) => state.redo)
  const canUndo = useRemoteToolsStore((state) => state.canUndo)
  const canRedo = useRemoteToolsStore((state) => state.canRedo)
  const setPanelTitle = useRemoteToolsStore((state) => state.setPanelTitle)
  const setActiveTab = useRemoteToolsStore((state) => state.setActiveTab)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [dropZoneInfo, setDropZoneInfo] = useState<DropZoneInfo | null>(null)
  const [deadZoneOverId, setDeadZoneOverId] = useState<string | null>(null)
  const [focusedPanelId, setFocusedPanelId] = useState<string | null>(null)
  const [newSshPanelIds, setNewSshPanelIds] = useState<Set<string>>(new Set())
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    detail?: string
    onConfirm: () => void
  }>({ open: false, title: '', message: '', onConfirm: () => { } })
  const dropZoneInfoRef = useRef<DropZoneInfo | null>(null)
  const resizeCleanupRef = useRef<(() => void) | null>(null)
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null)
  const pointerTrackCleanupRef = useRef<(() => void) | null>(null)

  const allPanels = getAllPanelNodes(layout.root)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { currentCoordinates }) => {
        const delta = 10
        switch (event.code) {
          case 'ArrowRight': return { ...currentCoordinates, x: currentCoordinates.x + delta }
          case 'ArrowLeft': return { ...currentCoordinates, x: currentCoordinates.x - delta }
          case 'ArrowDown': return { ...currentCoordinates, y: currentCoordinates.y + delta }
          case 'ArrowUp': return { ...currentCoordinates, y: currentCoordinates.y - delta }
          default: return currentCoordinates
        }
      },
    })
  )

  useEffect(() => {
    return () => {
      resizeCleanupRef.current?.()
      pointerTrackCleanupRef.current?.()
      if (dragMoveRafRef.current !== null) {
        cancelAnimationFrame(dragMoveRafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputElement(e.target)) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }

      if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        setFocusedPanelId((prev) => {
          const ids = allPanels.map((p) => p.id)
          if (ids.length === 0) return null
          const currentIndex = prev ? ids.indexOf(prev) : -1
          const nextIndex = (currentIndex + 1) % ids.length
          return ids[nextIndex]
        })
        return
      }
      if (e.ctrlKey && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        setFocusedPanelId((prev) => {
          const ids = allPanels.map((p) => p.id)
          if (ids.length === 0) return null
          const currentIndex = prev ? ids.indexOf(prev) : 0
          const prevIndex = (currentIndex - 1 + ids.length) % ids.length
          return ids[prevIndex]
        })
        return
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        handleAddPanel('ssh')
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        handleAddPanel('browser')
        return
      }
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault()
        if (focusedPanelId) {
          handleRemovePanel(focusedPanelId)
        }
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, allPanels])

  const handleAddPanel = useCallback((type: PanelType) => {
    addPanel(type)
    if (type === 'ssh') {
      const allPanelIdsBefore = new Set(allPanels.map((p) => p.id))
      requestAnimationFrame(() => {
        const currentPanels = getAllPanelNodes(useRemoteToolsStore.getState().layout.root)
        const newPanel = currentPanels.find((p) => !allPanelIdsBefore.has(p.id) && p.panelType === 'ssh')
        if (newPanel) {
          setNewSshPanelIds((prev) => new Set(prev).add(newPanel.id))
        }
      })
    }
  }, [addPanel, allPanels])

  const handleRemovePanel = useCallback((id: string) => {
    const panel = allPanels.find((p) => p.id === id)
    if (panel?.panelType === 'ssh') {
      const session = useRemoteToolsStore.getState().sshSessions[id]
      if (session && (session.state === 'shell_ready' || session.state === 'connecting')) {
        const host = session.config?.host || 'unknown'
        const port = session.config?.port || 22
        setConfirmDialog({
          open: true,
          title: 'Close SSH Panel',
          message: 'This panel has an active SSH connection. Close it anyway?',
          detail: `${host}:${port}`,
          onConfirm: () => {
            window.electronAPI?.sshDisconnect(id)
            window.electronAPI?.sshDestroySession(id)
            removePanel(id)
            if (focusedPanelId === id) setFocusedPanelId(null)
            setConfirmDialog((prev) => ({ ...prev, open: false }))
          },
        })
        return
      }
      window.electronAPI?.sshDisconnect(id)
      window.electronAPI?.sshDestroySession(id)
    }
    removePanel(id)
    if (focusedPanelId === id) setFocusedPanelId(null)
  }, [allPanels, removePanel, focusedPanelId])

  const handleResetLayout = useCallback(() => {
    const hasActiveSsh = allPanels.some((p) => {
      if (p.panelType !== 'ssh') return false
      const session = useRemoteToolsStore.getState().sshSessions[p.id]
      return session && (session.state === 'shell_ready' || session.state === 'connecting')
    })
    if (hasActiveSsh) {
      setConfirmDialog({
        open: true,
        title: 'Reset Layout',
        message: 'This will disconnect all SSH sessions and reset the layout. Continue?',
        onConfirm: () => {
          resetLayout()
          setFocusedPanelId(null)
          setConfirmDialog((prev) => ({ ...prev, open: false }))
        },
      })
      return
    }
    resetLayout()
    setFocusedPanelId(null)
  }, [allPanels, resetLayout])

  const handleResizeStart = useCallback(
    (resizeChildId: string, isRow: boolean, e: React.MouseEvent) => {
      e.preventDefault()
      const splitEl = (e.currentTarget as HTMLElement).parentElement
      if (!splitEl) return

      resizeCleanupRef.current?.()

      const resizeHandles = splitEl.querySelectorAll(':scope > .resize-handle')
      const handlesSize = resizeHandles.length * 6
      const rect = splitEl.getBoundingClientRect()
      const totalSize = isRow ? rect.width : rect.height
      const containerSize = totalSize - handlesSize
      if (containerSize <= 0) return

      let prevPos = isRow ? e.clientX : e.clientY

      const onMove = (moveEvent: MouseEvent) => {
        const currentPos = isRow ? moveEvent.clientX : moveEvent.clientY
        const stepDelta = (currentPos - prevPos) / containerSize
        prevPos = currentPos
        if (Math.abs(stepDelta) < 0.001) return
        resizeNode(resizeChildId, stepDelta)
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        resizeCleanupRef.current = null
      }

      resizeCleanupRef.current = onUp

      document.body.style.cursor = isRow ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [resizeNode]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeIdStr = String(event.active.id)
    const panelId = activeIdStr.startsWith('tab-') ? activeIdStr.slice(4) : activeIdStr
    setActiveId(panelId)
    pointerTrackCleanupRef.current?.()
    const onPointerMove = (e: PointerEvent) => {
      pointerPosRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', onPointerMove)
    pointerTrackCleanupRef.current = () => {
      window.removeEventListener('pointermove', onPointerMove)
      pointerPosRef.current = null
      pointerTrackCleanupRef.current = null
    }
  }, [])

  const dragMoveRafRef = useRef<number | null>(null)
  const lastDragMoveEventRef = useRef<DragMoveEvent | null>(null)

  const handleDragOver = useCallback((event: DragOverEvent) => {
    updateDropZoneFromEvent(event, pointerPosRef.current, setDropZoneInfo, setDeadZoneOverId, dropZoneInfoRef, true)
  }, [])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    lastDragMoveEventRef.current = event
    if (dragMoveRafRef.current !== null) return
    dragMoveRafRef.current = requestAnimationFrame(() => {
      dragMoveRafRef.current = null
      const evt = lastDragMoveEventRef.current
      if (!evt) return
      updateDropZoneFromEvent(evt, pointerPosRef.current, setDropZoneInfo, setDeadZoneOverId, dropZoneInfoRef, true)
    })
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active } = event
    const savedDropZone = dropZoneInfoRef.current

    setActiveId(null)
    setDropZoneInfo(null)
    setDeadZoneOverId(null)
    dropZoneInfoRef.current = null
    pointerTrackCleanupRef.current?.()

    if (!savedDropZone) return

    const activeIdStr = String(active.id)
    const activePanelId = activeIdStr.startsWith('tab-') ? activeIdStr.slice(4) : activeIdStr

    if (activePanelId === savedDropZone.overId) return

    movePanelToZone(activePanelId, savedDropZone.overId, savedDropZone.zone)
  }, [movePanelToZone])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setDropZoneInfo(null)
    setDeadZoneOverId(null)
    dropZoneInfoRef.current = null
    pointerTrackCleanupRef.current?.()
  }, [])

  const handlePanelFocus = useCallback((id: string) => {
    setFocusedPanelId(id)
  }, [])

  const handleSetActiveTab = useCallback((tabGroupId: string, panelId: string) => {
    setActiveTab(tabGroupId, panelId)
  }, [setActiveTab])

  const activePanel = activeId ? allPanels.find((p) => p.id === activeId) : null

  const overPanel = dropZoneInfo
    ? allPanels.find((p) => p.id === dropZoneInfo.overId) ?? (() => {
      const overNode = findNode(layout.root, dropZoneInfo.overId)
      if (overNode?.type === 'tabgroup') {
        const activeTab = overNode.children.find((c) => c.id === overNode.activeTabId) ?? overNode.children[0]
        return activeTab ?? null
      }
      return null
    })()
    : deadZoneOverId
      ? allPanels.find((p) => p.id === deadZoneOverId)
      : null

  const isVerticalPreview = dropZoneInfo
    ? dropZoneInfo.zone === 'top' || dropZoneInfo.zone === 'bottom'
    : false

  const panelCount = allPanels.length

  if (allPanels.length === 0) {
    return (
      <div className="remote-tools-view">
        <div className="remote-tools-toolbar">
          <div className="remote-tools-toolbar-left">
            <LayoutGrid size={14} />
            <span className="remote-tools-toolbar-title">Remote Tools</span>
          </div>
          <div className="remote-tools-toolbar-right">
            <Tooltip content="Reset Layout">
              <button className="remote-tools-add-btn" onClick={handleResetLayout}>
                <RotateCcw size={13} />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="remote-tools-empty">
          <div className="remote-tools-empty-cards">
            <button className="remote-tools-empty-card" onClick={() => handleAddPanel('ssh')}>
              <Terminal size={32} />
              <p className="remote-tools-empty-card-title">SSH Terminal</p>
              <p className="remote-tools-empty-card-hint">Connect to remote hosts</p>
              <p className="remote-tools-empty-card-hint-shortcut">Ctrl+Shift+N</p>
            </button>
            <button className="remote-tools-empty-card" onClick={() => handleAddPanel('browser')}>
              <Globe size={32} />
              <p className="remote-tools-empty-card-title">Web Browser</p>
              <p className="remote-tools-empty-card-hint">Browse web pages</p>
              <p className="remote-tools-empty-card-hint-shortcut">Ctrl+Shift+B</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="remote-tools-view">
      <div className="remote-tools-toolbar">
        <div className="remote-tools-toolbar-left">
          <LayoutGrid size={14} />
          <span className="remote-tools-toolbar-title">Remote Tools</span>
        </div>
        <div className="remote-tools-toolbar-right">
          <Popover
            trigger={
              <Tooltip content="Add Panel">
                <button className="remote-tools-add-btn" disabled={panelCount >= 8}>
                  <Plus size={13} />
                </button>
              </Tooltip>
            }
            placement="bottom-end"
          >
            <div className="panel-add-menu">
              <button className="panel-add-menu-item" onClick={() => handleAddPanel('ssh')}>
                <Terminal size={13} />
                <span>SSH Terminal</span>
                <span className="panel-add-menu-item-shortcut">⌘⇧N</span>
              </button>
              <button className="panel-add-menu-item" onClick={() => handleAddPanel('browser')}>
                <Globe size={13} />
                <span>Web Browser</span>
                <span className="panel-add-menu-item-shortcut">⌘⇧B</span>
              </button>
            </div>
          </Popover>
          <Tooltip content={panelCount >= 8 ? 'Panel limit reached (8/8)' : `${panelCount} of 8 panels`}>
            <span className={`remote-tools-panel-count ${panelCount >= 8 ? 'remote-tools-panel-count-max' : panelCount >= 6 ? 'remote-tools-panel-count-warn' : ''}`}>
              {panelCount}/8
            </span>
          </Tooltip>
          <div className="remote-tools-toolbar-divider" />
          <Tooltip content="Undo (Ctrl+Z)">
            <button className="remote-tools-add-btn" onClick={undo} disabled={!canUndo()}>
              <Undo2 size={13} />
            </button>
          </Tooltip>
          <Tooltip content="Redo (Ctrl+Shift+Z)">
            <button className="remote-tools-add-btn" onClick={redo} disabled={!canRedo()}>
              <Redo2 size={13} />
            </button>
          </Tooltip>
          <div className="remote-tools-toolbar-divider" />
          <Tooltip content="Reset Layout">
            <button className="remote-tools-add-btn" onClick={handleResetLayout}>
              <RotateCcw size={13} />
            </button>
          </Tooltip>
          <DefaultTerminalStyleButton />
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="remote-tools-body">
          <LayoutNodeRenderer
            node={layout.root}
            onClose={handleRemovePanel}
            onTitleChange={setPanelTitle}
            onSetActiveTab={handleSetActiveTab}
            dropZoneInfo={dropZoneInfo}
            deadZoneOverId={deadZoneOverId}
            onResizeStart={handleResizeStart}
            focusedPanelId={focusedPanelId}
            onPanelFocus={handlePanelFocus}
            newSshPanelIds={newSshPanelIds}
          />
        </div>
        <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={null}>
          {activePanel ? (
            <div className="remote-tools-drag-overlay">
              {dropZoneInfo && overPanel && (dropZoneInfo.zone === 'top' || dropZoneInfo.zone === 'bottom' || dropZoneInfo.zone === 'left' || dropZoneInfo.zone === 'right') ? (
                <div className="remote-tools-drag-preview">
                  <div className={`remote-tools-drag-preview-layout ${isVerticalPreview ? 'remote-tools-drag-preview-column' : 'remote-tools-drag-preview-row'}`}>
                    {(dropZoneInfo.zone === 'top' || dropZoneInfo.zone === 'left') ? (
                      <>
                        <div className="remote-tools-drag-preview-panel remote-tools-drag-preview-active">
                          {activePanel.panelType === 'ssh' ? <Terminal size={10} /> : <Globe size={10} />}
                          <span>{activePanel.title}</span>
                        </div>
                        <div className="remote-tools-drag-preview-panel">
                          {overPanel.panelType === 'ssh' ? <Terminal size={10} /> : <Globe size={10} />}
                          <span>{overPanel.title}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="remote-tools-drag-preview-panel">
                          {overPanel.panelType === 'ssh' ? <Terminal size={10} /> : <Globe size={10} />}
                          <span>{overPanel.title}</span>
                        </div>
                        <div className="remote-tools-drag-preview-panel remote-tools-drag-preview-active">
                          {activePanel.panelType === 'ssh' ? <Terminal size={10} /> : <Globe size={10} />}
                          <span>{activePanel.title}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="remote-tools-drag-preview-label">
                    {isVerticalPreview ? 'Vertical Layout' : 'Horizontal Layout'}
                  </div>
                </div>
              ) : dropZoneInfo && (dropZoneInfo.zone === 'center' || dropZoneInfo.zone === 'tab-before' || dropZoneInfo.zone === 'tab-after') ? (
                <div className="remote-tools-drag-preview">
                  <div className="remote-tools-drag-preview-layout remote-tools-drag-preview-row">
                    <div className="remote-tools-drag-preview-tabgroup">
                      {overPanel && (
                        <div className="remote-tools-drag-preview-tab">
                          {overPanel.panelType === 'ssh' ? <Terminal size={9} /> : <Globe size={9} />}
                          <span>{overPanel.title}</span>
                        </div>
                      )}
                      <div className="remote-tools-drag-preview-tab remote-tools-drag-preview-tab-active">
                        {activePanel.panelType === 'ssh' ? <Terminal size={9} /> : <Globe size={9} />}
                        <span>{activePanel.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="remote-tools-drag-preview-label">
                    {dropZoneInfo.zone === 'center' ? 'Merge as Tab Group' : 'Insert as Tab'}
                  </div>
                </div>
              ) : (
                <div className="remote-tools-drag-placeholder-simple">
                  {activePanel.panelType === 'ssh' ? <Terminal size={16} /> : <Globe size={16} />}
                  <span>{activePanel.title}</span>
                  {allPanels.length === 1 && (
                    <span className="remote-tools-drag-hint">Add another panel to create a split layout</span>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        detail={confirmDialog.detail}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}
