import React from 'react'

interface DataTableEmptyStateProps {
  loading: boolean
  visibleCols: { key: string; title: string; width?: number | string; key_is_checkbox?: boolean }[]
  gtc: string
  dataLength: number
  searchQuery: string
  filterState: Record<string, unknown>
}

export function DataTableEmptyState({ loading, visibleCols, gtc, dataLength, searchQuery, filterState }: DataTableEmptyStateProps) {
  if (loading) {
    return (
      <div className="dt-table-container dt-table-skeleton">
        <div className="dt-table-header-row" style={{ gridTemplateColumns: gtc, '--dt-grid-columns': gtc } as React.CSSProperties} role="row">
          {visibleCols.map((col) => (
            <div key={col.key} className={'dt-table-header-cell' + (col.key === 'checkbox' ? ' checkbox' : '')} role="columnheader">
              <div className="dt-table-header-content">
                {col.key === 'checkbox' ? (
                  <input type="checkbox" disabled />
                ) : (
                  <span className="dt-table-header-label">{col.title}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="dt-table-skeleton-row" style={{ gridTemplateColumns: gtc }}>
            {visibleCols.map((_, j) => <div key={j} className="dt-table-skeleton-cell" />)}
          </div>
        ))}
      </div>
    )
  }

  if (dataLength === 0) {
    const hasFilters = Object.keys(filterState).length > 0
    const hasSearch = searchQuery.trim().length > 0
    const title = hasFilters || hasSearch ? 'No matching results' : 'No data available'
    const hint = hasFilters || hasSearch
      ? 'Try adjusting your filters or search query'
      : 'Enter project ID and test run ID to load data'

    return (
      <div className="dt-empty-state">
        <svg width="120" height="120" viewBox="0 0 120 120" className="dt-empty-illustration-svg">
          <rect x="10" y="20" width="100" height="8" rx="4" fill="currentColor" opacity="0.1" />
          <rect x="10" y="36" width="80" height="6" rx="3" fill="currentColor" opacity="0.06" />
          <rect x="10" y="50" width="100" height="6" rx="3" fill="currentColor" opacity="0.06" />
          <rect x="10" y="64" width="60" height="6" rx="3" fill="currentColor" opacity="0.06" />
          <rect x="10" y="78" width="90" height="6" rx="3" fill="currentColor" opacity="0.06" />
        </svg>
        <h3 className="dt-empty-title">{title}</h3>
        <p className="dt-empty-hint">{hint}</p>
      </div>
    )
  }

  return null
}
