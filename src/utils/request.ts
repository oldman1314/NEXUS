import type { RequestData, ResponseData, Environment, RequestErrorType } from '@/types'
import { executePreRequestScript, executeTestScript } from './script-engine'
import { applyEnvVars, buildUrl, buildHeaders, applyAuthHeaders } from './url-builder'

export interface SendRequestOptions {
  timeout?: number
  signal?: AbortSignal
}

export interface SendRequestResult {
  response: ResponseData
  scriptEnvChanges: Record<string, string>
  scriptEnvDeletions: string[]
  preRequestLogs: string[]
  testLogs: string[]
}

function classifyError(error: unknown, isTimeout: boolean, timeout: number): { errorType: RequestErrorType; errorMessage: string } {
  if (isTimeout) {
    return { errorType: 'timeout', errorMessage: `Request timed out after ${timeout}ms` }
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return { errorType: 'abort', errorMessage: 'Request was cancelled' }
  }

  if (error instanceof TypeError) {
    const msg = error.message || 'Network error'
    if (msg.toLowerCase().includes('cors') || msg.includes('NetworkError')) {
      return { errorType: 'cors', errorMessage: msg }
    }
    return { errorType: 'network', errorMessage: msg }
  }

  if (error instanceof Error) {
    const msg = error.message
    if (msg.toLowerCase().includes('cors') || msg.includes('NetworkError')) {
      return { errorType: 'cors', errorMessage: msg }
    }
    return { errorType: 'unknown', errorMessage: msg }
  }

  return { errorType: 'unknown', errorMessage: 'Unknown error' }
}

function computeEnvChanges(
  original: Record<string, string>,
  modified: Record<string, string>
): { changes: Record<string, string>; deletions: string[] } {
  const changes: Record<string, string> = {}
  const deletions: string[] = []

  for (const key of Object.keys(original)) {
    if (!(key in modified)) {
      deletions.push(key)
    }
  }

  for (const [key, value] of Object.entries(modified)) {
    if (original[key] !== value) {
      changes[key] = value
    }
  }

  return { changes, deletions }
}

