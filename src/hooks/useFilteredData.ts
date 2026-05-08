import { useMemo, useCallback } from 'react'
import { useDataTableStore } from '@/stores/useDataTableStore'
import type { MergedTestCase, ColumnFilter } from '@/types/data-table'

function getCellValue(row: MergedTestCase, key: string): string | number {
  switch (key) {
    case 'id': return row.id
    case 'title': return row.title
    case 'result': return row.result
    case 'testPriority': return row.testPriority
    case 'testContent': return row.testContent
    case 'testEnvironment': return row.testEnvironment
    case 'executed': return row.executed ? '是' : '否'
    case 'duration': return row.duration ?? ''
    case 'executedTime': return row.executedTime ?? ''
    case 'executedBy': return row.executedBy ?? ''
    case 'stepResultCount': return row.stepResultCount ?? ''
    case 'defectURI': return row.defectURI ?? ''
    case 'assignee': return row.assignee ?? ''
    case 'caseStatus': return row.caseStatus ?? ''
    case 'automation': return row.automation ?? ''
    case 'featureCluster': return row.featureCluster ?? ''
    case 'featureName': return row.featureName ?? ''
    case 'testStepCount': return row.testStepCount ?? ''
    default: return ''
  }
}

function compareValues(a: string | number, b: string | number): number {
  const aIsEmpty = a === '' || a === undefined || a === null
  const bIsEmpty = b === '' || b === undefined || b === null
  if (aIsEmpty && bIsEmpty) return 0
  if (aIsEmpty) return 1
  if (bIsEmpty) return -1
  const aNum = Number(a)
  const bNum = Number(b)
  if (!isNaN(aNum) && !isNaN(bNum) && a !== '' && b !== '') {
    return aNum - bNum
  }
  const aStr = String(a)
  const bStr = String(b)
  return aStr.localeCompare(bStr, 'zh-CN')
}

function applyFilter(row: MergedTestCase, filter: ColumnFilter): boolean {
  const cellValue = getCellValue(row, filter.key)
  const strValue = String(cellValue)

  if (filter.type === 'text') {
    const search = filter.value as string
    if (!search) return true
    return strValue.toLowerCase().includes(search.toLowerCase())
  }

  if (filter.type === 'select') {
    const selected = filter.value as string[]
    if (!selected.length) return true
    return selected.includes(strValue)
  }

  if (filter.type === 'numberRange') {
    const range = filter.value as { min?: number; max?: number }
    const numValue = Number(cellValue)
    if (isNaN(numValue)) return true
    if (range.min !== undefined && range.min !== null && numValue < range.min) return false
    if (range.max !== undefined && range.max !== null && numValue > range.max) return false
    return true
  }

  if (filter.type === 'dateRange') {
    const range = filter.value as { min?: string; max?: string }
    if (!cellValue) return true
    const dateValue = new Date(String(cellValue)).getTime()
    if (isNaN(dateValue)) return true
    if (range.min) {
      const minDate = new Date(range.min).getTime()
      if (!isNaN(minDate) && dateValue < minDate) return false
    }
    if (range.max) {
      const maxDate = new Date(range.max).getTime()
      if (!isNaN(maxDate) && dateValue > maxDate) return false
    }
    return true
  }

  if (filter.type === 'empty') {
    return !cellValue || String(cellValue).trim() === ''
  }

  if (filter.type === 'notEmpty') {
    return !!cellValue && String(cellValue).trim() !== ''
  }

  return true
}

export function useFilteredData() {
  const data = useDataTableStore((s) => s.data)
  const filters = useDataTableStore((s) => s.filters)
  const columns = useDataTableStore((s) => s.columns)
  const sortState = useDataTableStore((s) => s.sortState)
  const currentPage = useDataTableStore((s) => s.currentPage)
  const pageSize = useDataTableStore((s) => s.pageSize)
  const searchQuery = useDataTableStore((s) => s.searchQuery)

  const filteredData = useMemo(() => {
    const filterEntries = Object.values(filters)
    let result = data

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const allKeys = columns.map((c) => c.key)
      result = result.filter((row) =>
        allKeys.some((key) =>
          String(getCellValue(row, key)).toLowerCase().includes(query)
        )
      )
    }

    if (filterEntries.length > 0) {
      result = result.filter((row) =>
        filterEntries.every((filter) => applyFilter(row, filter))
      )
    }

    const hasSort = sortState.length > 0

    if (hasSort) {
      result = [...result].sort((a, b) => {
        for (const { key, direction } of sortState) {
          const cmp = compareValues(getCellValue(a, key), getCellValue(b, key))
          if (cmp !== 0) return direction === 'asc' ? cmp : -cmp
        }
        return 0
      })
    }

    return result
  }, [data, filters, searchQuery, columns, sortState])

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.visible),
    [columns]
  )

  const uniqueValuesMap = useMemo(() => {
    const map = new Map<string, string[]>()
    const keys = new Set(columns.map((c) => c.key))
    keys.forEach((key) => {
      const values = new Set<string>()
      data.forEach((row) => {
        const val = String(getCellValue(row, key))
        if (val) values.add(val)
      })
      map.set(key, Array.from(values).sort())
    })
    return map
  }, [data, columns])

  const getUniqueValues = useCallback(
    (key: string): string[] => uniqueValuesMap.get(key) || [],
    [uniqueValuesMap]
  )

  return { filteredData, paginatedData, visibleColumns, getUniqueValues, getCellValue, totalPages }
}

export { getCellValue }
