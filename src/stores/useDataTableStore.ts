import { create } from 'zustand'
import type { DataTableMode, DataTableDensity, MergedTestCase, ColumnConfig, ColumnFilter, SortState, TableViewPreset } from '@/types/data-table'

const SIMPLE_COLUMNS: ColumnConfig[] = [
  { key: 'checkbox', label: '', visible: true, filterable: false, filterType: 'text', width: 52, minWidth: 52, mode: 'simple', fixed: 'left' },
  { key: 'id', label: 'ID', visible: true, filterable: true, filterType: 'text', width: 100, minWidth: 80, mode: 'simple', fixed: 'left' },
  { key: 'title', label: 'Title', visible: true, filterable: true, filterType: 'text', width: 300, minWidth: 200, mode: 'simple' },
  { key: 'result', label: 'Result', visible: true, filterable: true, filterType: 'select', width: 90, minWidth: 80, mode: 'simple' },
  { key: 'testPriority', label: 'Priority', visible: true, filterable: true, filterType: 'select', width: 90, minWidth: 70, mode: 'simple' },
  { key: 'testContent', label: 'Content', visible: true, filterable: true, filterType: 'text', width: 160, minWidth: 100, mode: 'simple' },
  { key: 'testEnvironment', label: 'Environment', visible: true, filterable: true, filterType: 'select', width: 110, minWidth: 90, mode: 'simple' },
  { key: 'executed', label: 'Executed', visible: true, filterable: true, filterType: 'select', width: 90, minWidth: 70, mode: 'simple' },
]

const DETAILED_EXTRA_COLUMNS: ColumnConfig[] = [
  { key: 'duration', label: 'Duration', visible: true, filterable: true, filterType: 'numberRange', width: 90, minWidth: 70, mode: 'detailed' },
  { key: 'executedTime', label: 'Executed Time', visible: true, filterable: true, filterType: 'dateRange', width: 160, minWidth: 120, mode: 'detailed' },
  { key: 'executedBy', label: 'Executed By', visible: true, filterable: true, filterType: 'text', width: 120, minWidth: 80, mode: 'detailed' },
  { key: 'stepResultCount', label: 'Step Results', visible: false, filterable: true, filterType: 'numberRange', width: 100, minWidth: 80, mode: 'detailed' },
  { key: 'defectURI', label: 'Defect', visible: false, filterable: false, filterType: 'text', width: 120, minWidth: 80, mode: 'detailed' },
  { key: 'assignee', label: 'Assignee', visible: true, filterable: true, filterType: 'text', width: 120, minWidth: 80, mode: 'detailed' },
  { key: 'caseStatus', label: 'Status', visible: false, filterable: true, filterType: 'select', width: 100, minWidth: 80, mode: 'detailed' },
  { key: 'automation', label: 'Automation', visible: true, filterable: true, filterType: 'select', width: 140, minWidth: 100, mode: 'detailed' },
  { key: 'featureCluster', label: 'Feature Cluster', visible: true, filterable: true, filterType: 'select', width: 100, minWidth: 80, mode: 'detailed' },
  { key: 'featureName', label: 'Feature Name', visible: true, filterable: true, filterType: 'text', width: 120, minWidth: 80, mode: 'detailed' },
  { key: 'testStepCount', label: 'Test Steps', visible: false, filterable: true, filterType: 'numberRange', width: 100, minWidth: 80, mode: 'detailed' },
]