export async function sendRequest(
  request: RequestData,
  environment: Environment | null,
  options?: SendRequestOptions
): Promise<SendRequestResult> {
  const startTime = performance.now()
  const timeout = options?.timeout ?? 30000

  if (options?.signal?.aborted) {
    return {
      response: {
        status: 0,
        statusText: 'Cancelled',
        headers: {},
        body: 'Request was cancelled before execution',
        duration: 0,
        size: 0,
        ok: false,
        error: 'Request was cancelled before execution',
        errorType: 'abort',
      },
      scriptEnvChanges: {},
      scriptEnvDeletions: [],
      preRequestLogs: [],
      testLogs: [],
    }
  }

  const scriptResult = executePreRequestScript(request.preRequestScript, request, environment)
  const modifiedRequest = scriptResult.request

  const controller = new AbortController()
  let timeoutId = setTimeout(() => controller.abort(), timeout)
  let isTimeout = false

  const onExternalAbort = () => {
    clearTimeout(timeoutId)
    controller.abort()
  }
  options?.signal?.addEventListener('abort', onExternalAbort)

  try {
    let url = buildUrl(modifiedRequest.url, modifiedRequest.params, environment, scriptResult.variables)
    if (!url || !url.trim()) throw new Error('URL is empty')
    
    try {
      new URL(url.startsWith('http') ? url : `http://${url}`)
    } catch {
      throw new Error('Invalid URL format. Please enter a valid URL.')
    }

    let headers = buildHeaders(modifiedRequest.headers, environment, scriptResult.variables)
    const authResult = applyAuthHeaders(headers, modifiedRequest.authType, modifiedRequest.authConfig, environment, url, scriptResult.variables)
    headers = authResult.headers
    url = authResult.url ?? url

    const fetchOptions: RequestInit = {
      method: modifiedRequest.method,
      headers,
      signal: controller.signal,
    }

    if (['POST', 'PUT', 'PATCH'].includes(modifiedRequest.method) && modifiedRequest.bodyType !== 'none') {
      if (modifiedRequest.bodyType === 'json') {
        fetchOptions.body = applyEnvVars(modifiedRequest.bodyRaw, environment, scriptResult.variables)
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
      } else if (modifiedRequest.bodyType === 'text') {
        fetchOptions.body = applyEnvVars(modifiedRequest.bodyRaw, environment, scriptResult.variables)
        if (!headers['Content-Type']) headers['Content-Type'] = 'text/plain'
      } else if (modifiedRequest.bodyType === 'x-www-form-urlencoded') {
        const urlEncodedBody = new URLSearchParams()
        modifiedRequest.urlEncodedData
          .filter((f) => f.enabled && f.key)
          .forEach((f) => {
            urlEncodedBody.append(
              applyEnvVars(f.key, environment, scriptResult.variables),
              applyEnvVars(f.value, environment, scriptResult.variables)
            )
          })
        fetchOptions.body = urlEncodedBody.toString()
        if (!headers['Content-Type'])
          headers['Content-Type'] = 'application/x-www-form-urlencoded'
      } else if (modifiedRequest.bodyType === 'form-data') {
        const formData = new FormData()
        modifiedRequest.formData
          .filter((f) => f.enabled && f.key)
          .forEach((f) => {
            if (f.type === 'file' && f.fileName) {
              const fileInput = document.querySelector(`input[type="file"][id^="file-"]`)
              if (fileInput instanceof HTMLInputElement && fileInput.files?.[0]) {
                formData.append(
                  applyEnvVars(f.key, environment, scriptResult.variables),
                  fileInput.files[0],
                  f.fileName
                )
              } else {
                formData.append(
                  applyEnvVars(f.key, environment, scriptResult.variables),
                  new Blob(['']),
                  f.fileName
                )
              }
            } else {
              formData.append(
                applyEnvVars(f.key, environment, scriptResult.variables),
                applyEnvVars(f.value, environment, scriptResult.variables)
              )
            }
          })
        fetchOptions.body = formData
      }
    }

    const response = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)

    const duration = Math.round(performance.now() - startTime)

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const contentType = response.headers.get('content-type') || ''
    let body: string | object

    const responseText = await response.text()

    const MAX_RESPONSE_SIZE = 50 * 1024 * 1024
    if (responseText.length > MAX_RESPONSE_SIZE) {
      const truncated = responseText.slice(0, MAX_RESPONSE_SIZE)
      return {
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: truncated + '\n\n[Response truncated: exceeds 50MB limit]',
          duration: Math.round(performance.now() - startTime),
          size: responseText.length,
          ok: response.ok,
        },
        scriptEnvChanges: {},
        scriptEnvDeletions: [],
        preRequestLogs: scriptResult.consoleLogs,
        testLogs: [],
      }
    }

    let parseError = false
    if (contentType.includes('application/json')) {
      try {
        body = JSON.parse(responseText)
      } catch {
        parseError = true
        body = responseText
      }
    } else {
      body = responseText
    }

    const size = responseText.length

    const responseData: ResponseData = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      duration,
      size,
      ok: response.ok,
      ...(parseError ? { error: 'Response body parsing failed', errorType: 'parse' as RequestErrorType } : {}),
    }

    const testResult = executeTestScript(request.testScript, responseData, environment, scriptResult.variables)
    responseData.testResults = testResult.testResults
    responseData.consoleLogs = [...scriptResult.consoleLogs, ...testResult.consoleLogs]

    const originalEnv = scriptResult.environment
    const mergedEnv = { ...scriptResult.environment, ...testResult.environment }
    const { changes, deletions } = computeEnvChanges(originalEnv, mergedEnv)

    return {
      response: responseData,
      scriptEnvChanges: changes,
      scriptEnvDeletions: deletions,
      preRequestLogs: scriptResult.consoleLogs,
      testLogs: testResult.consoleLogs,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    isTimeout = !options?.signal?.aborted && controller.signal.aborted

    const duration = Math.round(performance.now() - startTime)
    const { errorType, errorMessage } = classifyError(error, isTimeout, timeout)

    const errorResponse: ResponseData = {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: errorMessage,
      duration,
      size: 0,
      ok: false,
      error: errorMessage,
      errorType,
    }

    const testResult = executeTestScript(request.testScript, errorResponse, environment, scriptResult.variables)
    errorResponse.testResults = testResult.testResults
    errorResponse.consoleLogs = [...scriptResult.consoleLogs, ...testResult.consoleLogs]

    const originalEnv = scriptResult.environment
    const mergedEnv = { ...scriptResult.environment, ...testResult.environment }
    const { changes, deletions } = computeEnvChanges(originalEnv, mergedEnv)

    return {
      response: errorResponse,
      scriptEnvChanges: changes,
      scriptEnvDeletions: deletions,
      preRequestLogs: scriptResult.consoleLogs,
      testLogs: testResult.consoleLogs,
    }
  } finally {
    options?.signal?.removeEventListener('abort', onExternalAbort)
  }
}
