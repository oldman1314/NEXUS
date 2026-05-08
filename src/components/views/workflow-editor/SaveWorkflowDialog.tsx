import { memo } from 'react'

interface SaveWorkflowDialogProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (desc: string) => void
  onConfirm: () => void
  onCancel: () => void
}

const SaveWorkflowDialog = memo(({
  name, description, onNameChange, onDescriptionChange, onConfirm, onCancel,
}: SaveWorkflowDialogProps) => {
  return (
    <div className="save-workflow-overlay" onClick={onCancel}>
      <div className="save-workflow-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Save Workflow</h3>
        <input
          type="text"
          placeholder="Workflow name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
          }}
          autoFocus
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={onCancel}>Cancel</button>
          <button className="dialog-btn-primary" onClick={onConfirm} disabled={!name.trim()}>Save</button>
        </div>
      </div>
    </div>
  )
})

SaveWorkflowDialog.displayName = 'SaveWorkflowDialog'

export default SaveWorkflowDialog