function getColumnsForMode(mode: DataTableMode): ColumnConfig[] {
  if (mode === 'simple') return [...SIMPLE_COLUMNS]
  return [...SIMPLE_COLUMNS, ...DETAILED_EXTRA_COLUMNS]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

const STORAGE_KEY = 'dt-persist'

function loadPersistedState(): Partial<DataTableState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)

    const validatedColumnWidths = (obj: unknown): Record<string, number> => {
      if (typeof obj !== 'object' || obj === null) return {}
      const result: Record<string, number> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'number' && value > 0) {
          result[key] = value
        }
      }
      return result
    }

    const validatedQueryHistory = (arr: unknown): Array<{ projectId: string; testRunId: string; timestamp: number }> => {
      if (!Array.isArray(arr)) return []
      return arr.filter((item): item is { projectId: string; testRunId: string; timestamp: number } =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.projectId === 'string' &&
        typeof item.testRunId === 'string' &&
        (typeof item.timestamp === 'number' || item.timestamp === undefined)
      ).map((item) => ({
        ...item,
        timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
      }))
    }

    return {
      mode: parsed.mode ?? 'simple',
      projectId: parsed.projectId ?? '',
      testRunId: parsed.testRunId ?? '',
      queryHistory: validatedQueryHistory(parsed.queryHistory),
      columnWidths: validatedColumnWidths(parsed.columnWidths),
      viewPresets: Array.isArray(parsed.viewPresets) ? parsed.viewPresets : [],
      density: parsed.density ?? 'standard',
      pageSize: parsed.pageSize ?? 20,
    }
  } catch {
    return {}
  }
}

