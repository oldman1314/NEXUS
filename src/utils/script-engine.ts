import type { RequestData, ResponseData, Environment, TestResult } from '@/types'

const MAX_SCRIPT_CACHE_SIZE = 50

interface SandboxConsole {
  log: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  table: (...args: unknown[]) => void
  clear: () => void
}

interface SandboxPm {
  environment: unknown
  variables: unknown
  request?: unknown
  response?: unknown
  test?: unknown
  expect?: unknown
  console: SandboxConsole
}

type ScriptFunction = (pm: SandboxPm, console: SandboxConsole) => void

class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private readonly maxSize: number

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

const preRequestScriptCache = new LRUCache<string, ScriptFunction>(MAX_SCRIPT_CACHE_SIZE)
const testScriptCache = new LRUCache<string, ScriptFunction>(MAX_SCRIPT_CACHE_SIZE)

class AssertionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssertionError'
  }
}

function safeStringify(value: unknown): string {
  try {
    const seen = new WeakSet()
    return JSON.stringify(value, (_, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]'
        seen.add(val)
      }
      return val
    })
  } catch {
    return String(value)
  }
}

function formatArg(a: unknown): string {
  if (typeof a === 'object' && a !== null) return safeStringify(a)
  return String(a)
}

function createSandboxConsole(logs: string[]) {
  const pushLog = (prefix: string, args: unknown[]) => {
    logs.push(prefix + args.map(formatArg).join(' '))
  }
  return {
    log: (...args: unknown[]) => pushLog('', args),
    error: (...args: unknown[]) => pushLog('[ERROR] ', args),
    warn: (...args: unknown[]) => pushLog('[WARN] ', args),
    info: (...args: unknown[]) => pushLog('[INFO] ', args),
    debug: (...args: unknown[]) => pushLog('[DEBUG] ', args),
    table: (...args: unknown[]) => pushLog('[TABLE] ', args),
    clear: () => { logs.length = 0 },
  }
}

interface SandboxResult {
  pm: SandboxPm
  console: SandboxConsole
  modifiedRequest?: RequestData
  modifiedEnv: Record<string, string>
  modifiedVars: Record<string, unknown>
  testResults?: TestResult[]
}

function getOrCompileScript(script: string, cache: LRUCache<string, ScriptFunction>): ScriptFunction {
  const cached = cache.get(script)
  if (cached) return cached

  const wrappedScript = `
    "use strict";
    return (function(pm, console) {
      const {window, document, globalThis, self, top, parent, frames, opener, localStorage, sessionStorage, indexedDB, caches, speechSynthesis, webkitRequestFileSystem, webkitResolveLocalFileSystemURL, XMLHttpRequest, fetch, WebSocket, Worker, SharedWorker, importScripts, eval, Function} = {};
      ${script}
    })(pm, console)
  `
  const fn = new Function('pm', 'console', wrappedScript) as ScriptFunction
  cache.set(script, fn)
  return fn
}

export interface ScriptContext {
  request: RequestData
  environment: Record<string, string>
  variables: Record<string, unknown>
}

export interface ResponseScriptContext {
  response: ResponseData
  environment: Record<string, string>
  variables: Record<string, unknown>
}

export interface ScriptResult {
  request: RequestData
  environment: Record<string, string>
  variables: Record<string, unknown>
  consoleLogs: string[]
  error?: string
}

export interface TestScriptResult {
  environment: Record<string, string>
  variables: Record<string, unknown>
  testResults: TestResult[]
  consoleLogs: string[]
  error?: string
}

function createPreRequestSandbox(
  context: ScriptContext,
  logs: string[]
): SandboxResult {
  const env = { ...context.environment }
  const vars = { ...context.variables }
  let req = { ...context.request }

  const sandboxConsole = createSandboxConsole(logs)

  const pm = {
    environment: {
      get: (key: string) => env[key],
      set: (key: string, value: string) => {
        env[key] = value
      },
      has: (key: string) => key in env,
      unset: (key: string) => {
        delete env[key]
      },
      toObject: () => ({ ...env }),
    },
    variables: {
      get: (key: string) => vars[key],
      set: (key: string, value: unknown) => {
        vars[key] = value
      },
      has: (key: string) => key in vars,
      unset: (key: string) => {
        delete vars[key]
      },
    },
    request: {
      get url() {
        return req.url
      },
      set url(value: string) {
        req = { ...req, url: value }
      },
      get method() {
        return req.method
      },
      set method(value: string) {
        req = { ...req, method: value as RequestData['method'] }
      },
      get headers() {
        return req.headers
      },
      set headers(value: RequestData['headers']) {
        req = { ...req, headers: value }
      },
      get body() {
        return req.bodyRaw
      },
      set body(value: string) {
        if (typeof value !== 'string') {
          throw new AssertionError('pm.request.body must be a string. Use JSON.stringify() for objects.')
        }
        req = { ...req, bodyRaw: value }
      },
      addHeader: (key: string, value: string) => {
        req = {
          ...req,
          headers: [...req.headers, { key, value, enabled: true }],
        }
      },
      removeHeader: (key: string) => {
        const firstIndex = req.headers.findIndex((h) => h.key === key)
        if (firstIndex !== -1) {
          const newHeaders = [...req.headers]
          newHeaders.splice(firstIndex, 1)
          req = { ...req, headers: newHeaders }
        }
      },
    },
    console: sandboxConsole,
  }

  return {
    pm,
    console: sandboxConsole,
    get modifiedRequest() {
      return req
    },
    modifiedEnv: env,
    modifiedVars: vars,
  }
}

