import type { TestCaseItem, TestRunDetail, TestCaseDetail } from '@/types/data-table'
import DOMPurify from 'dompurify'
import caseListMock from '@/components/data-table/mock/api.mock.1000.json'
import testRunMock from '@/components/data-table/mock/api2.mock.1000.json'
import testCaseDetailMock from '@/components/data-table/mock/api3.mock.1000.json'

const BASE_URL = 'https://testengine.zytintra.com/polarionv2'
const DEFAULT_TIMEOUT = 30000
const MAX_RETRIES = 2
const MOCK_PROJECT_ID = 'test'
const MOCK_TEST_RUN_ID = 'test'
const mockDetailData = (() => {
  const response = testCaseDetailMock as ApiResponse<TestCaseDetail[] | TestCaseDetail>
  if (!response?.data) return new Map<string, TestCaseDetail>()
  if (Array.isArray(response.data)) {
    return new Map(response.data.map((item) => [item.id, item]))
  }
  return new Map([[response.data.id, response.data]])
})()

interface ApiResponse<T> {
  code: number
  data: T
  msg?: string
  success?: boolean
}

function isMockRequest(projectId: string, testRunId?: string): boolean {
  const p = projectId.trim().toLowerCase()
  const t = testRunId?.trim().toLowerCase()
  if (testRunId !== undefined) {
    return p === MOCK_PROJECT_ID && t === MOCK_TEST_RUN_ID
  }
  return p === MOCK_PROJECT_ID
}

function classifyError(err: unknown): Error {
  if (err instanceof Error) {
    if (err.name === 'AbortError') return err
    const msg = err.message.toLowerCase()
    if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return new Error('网络连接已断开，请检查网络后重试')
      }
      return new Error('跨域请求被拒绝或网络不可达，请检查网络或联系管理员')
    }
    if (msg.includes('fetch')) {
      return new Error('网络请求失败，请检查网络连接')
    }
  }
  return err instanceof Error ? err : new Error('未知错误')
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { signal?: AbortSignal },
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  let onAbort: (() => void) | null = null
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId)
      throw new DOMException('The operation was aborted.', 'AbortError')
    }
    onAbort = () => controller.abort()
    options.signal.addEventListener('abort', onAbort)
  }

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
    if (onAbort && options.signal) {
      options.signal.removeEventListener('abort', onAbort)
    }
  }
}

async function parseJsonResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return await response.json()
  } catch {
    throw new Error(`服务器返回了非 JSON 格式的响应 (HTTP ${response.status})`)
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit & { signal?: AbortSignal },
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options)
      return response
    } catch (err) {
      lastError = err as Error
      if ((err as Error).name === 'AbortError') throw err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500))
      }
    }
  }
  throw lastError
}

