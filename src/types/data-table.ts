export type DataTableMode = 'simple' | 'detailed'
export type DataTableDensity = 'comfortable' | 'standard' | 'compact'

export interface TestCaseItem {
  id: string
  title: string
  executed: number
  result: string
  testPriority: string
  testContent: string
  testEnvironment: string
}

export interface TestStepResult {
  comment: { type: string; content: string; contentLossy: boolean }
  result: { id: string }
}

export interface TestRecord {
  testcase_id: string
  comment: { type: string; content: string; contentLossy: boolean }
  defectURI: string | null
  duration: number
  executed: string
  executedByURI: string
  result: { id: string }
  testStepResults: { TestStepResult: TestStepResult[] }
  attachments: unknown
  iteration: number
  signed: boolean
  testCaseRevision: string
  testCaseURI: string
  testParameters: unknown
}

export interface TestRunDetail {
  id: string
  authorURI: string
  created: string
  records: TestRecord[]
}

export interface TestCaseCustomField {
  key: string
  value: unknown
}

export interface TestCaseStep {
  description: string
  expectedResult: string
}

export interface TestCaseDetail {
  id: string
  type: { id: string }
  title: string
  priority: { id: string }
  status: { id: string }
  assignee: { User: Array<{ id: string; name: string; email: string }> } | null
  author: { id: string; name: string; email: string }
  created: string
  updated: string
  customFields: { Custom: TestCaseCustomField[] } | null
  testSteps: TestCaseStep[]
}

export interface MergedTestCase extends TestCaseItem {
  projectId?: string
  testRunId?: string
  duration?: number
  executedTime?: string
  executedBy?: string
  stepResultCount?: number
  defectURI?: string | null
  record?: TestRecord
  assignee?: string
  caseStatus?: string
  automation?: string
  featureCluster?: string
  featureName?: string
  testStepCount?: number
  prerequisites?: string
  testCaseDetail?: TestCaseDetail
  fetchFailed?: boolean
  priority?: string
  createdAt?: string
  updatedAt?: string
  steps?: Array<{ result?: string; comment?: string; content?: string }>
  comments?: Array<{ author?: string; date?: string; text?: string }>
  links?: Array<{ url?: string; title?: string }>
  tags?: string[]
}

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  filterable: boolean
  filterType: 'text' | 'select' | 'numberRange' | 'dateRange'
  width?: number
  minWidth?: number
  mode: 'simple' | 'detailed'
  fixed?: 'left' | 'right' | false
}

export interface ColumnFilter {
  key: string
  type: 'text' | 'select' | 'numberRange' | 'dateRange' | 'empty' | 'notEmpty'
  value: string | string[] | { min?: number; max?: number } | { min?: string; max?: string } | boolean
}

export interface SortState {
  key: string
  direction: 'asc' | 'desc'
}

export interface TableViewPreset {
  id: string
  name: string
  columnOrder: string[]
  columnVisibility: Record<string, boolean>
  columnWidths: Record<string, number>
  sortState: SortState[]
  filters: Record<string, ColumnFilter>
  pageSize: number
  createdAt: number
}

export interface DataTable {
  id: string
  name: string
  description: string
  mode: DataTableMode
  projectId: string
  testRunId: string
  data: MergedTestCase[]
  filters: Record<string, ColumnFilter>
  columnVisibility: Record<string, boolean>
  columnWidths: Record<string, number>
  sortState: SortState[]
  pageSize: number
  createdAt: number
  updatedAt: number
}