function envVarsToRecord(env: Environment | null): Record<string, string> {
  if (!env) return {}
  const record: Record<string, string> = {}
  env.variables.forEach((v) => {
    if (v.key) record[v.key] = v.value
  })
  return record
}

export function executePreRequestScript(
  script: string,
  request: RequestData,
  environment: Environment | null
): ScriptResult {
  const logs: string[] = []
  const context: ScriptContext = {
    request,
    environment: envVarsToRecord(environment),
    variables: {},
  }

  if (!script.trim()) {
    return {
      request,
      environment: context.environment,
      variables: {},
      consoleLogs: logs,
    }
  }

  try {
    const sandbox = createPreRequestSandbox(context, logs)
    const fn = getOrCompileScript(script, preRequestScriptCache)
    fn(sandbox.pm as SandboxPm, sandbox.console as SandboxConsole)

    return {
      request: sandbox.modifiedRequest!,
      environment: sandbox.modifiedEnv,
      variables: sandbox.modifiedVars,
      consoleLogs: logs,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    logs.push(`[SCRIPT ERROR] ${errorMsg}`)
    return {
      request,
      environment: context.environment,
      variables: {},
      consoleLogs: logs,
      error: errorMsg,
    }
  }
}

function createTestSandbox(
  context: ResponseScriptContext,
  logs: string[]
): SandboxResult {
  const env = { ...context.environment }
  const vars = { ...context.variables }
  const results: TestResult[] = []
  const resp = context.response

  const sandboxConsole = createSandboxConsole(logs)

  const chaiLikeAssert = {
    equal: (actual: unknown, expected: unknown, message?: string) => {
      const passed = actual === expected
      if (!passed) {
        throw new AssertionError(
          message || `expected ${safeStringify(expected)}, got ${safeStringify(actual)}`
        )
      }
    },
    notEqual: (actual: unknown, expected: unknown, message?: string) => {
      const passed = actual !== expected
      if (!passed) {
        throw new AssertionError(
          message || `expected values to be different, both were ${safeStringify(actual)}`
        )
      }
    },
    deepEqual: (actual: unknown, expected: unknown, message?: string) => {
      const passed = safeStringify(actual) === safeStringify(expected)
      if (!passed) {
        throw new AssertionError(
          message || `expected deep equal to ${safeStringify(expected)}, got ${safeStringify(actual)}`
        )
      }
    },
    include: (actual: unknown, expected: unknown, message?: string) => {
      let passed = false
      if (typeof actual === 'string') {
        passed = actual.includes(String(expected))
      } else if (Array.isArray(actual)) {
        passed = actual.some((item) => safeStringify(item) === safeStringify(expected))
      } else if (actual && typeof actual === 'object' && expected !== null && expected !== undefined && typeof expected === 'object') {
        const actualObj = actual as Record<string, unknown>
        const expectedObj = expected as Record<string, unknown>
        passed = Object.keys(expectedObj).every(
          (key) => key in actualObj && safeStringify(actualObj[key]) === safeStringify(expectedObj[key])
        )
      } else if (actual && typeof actual === 'object' && (typeof expected === 'string' || typeof expected === 'number' || typeof expected === 'boolean')) {
        const actualObj = actual as Record<string, unknown>
        passed = Object.values(actualObj).some((v) => String(v).includes(String(expected)))
      }
      if (!passed) {
        throw new AssertionError(
          message || `expected ${safeStringify(actual)} to include ${safeStringify(expected)}`
        )
      }
    },
    match: (actual: unknown, expected: RegExp | string, message?: string) => {
      const regex = typeof expected === 'string' ? new RegExp(expected) : expected
      const passed = regex.test(String(actual))
      if (!passed) {
        throw new AssertionError(
          message || `expected ${safeStringify(actual)} to match ${regex.source}`
        )
      }
    },
    isTrue: (actual: unknown, message?: string) => {
      if (actual !== true) {
        throw new AssertionError(
          message || `expected true, got ${safeStringify(actual)}`
        )
      }
    },
    isFalse: (actual: unknown, message?: string) => {
      if (actual !== false) {
        throw new AssertionError(
          message || `expected false, got ${safeStringify(actual)}`
        )
      }
    },
    isAbove: (actual: unknown, expected: number, message?: string) => {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new AssertionError(
          message || `expected a value above ${expected}, got ${safeStringify(actual)}`
        )
      }
    },
    isBelow: (actual: unknown, expected: number, message?: string) => {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new AssertionError(
          message || `expected a value below ${expected}, got ${safeStringify(actual)}`
        )
      }
    },
    exist: (actual: unknown, message?: string) => {
      if (actual === undefined || actual === null) {
        throw new AssertionError(
          message || `expected value to exist, got ${safeStringify(actual)}`
        )
      }
    },
    typeOf: (actual: unknown, expectedType: string, message?: string) => {
      const actualType = actual === null ? 'null' : Array.isArray(actual) ? 'array' : typeof actual
      if (actualType !== expectedType) {
        throw new AssertionError(
          message || `expected type '${expectedType}', got '${actualType}'`
        )
      }
    },
    property: (actual: unknown, propName: string, message?: string) => {
      if (!actual || typeof actual !== 'object') {
        throw new AssertionError(
          message || `expected object to have property '${propName}', but value is not an object`
        )
      }
      if (!(propName in (actual as Record<string, unknown>))) {
        throw new AssertionError(
          message || `expected object to have property '${propName}'`
        )
      }
    },
    hasLength: (actual: unknown, expectedLength: number, message?: string) => {
      const actualLength = (actual as { length?: number })?.length
      if (typeof actualLength !== 'number' || actualLength !== expectedLength) {
        throw new AssertionError(
          message || `expected length ${expectedLength}, got ${actualLength}`
        )
      }
    },
  }

  const pm = {
    environment: {
      get: (key: string) => env[key],
      set: (key: string, value: string) => {
        env[key] = value
      },
      has: (key: string) => key in env,
      unset: (key: string) => {
        delete env[key]
      },
      toObject: () => ({ ...env }),
    },
    variables: {
      get: (key: string) => vars[key],
      set: (key: string, value: unknown) => {
        vars[key] = value
      },
      has: (key: string) => key in vars,
      unset: (key: string) => {
        delete vars[key]
      },
    },
    response: {
      get status() {
        return resp.status
      },
      get statusText() {
        return resp.statusText
      },
      get headers() {
        return resp.headers
      },
      get body() {
        return resp.body
      },
      get duration() {
        return resp.duration
      },
      get size() {
        return resp.size
      },
      json: () => {
        if (typeof resp.body === 'object') return resp.body
        try {
          return JSON.parse(resp.body as string)
        } catch {
          return null
        }
      },
      text: () => {
        return typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body)
      },
    },
    test: (name: string, fn: () => void) => {
      try {
        fn()
        results.push({ name, passed: true })
      } catch (error) {
        results.push({
          name,
          passed: false,
          error: error instanceof Error ? error.message : 'Test failed',
        })
      }
    },
    expect: chaiLikeAssert,
    console: sandboxConsole,
  }

  return {
    pm,
    console: sandboxConsole,
    modifiedEnv: env,
    modifiedVars: vars,
    get testResults() {
      return results
    },
  }
}

export function executeTestScript(
  script: string,
  response: ResponseData,
  environment: Environment | null,
  variables: Record<string, unknown> = {}
): TestScriptResult {
  const logs: string[] = []
  const context: ResponseScriptContext = {
    response,
    environment: envVarsToRecord(environment),
    variables: { ...variables },
  }

  if (!script.trim()) {
    return {
      environment: context.environment,
      variables: context.variables,
      testResults: [],
      consoleLogs: logs,
    }
  }

  try {
    const sandbox = createTestSandbox(context, logs)
    const fn = getOrCompileScript(script, testScriptCache)
    fn(sandbox.pm, sandbox.console)

    return {
      environment: sandbox.modifiedEnv,
      variables: sandbox.modifiedVars,
      testResults: sandbox.testResults!,
      consoleLogs: logs,
    }
  } catch (error) {
    logs.push(`[SCRIPT ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      environment: context.environment,
      variables: context.variables,
      testResults: [
        {
          name: 'Script execution',
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      consoleLogs: logs,
    }
  }
}
