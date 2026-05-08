import { type ReactNode, useState, useCallback, type HTMLAttributes, useRef, useEffect } from 'react'
import { X, Maximize2, Minimize2, Terminal, Globe, GripVertical, Pencil, Settings, Palette } from 'lucide-react'
import type { PanelType } from '@/stores/useRemoteToolsStore'
import { toast } from '@/stores/useToastStore'
import Tooltip from '@/components/common/Tooltip'
import Popover from '@/components/common/Popover'
import TerminalStylePicker from './panel/TerminalStylePicker'
import SshConfigForm from './panel/SshConfigForm'
import SshStatusBadge from './panel/SshStatusBadge'
import SshToolbarControls from './panel/SshToolbarControls'

interface PanelContainerProps {
  panelId: string
  panelType: PanelType
  title: string
  children: ReactNode
  onClose: (id: string) => void
  dragHandleProps?: HTMLAttributes<HTMLElement>
  dragHandleAttrs?: HTMLAttributes<HTMLElement>
  disableDrag?: boolean
  onTitleChange?: (id: string, title: string) => void
  autoOpenSshSettings?: boolean
}

export default function PanelContainer({
  panelId,
  panelType,
  title,
  children,
  onClose,
  dragHandleProps,
  dragHandleAttrs,
  disableDrag,
  onTitleChange,
  autoOpenSshSettings,
}: PanelContainerProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [sshSettingsOpen, setSshSettingsOpen] = useState(!!autoOpenSshSettings)
  const titleRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleMaximize = useCallback(() => {
    setIsMaximized((prev) => !prev)
  }, [])

  const startEditing = useCallback(() => {
    setEditTitle(title)
    setIsEditing(true)
  }, [title])

  const commitTitle = useCallback(() => {
    setIsEditing(false)
    const trimmed = editTitle.trim()
    if (!trimmed) {
      toast('warning', 'Title cannot be empty')
      return
    }
    if (trimmed !== title && onTitleChange) {
      onTitleChange(panelId, trimmed)
    }
  }, [editTitle, title, onTitleChange, panelId])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTitle()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditTitle(title)
    }
  }, [commitTitle, title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const icon = panelType === 'ssh' ? <Terminal size={12} /> : <Globe size={12} />

  const dragHandle = (
    <span
      className="panel-drag-handle"
      {...(disableDrag ? {} : dragHandleProps)}
      {...(disableDrag ? {} : dragHandleAttrs)}
      tabIndex={0}
      role="button"
      aria-label="Drag to reorder panel"
      style={disableDrag ? { opacity: 0.3, cursor: 'default' } : undefined}
    >
      <GripVertical size={12} />
    </span>
  )

  const titleElement = isEditing ? (
    <input
      ref={inputRef}
      className="panel-title-input"
      style={{ width: `${Math.max(60, editTitle.length * 7 + 16)}px` }}
      value={editTitle}
      onChange={(e) => setEditTitle(e.target.value)}
      onBlur={commitTitle}
      onKeyDown={handleTitleKeyDown}
    />
  ) : (
    <span ref={titleRef} className="panel-title" onDoubleClick={startEditing} title={title}>
      {title}
    </span>
  )

  const renameButton = (
    <Tooltip content="Rename">
      <button className="panel-header-btn" onClick={startEditing}>
        <Pencil size={11} />
      </button>
    </Tooltip>
  )

  const sshSettingsButton = panelType === 'ssh' ? (
    <Popover
      open={sshSettingsOpen}
      onOpenChange={setSshSettingsOpen}
      trigger={
        <Tooltip content="SSH Settings">
          <button className="panel-header-btn">
            <Settings size={12} />
          </button>
        </Tooltip>
      }
      placement="bottom-start"
    >
      <SshConfigForm sessionId={panelId} />
    </Popover>
  ) : null

  const sshStyleButton = panelType === 'ssh' ? (
    <Popover
      trigger={
        <Tooltip content="Terminal Style">
          <button className="panel-header-btn">
            <Palette size={12} />
          </button>
        </Tooltip>
      }
      placement="bottom-end"
    >
      <TerminalStylePicker sessionId={panelId} />
    </Popover>
  ) : null

  if (isMaximized) {
    return (
      <div className="panel-maximized-overlay">
        <div className="panel-maximized-content">
          <div className="panel-header">
            <div className="panel-header-left">
              {dragHandle}
              {icon}
              {titleElement}
              {panelType === 'ssh' && <SshStatusBadge sessionId={panelId} />}
            </div>
            <div className="panel-header-actions">
              {panelType === 'ssh' && <SshToolbarControls sessionId={panelId} />}
              {sshStyleButton}
              {sshSettingsButton}
              {renameButton}
              <Tooltip content="Restore">
                <button className="panel-header-btn" onClick={toggleMaximize}>
                  <Minimize2 size={12} />
                </button>
              </Tooltip>
              <Tooltip content="Close">
                <button className="panel-header-btn panel-header-btn-close" onClick={() => onClose(panelId)}>
                  <X size={12} />
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="panel-body">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel-container">
      <div className="panel-header">
        <div className="panel-header-left">
          {dragHandle}
          {icon}
          {titleElement}
          {panelType === 'ssh' && <SshStatusBadge sessionId={panelId} />}
        </div>
        <div className="panel-header-actions">
          {panelType === 'ssh' && <SshToolbarControls sessionId={panelId} />}
          {sshStyleButton}
          {sshSettingsButton}
          {renameButton}
          <Tooltip content="Maximize">
            <button className="panel-header-btn" onClick={toggleMaximize}>
              <Maximize2 size={12} />
            </button>
          </Tooltip>
          <Tooltip content="Close">
            <button className="panel-header-btn panel-header-btn-close" onClick={() => onClose(panelId)}>
              <X size={12} />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  )
}
