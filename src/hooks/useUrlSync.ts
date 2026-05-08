import { useEffect } from 'react'
import { useDataTableStore } from '@/stores/useDataTableStore'

function serializeFilters(filters: Record<string, any>): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(filters)))
  } catch {
    return ''
  }
}

function deserializeFilters(str: string): Record<string, any> | null {
  try {
    return JSON.parse(decodeURIComponent(atob(str)))
  } catch {
    return null
  }
}

export function useUrlSync() {
  const filters = useDataTableStore((s) => s.filters)
  const sortState = useDataTableStore((s) => s.sortState)
  const searchQuery = useDataTableStore((s) => s.searchQuery)
  const currentPage = useDataTableStore((s) => s.currentPage)
  const pageSize = useDataTableStore((s) => s.pageSize)
  const setFilter = useDataTableStore((s) => s.setFilter)
  const clearFilters = useDataTableStore((s) => s.clearFilters)
  const addSort = useDataTableStore((s) => s.addSort)
  const clearSorts = useDataTableStore((s) => s.clearSorts)
  const setSearchQuery = useDataTableStore((s) => s.setSearchQuery)
  const setCurrentPage = useDataTableStore((s) => s.setCurrentPage)
  const setPageSize = useDataTableStore((s) => s.setPageSize)

  // Sync state TO URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (Object.keys(filters).length > 0) {
      params.set('filters', serializeFilters(filters))
    } else {
      params.delete('filters')
    }

    if (sortState.length > 0) {
      params.set('sort', btoa(encodeURIComponent(JSON.stringify(sortState))))
    } else {
      params.delete('sort')
    }

    if (searchQuery) {
      params.set('q', searchQuery)
    } else {
      params.delete('q')
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage))
    } else {
      params.delete('page')
    }

    if (pageSize !== 20) {
      params.set('size', String(pageSize))
    } else {
      params.delete('size')
    }

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    window.history.replaceState(null, '', newUrl)
  }, [filters, sortState, searchQuery, currentPage, pageSize])

  // Sync state FROM URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const filtersStr = params.get('filters')
    if (filtersStr) {
      const parsed = deserializeFilters(filtersStr)
      if (parsed) {
        clearFilters()
        Object.values(parsed).forEach((filter: any) => {
          if (filter && filter.key) {
            setFilter(filter)
          }
        })
      }
    }

    const sortStr = params.get('sort')
    if (sortStr) {
      try {
        const parsed = JSON.parse(decodeURIComponent(atob(sortStr)))
        if (Array.isArray(parsed)) {
          clearSorts()
          parsed.forEach((s: any) => {
            if (s.key && s.direction) {
              addSort(s.key, s.direction)
            }
          })
        }
      } catch {}
    }

    const q = params.get('q')
    if (q) {
      setSearchQuery(q)
    }

    const page = params.get('page')
    if (page) {
      const n = Number(page)
      if (!isNaN(n) && n > 0) {
        setCurrentPage(n)
      }
    }

    const size = params.get('size')
    if (size) {
      const n = Number(size)
      if (!isNaN(n) && n > 0) {
        setPageSize(n)
      }
    }
  }, [])
}