export async function fetchCaseList(
  projectId: string,
  testRunId: string,
  signal?: AbortSignal
): Promise<TestCaseItem[]> {
  if (isMockRequest(projectId, testRunId)) {
    const response = caseListMock as ApiResponse<TestCaseItem[]>
    if (response.code !== 200 || !Array.isArray(response.data)) {
      throw new Error('Mock caselist 数据格式错误')
    }
    return response.data
  }

  const url = `${BASE_URL}/testrun/caselist?projectId=${encodeURIComponent(projectId)}&testRunId=${encodeURIComponent(testRunId)}`
  try {
    const response = await fetchWithRetry(url, { signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const json = await parseJsonResponse<TestCaseItem[]>(response)
    if (json.code !== 200) {
      throw new Error(json.msg || `API 错误: code ${json.code}`)
    }
    return json.data
  } catch (err) {
    throw classifyError(err)
  }
}

export async function fetchTestRunDetail(
  projectId: string,
  testRunId: string,
  signal?: AbortSignal
): Promise<TestRunDetail> {
  if (isMockRequest(projectId, testRunId)) {
    const response = testRunMock as ApiResponse<TestRunDetail>
    if (response.code !== 200 || !response.data?.records) {
      throw new Error('Mock testrun detail 数据格式错误')
    }
    return response.data
  }

  const url = `${BASE_URL}/testrun/projectId/${encodeURIComponent(projectId)}/testRunId/${encodeURIComponent(testRunId)}`
  try {
    const response = await fetchWithRetry(url, { signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const json = await parseJsonResponse<TestRunDetail>(response)
    if (json.code !== 200) {
      throw new Error(json.msg || `API 错误: code ${json.code}`)
    }
    return json.data
  } catch (err) {
    throw classifyError(err)
  }
}

export async function fetchTestCaseDetail(
  projectId: string,
  caseId: string,
  testRunId?: string,
  signal?: AbortSignal
): Promise<TestCaseDetail> {
  if (isMockRequest(projectId, testRunId)) {
    const response = testCaseDetailMock as ApiResponse<TestCaseDetail[] | TestCaseDetail>
    if (response.code !== 200 || mockDetailData.size === 0) {
      throw new Error('Mock testcase detail 数据格式错误')
    }
    const detail = mockDetailData.get(caseId)
    if (!detail) {
      throw new Error(`Mock testcase detail 未找到 caseId=${caseId}`)
    }
    return detail
  }

  const url = `${BASE_URL}/testcase/projectId/${encodeURIComponent(projectId)}/caseId/${encodeURIComponent(caseId)}`
  const response = await fetchWithRetry(url, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  const json = await parseJsonResponse<TestCaseDetail>(response)
  if (json.code !== 200) {
    throw new Error(json.msg || `API 错误: code ${json.code}`)
  }
  return json.data
}

export interface BatchFetchResult {
  details: Map<string, TestCaseDetail>
  failedCaseIds: string[]
}

export async function fetchTestCaseDetails(
  projectId: string,
  testRunId: string,
  caseIds: string[],
  signal?: AbortSignal,
  concurrency: number = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchFetchResult> {
  const details = new Map<string, TestCaseDetail>()
  const failedCaseIds: string[] = []
  let completed = 0

  for (let i = 0; i < caseIds.length; i += concurrency) {
    if (signal?.aborted) break

    const batch = caseIds.slice(i, i + concurrency)
    const promises = batch.map(async (caseId) => {
      try {
        const detail = await fetchTestCaseDetail(projectId, caseId, testRunId, signal)
        return { caseId, detail, error: null as Error | null }
      } catch (err) {
        if ((err as Error).name === 'AbortError') throw err
        return { caseId, detail: null as TestCaseDetail | null, error: err as Error }
      }
    })

    const results = await Promise.all(promises)
    for (const r of results) {
      completed++
      if (r.detail) {
        details.set(r.caseId, r.detail)
      } else if (r.error) {
        failedCaseIds.push(r.caseId)
      }
    }

    onProgress?.(completed, caseIds.length)
  }

  if (details.size === 0 && failedCaseIds.length > 0) {
    throw new Error(`所有用例详情获取失败 (${failedCaseIds.length} 条)，请检查网络连接`)
  }

  return { details, failedCaseIds }
}

function extractCustomField(
  customFields: { Custom: Array<{ key: string; value: unknown }> } | null | undefined,
  key: string
): unknown {
  if (!customFields?.Custom) return undefined
  const field = customFields.Custom.find((f) => f.key === key)
  return field?.value
}

export function extractCustomFieldId(
  customFields: { Custom: Array<{ key: string; value: unknown }> } | null | undefined,
  key: string
): string | undefined {
  const value = extractCustomField(customFields, key)
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string }).id
  }
  if (typeof value === 'string') return value
  return undefined
}

export function extractCustomFieldName(
  customFields: { Custom: Array<{ key: string; value: unknown }> } | null | undefined,
  key: string
): string | undefined {
  const value = extractCustomField(customFields, key)
  if (value && typeof value === 'object' && 'name' in value) {
    return (value as { name: string }).name
  }
  if (typeof value === 'string') return value
  return undefined
}

export function extractAssigneeNames(detail: TestCaseDetail): string {
  if (!detail.assignee?.User?.length) return ''
  return detail.assignee.User.map((u) => u.name || u.id).join(', ')
}

export function extractPrerequisites(detail: TestCaseDetail): string {
  const value = extractCustomField(detail.customFields, 'prerequistes')
  if (value && typeof value === 'object' && 'content' in value) {
    return (value as { content: string }).content
  }
  if (typeof value === 'string') return value
  return ''
}

export function extractUserNameFromURI(uri: string): string {
  if (!uri) return ''
  const lastSegment = uri.split('/').pop() || ''
  return lastSegment
    .replace(/\$\{User\}/g, '')
    .replace(/\$\{.*?\}/g, '')
    .trim()
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'blockquote', 'hr', 'img', 'sub', 'sup'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id', 'colspan', 'rowspan', 'style'],
    ALLOW_DATA_ATTR: false,
  })
}
