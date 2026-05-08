import { Plus, Download, Upload, Import, FilePlus } from 'lucide-react'
import Tooltip from '@/components/common/Tooltip'

interface CollectionsHeaderProps {
  onNewRequest: () => void
  onExport: () => void
  onImport: () => void
  onImportFile: () => void
  onNewCollection: () => void
}

export function CollectionsHeader({ onNewRequest, onExport, onImport, onImportFile, onNewCollection }: CollectionsHeaderProps) {
  return (
    <div className="section-header">
      <span>Collections</span>
      <div className="section-actions">
        <Tooltip content="New Request">
          <button className="icon-btn" onClick={onNewRequest}>
            <FilePlus size={14} />
          </button>
        </Tooltip>
        <Tooltip content="Export All" shortcut="⇧⌘E">
          <button className="icon-btn" onClick={onExport}>
            <Download size={14} />
          </button>
        </Tooltip>
        <Tooltip content="Import All" shortcut="⇧⌘I">
          <button className="icon-btn" onClick={onImport}>
            <Upload size={14} />
          </button>
        </Tooltip>
        <Tooltip content="Import from File">
          <button className="icon-btn" onClick={onImportFile}>
            <Import size={14} />
          </button>
        </Tooltip>
        <Tooltip content="New Collection">
          <button className="icon-btn" onClick={onNewCollection}>
            <Plus size={14} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
