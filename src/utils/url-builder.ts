import type { KVPair, AuthConfig, Environment } from '@/types'

const regexCache = new Map<string, RegExp>()

function getEnvPattern(key: string): RegExp {
  let regex = regexCache.get(key)
  if (!regex) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    regex = new RegExp(`{{\\s*${escaped}\\s*}}`, 'g')
    regexCache.set(key, regex)
  }
  return regex
}

export function applyEnvVars(str: string, env: Environment | null, variables?: Record<string, unknown>, depth: number = 0): string {
  if ((!env && !variables) || depth > 5 || !str) return str
  let result = str
  let changed = true
  let currentDepth = 0

  while (changed && currentDepth < 5) {
    changed = false
    currentDepth++
    if (env) {
      if (env.baseUrl && env.baseUrlEnabled !== false) {
        const pattern = getEnvPattern('base_url')
        pattern.lastIndex = 0
        if (pattern.test(result)) {
          pattern.lastIndex = 0
          result = result.replace(pattern, env.baseUrl)
          changed = true
        }
      }
      for (const v of env.variables) {
        if (!v.key) continue
        const pattern = getEnvPattern(v.key)
        pattern.lastIndex = 0
        if (pattern.test(result)) {
          pattern.lastIndex = 0
          result = result.replace(pattern, v.value)
          changed = true
        }
      }
    }
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        if (!key) continue
        const pattern = getEnvPattern(key)
        pattern.lastIndex = 0
        if (pattern.test(result)) {
          pattern.lastIndex = 0
          result = result.replace(pattern, String(value))
          changed = true
        }
      }
    }
  }
  return result
}

export function buildUrl(
  url: string,
  params: KVPair[],
  environment: Environment | null,
  variables?: Record<string, unknown>
): string {
  let resolvedUrl = applyEnvVars(url, environment, variables)
  if (!resolvedUrl) return resolvedUrl

  if (!/^https?:\/\//i.test(resolvedUrl)) {
    const hadBaseUrlPlaceholder = /\{\{\s*base_url\s*\}\}/i.test(url)
    if (environment?.baseUrl && environment.baseUrlEnabled !== false && !hadBaseUrlPlaceholder) {
      const base = environment.baseUrl.replace(/\/$/, '')
      const path = resolvedUrl.startsWith('/') ? resolvedUrl : '/' + resolvedUrl
      resolvedUrl = base + path
    } else {
      resolvedUrl = 'https://' + resolvedUrl
    }
  }

  const searchParams = new URLSearchParams()
  params
    .filter((p) => p.enabled && p.key)
    .forEach((p) => {
      searchParams.append(
        applyEnvVars(p.key, environment, variables),
        applyEnvVars(p.value, environment, variables)
      )
    })

  if (searchParams.toString()) {
    const separator = resolvedUrl.includes('?') ? '&' : '?'
    resolvedUrl = `${resolvedUrl}${separator}${searchParams.toString()}`
  }

  return resolvedUrl
}

export function buildHeaders(
  headers: KVPair[],
  environment: Environment | null,
  variables?: Record<string, unknown>
): Record<string, string> {
  const result: Record<string, string> = {}
  headers
    .filter((h) => h.enabled && h.key)
    .forEach((h) => {
      result[applyEnvVars(h.key, environment, variables)] = applyEnvVars(h.value, environment, variables)
    })
  return result
}

export function applyAuthHeaders(
  headers: Record<string, string>,
  authType: string,
  authConfig: AuthConfig,
  environment: Environment | null,
  url?: string,
  variables?: Record<string, unknown>
): { headers: Record<string, string>; url?: string } {
  const result = { ...headers }
  let resultUrl = url

  if (authType === 'bearer' && authConfig.token) {
    result['Authorization'] = `Bearer ${applyEnvVars(authConfig.token, environment, variables)}`
  } else if (authType === 'basic' && authConfig.username) {
    const creds = btoa(
      `${applyEnvVars(authConfig.username, environment, variables)}:${applyEnvVars(authConfig.password || '', environment, variables)}`
    )
    result['Authorization'] = `Basic ${creds}`
  } else if (
    authType === 'apikey' &&
    authConfig.apiKey &&
    authConfig.apiValue
  ) {
    if (authConfig.apiIn === 'query' && resultUrl) {
      const separator = resultUrl.includes('?') ? '&' : '?'
      resultUrl = `${resultUrl}${separator}${applyEnvVars(authConfig.apiKey, environment, variables)}=${applyEnvVars(authConfig.apiValue, environment, variables)}`
    } else {
      result[applyEnvVars(authConfig.apiKey, environment, variables)] = applyEnvVars(
        authConfig.apiValue,
        environment,
        variables
      )
    }
  }

  return { headers: result, url: resultUrl }
}
