import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { computeDiff } from '@/utils/diff'
import './dialog.css'

export default function DiffDialog() {
  const diffDialogOpen = useUIStore((state) => state.diffDialogOpen)
  const diffData = useUIStore((state) => state.diffData)
  const setDiffDialogOpen = useUIStore((state) => state.setDiffDialogOpen)
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')

  const diffResult = useMemo(() => {
    if (!diffData) return null
    return computeDiff(diffData.left, diffData.right)
  }, [diffData])

  if (!diffDialogOpen || !diffData) return null

  const { leftLines, rightLines, leftStatus, rightStatus } = diffResult!

  return (
    <div className="modal-overlay" onClick={() => setDiffDialogOpen(false)}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Compare Responses</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg-secondary)', borderRadius: 6, padding: 2 }}>
              <button
                onClick={() => setViewMode('split')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  background: viewMode === 'split' ? 'var(--bg-panel)' : 'transparent',
                  color: viewMode === 'split' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('unified')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  background: viewMode === 'unified' ? 'var(--bg-panel)' : 'transparent',
                  color: viewMode === 'unified' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Unified
              </button>
            </div>
            <button className="modal-close" onClick={() => setDiffDialogOpen(false)}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="modal-body" style={{ padding: 0, overflow: 'hidden' }}>
          {viewMode === 'split' ? (
            <div style={{ display: 'flex', height: '60vh' }}>
              <div style={{ flex: 1, overflow: 'auto', borderRight: '1px solid var(--border-light)' }}>
                <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1 }}>
                  {diffData.leftName}
                </div>
                {leftLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '2px 12px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      background:
                        leftStatus[i] === 'removed'
                          ? 'rgba(255, 59, 48, 0.1)'
                          : leftStatus[i] === 'modified'
                            ? 'rgba(255, 149, 0, 0.08)'
                            : 'transparent',
                      color:
                        leftStatus[i] === 'removed'
                          ? 'var(--error)'
                          : leftStatus[i] === 'modified'
                            ? 'var(--warning)'
                            : 'var(--text-primary)',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1 }}>
                  {diffData.rightName}
                </div>
                {rightLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '2px 12px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      background:
                        rightStatus[i] === 'added'
                          ? 'rgba(52, 199, 89, 0.1)'
                          : rightStatus[i] === 'modified'
                            ? 'rgba(255, 149, 0, 0.08)'
                            : 'transparent',
                      color:
                        rightStatus[i] === 'added'
                          ? 'var(--success)'
                          : rightStatus[i] === 'modified'
                            ? 'var(--warning)'
                            : 'var(--text-primary)',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: '60vh', overflow: 'auto' }}>
              {leftLines.map((line, i) => {
                const ls = leftStatus[i]
                const rs = rightStatus[i]
                if (ls === 'same' && rs === 'same') {
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '2px 12px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {line}
                    </div>
                  )
                }
                return (
                  <div key={i}>
                    {ls !== 'same' && (
                      <div
                        style={{
                          padding: '2px 12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          background: 'rgba(255, 59, 48, 0.1)',
                          color: 'var(--error)',
                        }}
                      >
                        - {line}
                      </div>
                    )}
                    {rs !== 'same' && (
                      <div
                        style={{
                          padding: '2px 12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          background: 'rgba(52, 199, 89, 0.1)',
                          color: 'var(--success)',
                        }}
                      >
                        + {rightLines[i]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
