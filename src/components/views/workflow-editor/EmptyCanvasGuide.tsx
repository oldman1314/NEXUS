import { memo } from 'react'
import { GitBranch, Zap } from 'lucide-react'
import { Panel } from '@xyflow/react'
import { TEMPLATES } from './WorkflowUtils'

interface EmptyCanvasGuideProps {
  onAddNode: (type: string) => void
  onTemplate: (index: number) => void
}

const EmptyCanvasGuide = memo(({ onAddNode, onTemplate }: EmptyCanvasGuideProps) => {
  return (
    <Panel position="top-center">
      <div className="empty-canvas-guide">
        <div className="empty-guide-icon">
          <GitBranch size={48} strokeWidth={1.2} />
        </div>
        <div className="empty-guide-title">Start Building Your Workflow</div>
        <div className="empty-guide-subtitle">Drag nodes from the palette or click to add them</div>
        <button className="empty-guide-action" onClick={() => onAddNode('start')}>
          <Zap size={16} />
          Add Start Node
        </button>
        <div className="template-section">
          <div className="template-section-title">Templates</div>
          {TEMPLATES.map((t, i) => (
            <button key={t.name} className="template-item" onClick={() => onTemplate(i)}>
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
})

EmptyCanvasGuide.displayName = 'EmptyCanvasGuide'

export default EmptyCanvasGuide
