import { useState, useMemo } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ColumnFilter, ColumnConfig } from '@/types/data-table'

interface FilterTagsProps {
  filters: Record<string, ColumnFilter>
  columns: ColumnConfig[]
  onRemoveFilter: (key: string) => void
  onClearAll: () => void
}

const MAX_VISIBLE_TAGS = 3

export function FilterTags({ filters, columns, onRemoveFilter, onClearAll }: FilterTagsProps) {
  const [expanded, setExpanded] = useState(false)

  const filterEntries = useMemo(() => {
    return Object.entries(filters).map(([key, filter]) => {
      const col = columns.find((c) => c.key === key)
      let displayValue: string

      if (filter.type === 'empty') {
        displayValue = 'is empty'
      } else if (filter.type === 'notEmpty') {
        displayValue = 'is not empty'
      } else if (Array.isArray(filter.value)) {
        displayValue = filter.value.join(', ')
      } else if (typeof filter.value === 'object' && filter.value !== null) {
        const range = filter.value as { min?: number | string; max?: number | string }
        const min = range.min !== undefined ? String(range.min) : ''
        const max = range.max !== undefined ? String(range.max) : ''
        if (min && max) displayValue = `${min} - ${max}`
        else if (min) displayValue = `>= ${min}`
        else if (max) displayValue = `<= ${max}`
        else displayValue = ''
      } else {
        displayValue = String(filter.value)
      }

      return {
        key,
        label: col?.label || key,
        value: displayValue,
      }
    })
  }, [filters, columns])

  const hasMore = filterEntries.length > MAX_VISIBLE_TAGS
  const visibleEntries = expanded ? filterEntries : filterEntries.slice(0, MAX_VISIBLE_TAGS)
  const hiddenCount = filterEntries.length - MAX_VISIBLE_TAGS

  return (
    <div className="dt-filter-tags">
      <div className="dt-filter-tags-list">
        {visibleEntries.map((entry) => (
          <span key={entry.key} className="dt-filter-tag">
            <span className="dt-filter-tag-label">{entry.label}</span>
            <span className="dt-filter-tag-sep">:</span>
            <span className="dt-filter-tag-value" title={entry.value}>
              {entry.value}
            </span>
            <button
              className="dt-filter-tag-remove"
              onClick={() => onRemoveFilter(entry.key)}
              title="Remove filter"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="dt-filter-tags-actions">
        {hasMore && (
          <button
            className="dt-filter-tags-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp size={12} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                +{hiddenCount} more
              </>
            )}
          </button>
        )}
        <button className="dt-filter-tags-clear" onClick={onClearAll}>
          Clear all
        </button>
      </div>
    </div>
  )
}
