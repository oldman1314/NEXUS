import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Filter, X, Check, ListFilter, Hash, Calendar } from 'lucide-react'
import type { Column } from './types'

interface ColumnFilterPopupProps {
  column: Column
  filterValue: string | string[] | null
  values: string[]
  valueCounts?: Map<string, number>
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onApply: (value: string | string[] | null) => void
  onClear: () => void
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export function ColumnFilterPopup({
  column,
  filterValue,
  values,
  valueCounts,
  isOpen,
  onOpen,
  onClose,
  onApply,
  onClear,
  containerRef,
}: ColumnFilterPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isRangeType = column.type === 'number' || column.type === 'date'
  const [searchText, setSearchText] = useState('')
  const [selectedValues, setSelectedValues] = useState<string[]>(
    Array.isArray(filterValue) ? filterValue : filterValue ? [filterValue] : []
  )
  const [rangeMin, setRangeMin] = useState('')
  const [rangeMax, setRangeMax] = useState('')
  const [rangeError, setRangeError] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    visibility: 'hidden',
  })

  useEffect(() => {
    if (isOpen) {
      setSelectedValues(Array.isArray(filterValue) ? filterValue : filterValue ? [filterValue] : [])
      setSearchText('')
      setActiveIndex(-1)
      if (isRangeType && filterValue && typeof filterValue === 'object' && !Array.isArray(filterValue)) {
        const range = filterValue as { min?: number | string; max?: number | string }
        setRangeMin(range.min !== undefined ? String(range.min) : '')
        setRangeMax(range.max !== undefined ? String(range.max) : '')
      } else {
        setRangeMin('')
        setRangeMax('')
      }
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    }
  }, [isOpen, filterValue, isRangeType])

  const updatePosition = useCallback(() => {
    if (!isOpen || !buttonRef.current || !popupRef.current) return

    const container = containerRef?.current
    const btnRect = buttonRef.current.getBoundingClientRect()
    const popupRect = popupRef.current.getBoundingClientRect()

    const popupWidth = popupRect.width || 280
    const popupHeight = popupRect.height || 320

    let left: number
    let top: number

    if (container) {
      const containerRect = container.getBoundingClientRect()
      left = btnRect.right - containerRect.left - popupWidth
      top = btnRect.bottom - containerRect.top + 8

      if (left < 8) left = 8
      if (left + popupWidth > containerRect.width - 8) {
        left = containerRect.width - popupWidth - 8
      }
      if (top + popupHeight > containerRect.height - 8) {
        top = btnRect.top - containerRect.top - popupHeight - 8
      }
    } else {
      left = btnRect.right - popupWidth
      top = btnRect.bottom + 8

      if (left < 8) left = 8
      if (left + popupWidth > window.innerWidth - 8) {
        left = window.innerWidth - popupWidth - 8
      }
      if (top + popupHeight > window.innerHeight - 8) {
        top = btnRect.top - popupHeight - 8
      }
    }

    setPopupStyle({
      position: 'absolute',
      left,
      top,
      visibility: 'visible',
    })
  }, [isOpen, containerRef])

  useLayoutEffect(() => {
    updatePosition()
  }, [updatePosition])

  useEffect(() => {
    if (!isOpen) return

    const container = containerRef?.current
    if (!container) return

    const scrollParents: Element[] = []
    let el: Element | null = buttonRef.current
    while (el) {
      const style = getComputedStyle(el)
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el !== container) {
        scrollParents.push(el)
      }
      el = el.parentElement
    }

    const onScroll = () => onClose()
    scrollParents.forEach((parent) => {
      parent.addEventListener('scroll', onScroll, { passive: true })
    })

    return () => {
      scrollParents.forEach((parent) => {
        parent.removeEventListener('scroll', onScroll)
      })
    }
  }, [isOpen, onClose, containerRef])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const filteredValues = useMemo(() => {
    const result = values.filter((v) => v.toLowerCase().includes(searchText.toLowerCase()))
    return result
  }, [values, searchText])

  useEffect(() => {
    if (!isOpen || isRangeType) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const len = filteredValues.length
      if (len === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev < len - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : len - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < len) {
            handleToggleValue(filteredValues[activeIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'Tab':
          if (popupRef.current && !popupRef.current.contains(document.activeElement)) {
            e.preventDefault()
            searchInputRef.current?.focus()
          }
          break
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isRangeType, filteredValues, activeIndex, onClose])

  useEffect(() => {
    if (activeIndex >= 0 && popupRef.current) {
      const listEl = popupRef.current.querySelector('.dt-col-filter-select-list')
      if (listEl) {
        const items = listEl.querySelectorAll('.dt-col-filter-select-item')
        if (items[activeIndex]) {
          items[activeIndex].scrollIntoView({ block: 'nearest' })
        }
      }
    }
  }, [activeIndex])

  const filterIcon = useMemo(() => {
    if (isRangeType) {
      return column.type === 'date' ? <Calendar size={12} /> : <Hash size={12} />
    }
    if (column.type === 'string' && column.filterable) {
      return <ListFilter size={12} />
    }
    return <Filter size={12} />
  }, [column.type, column.filterable, isRangeType])

  const handleToggleValue = (value: string) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const handleSelectAll = () => {
    setSelectedValues(filteredValues)
  }

  const handleSelectNone = () => {
    setSelectedValues([])
  }

  const handleApply = () => {
    if (isRangeType) {
      const min = rangeMin ? Number(rangeMin) : undefined
      const max = rangeMax ? Number(rangeMax) : undefined
      if (min !== undefined || max !== undefined) {
        onApply({ min, max } as any)
      } else {
        onApply(null)
      }
    } else {
      if (selectedValues.length === 0) {
        onApply(null)
      } else if (selectedValues.length === 1) {
        onApply(selectedValues[0])
      } else {
        onApply(selectedValues)
      }
    }
  }

  const hasFilter = filterValue !== null && filterValue !== undefined && filterValue !== ''

  const portalTarget = containerRef?.current || document.body

  const popupContent = (
    <div className="dt-col-filter-popup" ref={popupRef} style={popupStyle} role="dialog" aria-label={`Filter ${column.title}`}>
      <div className="dt-col-filter-header">
        <span>{column.title}</span>
        <button onClick={onClose} aria-label="Close filter">
          <X size={14} />
        </button>
      </div>

      {isRangeType ? (
        <div className="dt-col-filter-range">
          <input
            type={column.type === 'number' ? 'number' : 'date'}
            className="dt-col-filter-input"
            placeholder="Min"
            aria-label="Minimum value"
            value={rangeMin}
            onChange={(e) => {
              const val = e.target.value
              setRangeMin(val)
              setRangeError('')
              if (rangeMax && val && Number(val) > Number(rangeMax)) {
                setRangeError('最小值不能大于最大值')
              }
            }}
          />
          <span className="dt-col-filter-range-sep">-</span>
          <input
            type={column.type === 'number' ? 'number' : 'date'}
            className="dt-col-filter-input"
            placeholder="Max"
            aria-label="Maximum value"
            value={rangeMax}
            onChange={(e) => {
              const val = e.target.value
              setRangeMax(val)
              setRangeError('')
              if (rangeMin && val && Number(val) < Number(rangeMin)) {
                setRangeError('最大值不能小于最小值')
              }
            }}
          />
          {rangeError && (
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--error)', gridColumn: '1 / -1' }}>
              {rangeError}
            </span>
          )}
        </div>
      ) : (
        <>
          <input
            ref={searchInputRef}
            type="text"
            className="dt-col-filter-input"
            placeholder="Search..."
            aria-label="Search values"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="dt-col-filter-special">
            <button className="dt-col-filter-special-btn" onClick={handleSelectAll}>Select All</button>
            <button className="dt-col-filter-special-btn" onClick={handleSelectNone}>Clear All</button>
          </div>
          <div className="dt-col-filter-select-list" role="listbox" aria-label="Select values">
            {filteredValues.length === 0 ? (
              <div className="dt-col-filter-no-results">No values found</div>
            ) : (
              filteredValues.map((value, index) => (
                <div
                  key={value}
                  className={`dt-col-filter-select-item ${activeIndex === index ? 'dt-col-filter-select-item-active' : ''}`}
                  role="option"
                  aria-selected={selectedValues.includes(value)}
                  tabIndex={-1}
                  onClick={() => handleToggleValue(value)}
                  title={value}
                >
                  <span
                    className={`dt-col-filter-checkbox ${selectedValues.includes(value) ? 'checked' : ''}`}
                  >
                    {selectedValues.includes(value) && <Check size={10} />}
                  </span>
                  <span className="dt-col-filter-select-label">{value}</span>
                  {valueCounts && valueCounts.has(value) && (
                    <span className="dt-col-filter-select-count">({valueCounts.get(value)})</span>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      <div className="dt-col-filter-actions">
        <button
          className="dt-col-filter-cancel"
          onClick={() => {
            setSelectedValues([])
            setRangeMin('')
            setRangeMax('')
            onClear()
          }}
        >
          Clear
        </button>
        <button className="dt-col-filter-apply" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  )

  return (
    <div className="dt-col-filter">
      <button
        ref={buttonRef}
        className={`dt-col-filter-btn ${hasFilter ? 'active' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filter ${column.title}`}
        onClick={(e) => {
          e.stopPropagation()
          isOpen ? onClose() : onOpen()
        }}
      >
        {filterIcon}
      </button>

      {isOpen && createPortal(popupContent, portalTarget)}
    </div>
  )
}
