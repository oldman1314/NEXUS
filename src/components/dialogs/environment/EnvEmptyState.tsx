import { Plus, Variable } from 'lucide-react'

interface EnvEmptyStateProps {
  onAdd: () => void
}

export default function EnvEmptyState({ onAdd }: EnvEmptyStateProps) {
  return (
    <div className="env-empty-state">
      <div className="env-empty-state-icon">
        <Variable size={24} />
      </div>
      <h4>No variables yet</h4>
      <p>Add variables to use them in your requests with {'{{variableName}}'} syntax</p>
      <button className="env-add-first-btn" onClick={onAdd}>
        <Plus size={14} />
        Add First Variable
      </button>
    </div>
  )
}