function persistState(state: DataTableState) {
  try {
    const toSave = {
      mode: state.mode,
      projectId: state.projectId,
      testRunId: state.testRunId,
      queryHistory: state.queryHistory,
      columnWidths: state.columnWidths,
      viewPresets: state.viewPresets,
      density: state.density,
      pageSize: state.pageSize,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { }
}

interface CacheEntry {
  projectId: string
  testRunId: string
  data: MergedTestCase[]
}

interface DataTableState {
  mode: DataTableMode
  density: DataTableDensity
  projectId: string
  testRunId: string
  loading: boolean
  loadingProgress: string
  loadingProgressCurrent: number
  loadingProgressTotal: number
  data: MergedTestCase[]
  simpleCache: CacheEntry | null
  detailedCache: CacheEntry | null
  selectedRows: Set<string>
  expandedRows: Set<string>
  columns: ColumnConfig[]
  filters: Record<string, ColumnFilter>
  error: string | null
  queryHistory: Array<{ projectId: string; testRunId: string; timestamp: number }>
  pageSize: number
  currentPage: number
  searchQuery: string
  columnWidths: Record<string, number>
  sortState: SortState[]
  viewPresets: TableViewPreset[]
  activePresetId: string | null

  setMode: (mode: DataTableMode) => void
  setDensity: (density: DataTableDensity) => void
  setProjectId: (id: string) => void
  setTestRunId: (id: string) => void
  setLoading: (loading: boolean) => void
  setLoadingProgress: (progress: string, current?: number, total?: number) => void
  setData: (data: MergedTestCase[]) => void
  updateCache: (mode: DataTableMode, data: MergedTestCase[]) => void
  setError: (error: string | null) => void
  toggleRowSelection: (id: string) => void
  toggleAllRows: (ids: string[]) => void
  clearSelection: () => void
  invertSelection: (allIds: string[]) => void
  selectFiltered: (filteredIds: string[]) => void
  expandSelected: (selectedIds: string[]) => void
  collapseAll: () => void
  toggleRowExpanded: (id: string) => void
  setColumnVisible: (key: string, visible: boolean) => void
  setFilter: (filter: ColumnFilter) => void
  removeFilter: (key: string) => void
  clearFilters: () => void
  toggleSort: (key: string) => void
  addSort: (key: string, direction: 'asc' | 'desc') => void
  removeSort: (key: string) => void
  clearSorts: () => void
  addQueryHistory: (projectId: string, testRunId: string) => void
  reset: () => void
  setPageSize: (size: number) => void
  setCurrentPage: (page: number) => void
  setSearchQuery: (query: string) => void
  setColumnWidth: (key: string, width: number) => void
  savePreset: (name: string) => void
  applyPreset: (id: string) => void
  deletePreset: (id: string) => void
  reorderColumn: (fromIndex: number, toIndex: number) => void
  updateRow: (id: string, updates: Partial<MergedTestCase>) => void
}

export const useDataTableStore = create<DataTableState>()((set) => {
  const persisted = loadPersistedState()
  return {
    mode: persisted.mode ?? 'simple',
    density: persisted.density ?? 'standard',
    projectId: persisted.projectId ?? '',
    testRunId: persisted.testRunId ?? '',
    loading: false,
    loadingProgress: '',
    loadingProgressCurrent: 0,
    loadingProgressTotal: 0,
    data: [],
    simpleCache: null,
    detailedCache: null,
    selectedRows: new Set<string>(),
    expandedRows: new Set<string>(),
    columns: getColumnsForMode('simple'),
    filters: {},
    error: null,
    queryHistory: persisted.queryHistory ?? [],
    currentPage: 1,
    pageSize: persisted.pageSize ?? 20,
    searchQuery: '',
    columnWidths: persisted.columnWidths ?? {},
    sortState: [],
    viewPresets: persisted.viewPresets ?? [],
    activePresetId: null,

    setMode: (mode) => set((state) => {
      const cache = mode === 'simple' ? state.simpleCache : state.detailedCache
      const cachedData = (cache && cache.projectId === state.projectId && cache.testRunId === state.testRunId)
        ? cache.data
        : []
      return {
        mode,
        columns: getColumnsForMode(mode),
        filters: {},
        selectedRows: new Set(),
        expandedRows: new Set(),
        data: cachedData.length > 0 ? cachedData : [],
        error: null,
        currentPage: 1,
        sortState: [],
      }
    }),
    setDensity: (density) => set({ density }),
    setProjectId: (id) => set({ projectId: id }),
    setTestRunId: (id) => set({ testRunId: id }),
    setLoading: (loading) => set({ loading }),
    setLoadingProgress: (progress, current, total) => set({ loadingProgress: progress, loadingProgressCurrent: current ?? 0, loadingProgressTotal: total ?? 0 }),
    setData: (data) => set((state) => {
      const cacheKey = state.mode === 'simple' ? 'simpleCache' : 'detailedCache'
      return {
        data,
        error: null,
        currentPage: 1,
        [cacheKey]: { projectId: state.projectId, testRunId: state.testRunId, data }
      }
    }),

    updateCache: (mode, data) => set((state) => {
      const cacheKey = mode === 'simple' ? 'simpleCache' : 'detailedCache'
      return { [cacheKey]: { projectId: state.projectId, testRunId: state.testRunId, data } }
    }),
    setError: (error) => set({ error, loading: false }),

    toggleRowSelection: (id) =>
      set((state) => {
        const next = new Set(state.selectedRows)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return { selectedRows: next }
      }),

    toggleAllRows: (ids) =>
      set((state) => {
        const allSelected = ids.every((id) => state.selectedRows.has(id))
        const next = new Set(state.selectedRows)
        if (allSelected) {
          ids.forEach((id) => next.delete(id))
        } else {
          ids.forEach((id) => next.add(id))
        }
        return { selectedRows: next }
      }),

    clearSelection: () => set({ selectedRows: new Set<string>() }),

    invertSelection: (allIds: string[]) =>
      set((state) => {
        const next = new Set(state.selectedRows)
        allIds.forEach((id) => {
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
        })
        return { selectedRows: next }
      }),

    selectFiltered: (filteredIds: string[]) =>
      set(() => ({
        selectedRows: new Set(filteredIds),
      })),

    expandSelected: (selectedIds: string[]) =>
      set((state) => ({
        expandedRows: new Set([...state.expandedRows, ...selectedIds]),
      })),

    collapseAll: () => set({ expandedRows: new Set<string>() }),

    toggleRowExpanded: (id) =>
      set((state) => {
        const next = new Set(state.expandedRows)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return { expandedRows: next }
      }),

    setColumnVisible: (key, visible) =>
      set((state) => ({
        columns: state.columns.map((col) =>
          col.key === key ? { ...col, visible } : col
        ),
      })),

    setFilter: (filter) =>
      set((state) => ({
        filters: { ...state.filters, [filter.key]: filter },
        currentPage: 1,
      })),

    removeFilter: (key) =>
      set((state) => {
        const next = { ...state.filters }
        delete next[key]
        return { filters: next, currentPage: 1 }
      }),

    clearFilters: () => set({ filters: {}, currentPage: 1 }),

    toggleSort: (key) =>
      set((state) => {
        const existing = state.sortState.findIndex((s) => s.key === key)
        if (existing < 0) {
          return { sortState: [...state.sortState, { key, direction: 'asc' }] }
        }
        if (state.sortState[existing].direction === 'asc') {
          const next = [...state.sortState]
          next[existing] = { key, direction: 'desc' }
          return { sortState: next }
        }
        return { sortState: state.sortState.filter((s) => s.key !== key) }
      }),

    addSort: (key, direction) =>
      set((state) => {
        const existing = state.sortState.findIndex((s) => s.key === key)
        let newSortState: SortState[]
        if (existing >= 0) {
          newSortState = [...state.sortState]
          newSortState[existing] = { key, direction }
        } else {
          newSortState = [...state.sortState, { key, direction }]
        }
        return { sortState: newSortState }
      }),

    removeSort: (key) =>
      set((state) => ({
        sortState: state.sortState.filter((s) => s.key !== key),
      })),

    clearSorts: () => set({ sortState: [] }),

    addQueryHistory: (projectId, testRunId) =>
      set((state) => {
        const filtered = state.queryHistory.filter(
          (h) => !(h.projectId === projectId && h.testRunId === testRunId)
        )
        return {
          queryHistory: [{ projectId, testRunId, timestamp: Date.now() }, ...filtered].slice(0, 10),
        }
      }),

    reset: () =>
      set({
        data: [],
        selectedRows: new Set<string>(),
        expandedRows: new Set<string>(),
        filters: {},
        error: null,
        loading: false,
        loadingProgress: '',
        loadingProgressCurrent: 0,
        loadingProgressTotal: 0,
        currentPage: 1,
        searchQuery: '',
      }),

    setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),

    setCurrentPage: (page) => set({ currentPage: page }),

    setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

    setColumnWidth: (key, width) =>
      set((state) => ({
        columnWidths: { ...state.columnWidths, [key]: width },
      })),

    savePreset: (name) =>
      set((state) => {
        const preset: TableViewPreset = {
          id: generateId(),
          name,
          columnOrder: state.columns.map((c) => c.key),
          columnVisibility: Object.fromEntries(state.columns.map((c) => [c.key, c.visible])),
          columnWidths: state.columnWidths,
          sortState: state.sortState,
          filters: state.filters,
          pageSize: state.pageSize,
          createdAt: Date.now(),
        }
        return {
          viewPresets: [...state.viewPresets, preset],
          activePresetId: preset.id,
        }
      }),

    applyPreset: (id) =>
      set((state) => {
        const preset = state.viewPresets.find((p) => p.id === id)
        if (!preset) return {}
        const columns = state.columns.map((col) => ({
          ...col,
          visible: preset.columnVisibility[col.key] ?? col.visible,
          width: preset.columnWidths[col.key] ?? col.width,
        }))
        const columnOrder = preset.columnOrder
        const sortedColumns = columnOrder
          .map((key) => columns.find((c) => c.key === key))
          .filter(Boolean) as ColumnConfig[]
        const remaining = columns.filter((c) => !columnOrder.includes(c.key))
        return {
          columns: [...sortedColumns, ...remaining],
          columnWidths: preset.columnWidths,
          sortState: preset.sortState,
          filters: preset.filters,
          pageSize: preset.pageSize,
          currentPage: 1,
          activePresetId: id,
        }
      }),

    deletePreset: (id) =>
      set((state) => ({
        viewPresets: state.viewPresets.filter((p) => p.id !== id),
        activePresetId: state.activePresetId === id ? null : state.activePresetId,
      })),

    reorderColumn: (fromIndex, toIndex) =>
      set((state) => {
        const newColumns = [...state.columns]
        const [moved] = newColumns.splice(fromIndex, 1)
        newColumns.splice(toIndex, 0, moved)
        return { columns: newColumns }
      }),

    updateRow: (id, updates) =>
      set((state) => {
        const nextData = state.data.map((row) => (row.id === id ? { ...row, ...updates } : row))
        const cacheKey = state.mode === 'simple' ? 'simpleCache' : 'detailedCache'
        const currentCache = state.mode === 'simple' ? state.simpleCache : state.detailedCache
        const nextCache = currentCache
          ? { ...currentCache, data: nextData }
          : { projectId: state.projectId, testRunId: state.testRunId, data: nextData }
        return {
          data: nextData,
          [cacheKey]: nextCache,
        }
      }),
  }
})

useDataTableStore.subscribe((state) => {
  persistState(state)
})
