import { useMemo } from 'react'
import { AlertTriangle, ExternalLink, FileText, Activity, MessageSquare, Link2, Check, X, Clock, User, Tag, Layers, Zap, Beaker, ListOrdered, FileCheck } from 'lucide-react'
import DOMPurify from 'dompurify'
import type { DataTableRow } from './types'

interface DataRowDetailProps {
  row: DataTableRow
  visibleColumns: Set<string>
  onColumnVisibilityChange: (key: string, visible: boolean) => void
}

export function DataRowDetail({ row }: DataRowDetailProps) {
  const resultBadgeClass = useMemo(() => {
    const r = row.result || 'unknown'
    const map: Record<string, string> = {
      passed: 'dt-result-passed',
      failed: 'dt-result-failed',
      blocked: 'dt-result-blocked',
      waiting: 'dt-result-waiting',
      error: 'dt-result-error',
      skipped: 'dt-result-skipped',
      incomplete: 'dt-result-incomplete',
      unknown: 'dt-result-unknown',
    }
    return map[r] || map.unknown
  }, [row.result])

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleString()
  }

  const renderSteps = () => {
    if (!row.steps || row.steps.length === 0) return null
    return (
      <div className="dt-detail-section">
        <div className="dt-detail-section-title">
          <Activity size={16} />
          Test Steps ({row.steps.length})
        </div>
        <div className="dt-detail-steps">
          {row.steps.map((step, index) => (
            <div key={index} className="dt-detail-step">
              <div className="dt-detail-step-header">
                <span className="dt-detail-step-num">Step {index + 1}</span>
                {step.result && (
                  <span className={`dt-result-badge ${resultBadgeClass}`}>
                    {step.result}
                  </span>
                )}
              </div>
              {step.comment && (
                <div className="dt-detail-step-comment">{step.comment}</div>
              )}
              {step.content && (
                <div className="dt-detail-step-content">
                  <div
                    className="dt-detail-step-html"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(step.content, {
                        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'blockquote', 'hr', 'img', 'sub', 'sup'],
                        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id', 'colspan', 'rowspan', 'style'],
                        ALLOW_DATA_ATTR: false,
                      })
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderComments = () => {
    if (!row.comments || row.comments.length === 0) return null
    return (
      <div className="dt-detail-section">
        <div className="dt-detail-section-title">
          <MessageSquare size={16} />
          Comments
        </div>
        <div className="dt-detail-steps">
          {row.comments.map((comment, index) => (
            <div key={index} className="dt-detail-comment">
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dt-text-muted)', marginBottom: 6, fontWeight: 600 }}>
                {comment.author} • {formatDate(comment.date)}
              </div>
              <div>{comment.text}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderLinks = () => {
    if (!row.links || row.links.length === 0) return null
    return (
      <div className="dt-detail-section">
        <div className="dt-detail-section-title">
          <Link2 size={16} />
          Related Links
        </div>
        <div className="dt-detail-links">
          {row.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dt-detail-link"
            >
              <ExternalLink size={12} />
              {link.title || link.url}
            </a>
          ))}
        </div>
      </div>
    )
  }

  const isExecuted = row.executed === 1 || row.executed === true

  return (
    <div className="dt-row-detail">
      <div className="dt-row-detail-grid">
        {/* Basic Info */}
        <div className="dt-detail-section" style={{ animationDelay: '0ms' }}>
          <div className="dt-detail-section-title">
            <FileText size={16} />
            Basic Info
          </div>
          <div className="dt-detail-info-grid">
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">ID</span>
              <span className="dt-detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{row.id}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Title</span>
              <span className="dt-detail-value">{row.title || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Project</span>
              <span className="dt-detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{row.projectId || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Test Run</span>
              <span className="dt-detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{row.testRunId || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Result</span>
              <span className="dt-detail-value">
                <span className={`dt-result-badge ${resultBadgeClass}`}>
                  {row.result || 'Unknown'}
                </span>
              </span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Executed</span>
              <span className="dt-detail-value">
                {isExecuted ? <Check size={14} style={{ color: 'var(--success)', marginRight: 4 }} /> : <X size={14} style={{ color: 'var(--dt-text-dim)', marginRight: 4 }} />}
                {isExecuted ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Priority</span>
              <span className="dt-detail-value">{row.priority || row.testPriority || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Created</span>
              <span className="dt-detail-value">{formatDate(row.createdAt)}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Updated</span>
              <span className="dt-detail-value">{formatDate(row.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Execution Detail */}
        <div className="dt-detail-section" style={{ animationDelay: '50ms' }}>
          <div className="dt-detail-section-title">
            <FileCheck size={16} />
            Execution Detail
          </div>
          <div className="dt-detail-info-grid">
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Duration</span>
              <span className="dt-detail-value">
                {typeof row.duration === 'number' ? `${row.duration}s` : '-'}
              </span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Executed Time</span>
              <span className="dt-detail-value">{row.executedTime || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><User size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Executed By</span>
              <span className="dt-detail-value">{row.executedBy || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><ListOrdered size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Step Results</span>
              <span className="dt-detail-value">{row.stepResultCount ?? '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><ListOrdered size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Designed Steps</span>
              <span className="dt-detail-value">{row.testStepCount ?? '-'}</span>
            </div>
            {row.defectURI && row.defectURI !== 'null' && (
              <div className="dt-detail-info-item dt-detail-info-full">
                <span className="dt-detail-label"><AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Defect</span>
                <span className="dt-detail-value">
                  <a href={row.defectURI} target="_blank" rel="noopener noreferrer" className="dt-detail-link">
                    <ExternalLink size={12} />
                    {row.defectURI}
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Case Attributes */}
        <div className="dt-detail-section" style={{ animationDelay: '100ms' }}>
          <div className="dt-detail-section-title">
            <Beaker size={16} />
            Case Attributes
          </div>
          <div className="dt-detail-info-grid">
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Status</span>
              <span className="dt-detail-value">{row.caseStatus || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><Zap size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Automation</span>
              <span className="dt-detail-value">{row.automation || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><User size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Assignee</span>
              <span className="dt-detail-value">{row.assignee || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><Layers size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Feature Cluster</span>
              <span className="dt-detail-value">{row.featureCluster || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label"><Tag size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Feature Name</span>
              <span className="dt-detail-value">{row.featureName || '-'}</span>
            </div>
            <div className="dt-detail-info-item">
              <span className="dt-detail-label">Test Environment</span>
              <span className="dt-detail-value">{row.testEnvironment || '-'}</span>
            </div>
            {row.prerequisites && (
              <div className="dt-detail-info-item dt-detail-info-full">
                <span className="dt-detail-label">Prerequisites</span>
                <span className="dt-detail-value">{row.prerequisites}</span>
              </div>
            )}
            {row.testContent && (
              <div className="dt-detail-info-item dt-detail-info-full">
                <span className="dt-detail-label">Test Content</span>
                <span className="dt-detail-value">{row.testContent}</span>
              </div>
            )}
            {row.tags && row.tags.length > 0 && (
              <div className="dt-detail-info-item dt-detail-info-full">
                <span className="dt-detail-label">Tags</span>
                <span className="dt-detail-value">
                  <div className="dt-detail-links">
                    {row.tags.map((tag, i) => (
                      <span key={i} className="dt-detail-link" style={{ cursor: 'default' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </span>
              </div>
            )}
          </div>
        </div>

        {row.fetchFailed && (
          <div className="dt-detail-warning">
            <div className="dt-detail-warning-content">
              <AlertTriangle size={16} />
              <span>Some data could not be fetched completely. Displaying cached or partial information.</span>
            </div>
          </div>
        )}

        {renderSteps()}
        {renderComments()}
        {renderLinks()}
      </div>
    </div>
  )
}
