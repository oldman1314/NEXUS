export interface Column {
  key: string
  title: string
  type?: 'string' | 'number' | 'date' | 'boolean'
  sortable?: boolean
  filterable?: boolean
  resizable?: boolean
  width?: number
}

export interface DataTableRow {
  id: string
  [key: string]: unknown
  title?: string
  projectId?: string
  testRunId?: string
  result?: string
  executed?: number | boolean
  duration?: number
  createdAt?: string | Date
  updatedAt?: string | Date
  assignee?: string
  priority?: string
  testPriority?: string
  testContent?: string
  testEnvironment?: string
  caseStatus?: string
  automation?: string
  featureCluster?: string
  featureName?: string
  executedTime?: string
  executedBy?: string
  stepResultCount?: number
  testStepCount?: number
  defectURI?: string | null
  prerequisites?: string
  fetchFailed?: boolean
  entering?: boolean
  steps?: Array<{ result?: string; comment?: string; content?: string }>
  comments?: Array<{ author?: string; date?: string; text?: string }>
  links?: Array<{ url?: string; title?: string }>
  tags?: string[]
  record?: unknown
  testCaseDetail?: unknown
}

export type QueryMode = 'simple' | 'detailed'

export interface QueryHistoryItem {
  projectId: string
  testRunId?: string
  timestamp: number
}

export type Density = 'comfortable' | 'standard' | 'compact'

export interface SortStateItem {
  key: string
  direction: 'asc' | 'desc'
}

export type SortState = SortStateItem[]

export type FilterState = Record<string, string | string[] | null>
