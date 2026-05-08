import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, Send, GitBranch, Table2, Sun, Moon, Monitor, Plus, Code, Download, Upload, PanelLeftClose, PanelLeftOpen, Copy, ClipboardPaste, Edit3, Trash2, Terminal, FilePlus } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useUIStore } from '@/stores/useUIStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useRequestStore } from '@/stores/useRequestStore'
import { toast } from '@/stores/useToastStore'
import './command-palette.css'

interface Command {
  id: string
  label: string
  category: string
  icon: React.ReactNode
  action: () => void
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const setView = useUIStore((s) => s.setView)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setImportDialogOpen = useUIStore((s) => s.setImportDialogOpen)
  const setCodeGenOpen = useUIStore((s) => s.setCodeGenOpen)
  const addCollection = useAppStore((s) => s.addCollection)
  const deleteCollection = useAppStore((s) => s.deleteCollection)
  const duplicateCollection = useAppStore((s) => s.duplicateCollection)
  const clipboardRequest = useAppStore((s) => s.clipboardRequest)
  const setClipboardRequest = useAppStore((s) => s.setClipboardRequest)
  const addRequestToCollection = useAppStore((s) => s.addRequestToCollection)
  const exportCollections = useAppStore((s) => s.exportCollections)
  const importCollections = useAppStore((s) => s.importCollections)
  const collections = useAppStore((s) => s.collections)

  const setMode = useThemeStore((s) => s.setMode)
  const toggle = useThemeStore((s) => s.toggle)

  const resetActiveRequest = useRequestStore((s) => s.resetActiveRequest)

  const commands: Command[] = useMemo(() => [
    { id: 'new-request', label: 'New Request', category: 'Requests', icon: <FilePlus size={14} />, action: () => { resetActiveRequest(); setView('request') } },
    { id: 'view-request', label: 'Switch to Requests', category: 'Navigation', icon: <Send size={14} />, action: () => setView('request') },
    { id: 'view-workflow', label: 'Switch to Workflow', category: 'Navigation', icon: <GitBranch size={14} />, action: () => setView('workflow') },
    { id: 'view-data-table', label: '切换到数据表', category: 'Navigation', icon: <Table2 size={14} />, action: () => setView('data-table') },
    { id: 'view-remote-tools', label: 'Switch to Remote Tools', category: 'Navigation', icon: <Terminal size={14} />, action: () => setView('remote-tools') },
    { id: 'theme-light', label: 'Theme: Light', category: 'Theme', icon: <Sun size={14} />, action: () => setMode('light') },
    { id: 'theme-dark', label: 'Theme: Dark', category: 'Theme', icon: <Moon size={14} />, action: () => setMode('dark') },
    { id: 'theme-system', label: 'Theme: System', category: 'Theme', icon: <Monitor size={14} />, action: () => setMode('system') },
    { id: 'theme-toggle', label: 'Toggle Dark/Light Mode', category: 'Theme', icon: <Moon size={14} />, action: toggle },
    { id: 'sidebar-toggle', label: 'Toggle Sidebar', category: 'View', icon: sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />, action: toggleSidebar },
    { id: 'new-collection', label: 'New Collection', category: 'Collections', icon: <Plus size={14} />, action: () => addCollection('New Collection') },
    { id: 'duplicate-collection', label: 'Duplicate Last Collection', category: 'Collections', icon: <Copy size={14} />, action: () => { if (collections.length > 0) duplicateCollection(collections[collections.length - 1].id) } },
    { id: 'delete-collection', label: 'Delete Last Collection', category: 'Collections', icon: <Trash2 size={14} />, action: () => { if (collections.length > 0) deleteCollection(collections[collections.length - 1].id) } },
    { id: 'copy-request', label: 'Copy Last Request to Clipboard', category: 'Collections', icon: <Copy size={14} />, action: () => { const lastReq = collections.flatMap(c => c.requests).pop(); if (lastReq) { setClipboardRequest(lastReq); toast('success', 'Request copied!') } } },
    { id: 'paste-request', label: 'Paste Request to Last Collection', category: 'Collections', icon: <ClipboardPaste size={14} />, action: () => { if (clipboardRequest && collections.length > 0) { addRequestToCollection(collections[collections.length - 1].id, { ...clipboardRequest, id: crypto.randomUUID() }); toast('success', 'Request pasted!') } } },
    { id: 'rename-collection', label: 'Rename Last Collection', category: 'Collections', icon: <Edit3 size={14} />, action: () => { if (collections.length > 0) { useAppStore.getState().updateCollection(collections[collections.length - 1].id, { name: `Collection ${Date.now()}` }) } } },
    { id: 'export', label: 'Export All Data', category: 'Data', icon: <Download size={14} />, action: async () => { const json = exportCollections(); await navigator.clipboard.writeText(json) } },
    { id: 'import', label: 'Import Data', category: 'Data', icon: <Upload size={14} />, action: async () => { const json = await navigator.clipboard.readText(); importCollections(json) } },
    { id: 'import-file', label: 'Import from File', category: 'Data', icon: <Upload size={14} />, action: () => setImportDialogOpen(true) },
    { id: 'codegen', label: 'Generate Code', category: 'Tools', icon: <Code size={14} />, action: () => setCodeGenOpen(true) },
  ], [resetActiveRequest, setView, setMode, toggle, sidebarCollapsed, toggleSidebar, addCollection, duplicateCollection, deleteCollection, collections, setClipboardRequest, clipboardRequest, addRequestToCollection, exportCollections, importCollections, setImportDialogOpen, setCodeGenOpen])

  const filtered = useMemo(() => commands.filter((cmd) => {
    if (!query) return true
    const q = query.toLowerCase()
    return cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)
  }), [commands, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      filtered[selectedIndex].action()
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }, [filtered, selectedIndex])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!open) return null

  return (
    <div className="command-palette-overlay" onClick={() => { setOpen(false); setQuery('') }}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-input-wrapper">
          <Search size={16} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            className="command-palette-input"
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-palette-kbd">Esc</kbd>
        </div>
        <div className="command-palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="command-palette-empty">No matching commands</div>
          )}
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              className={`command-palette-item ${i === selectedIndex ? 'selected' : ''}`}
              onClick={() => { cmd.action(); setOpen(false); setQuery('') }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="command-palette-item-icon">{cmd.icon}</span>
              <span className="command-palette-item-label">{cmd.label}</span>
              <span className="command-palette-item-category">{cmd.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
