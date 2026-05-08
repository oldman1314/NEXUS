import type { RequestData, HttpMethod, BodyType, AuthType, KVPair, AuthConfig } from '@/types'

export function parseCurl(command: string): Partial<RequestData> | null {
  try {
    let normalized = command.trim()
    if (normalized.startsWith('curl')) {
      normalized = normalized.slice(4).trim()
    }

    let method: HttpMethod = 'GET'
    let url = ''
    const headers: KVPair[] = []
    let bodyRaw = ''
    let bodyType: BodyType = 'none'
    const formData: KVPair[] = []
    const skippedOptions: string[] = []

    const tokens = tokenize(normalized)
    let i = 0

    while (i < tokens.length) {
      const token = tokens[i]

      if (token === '-X' || token === '--request') {
        i++
        if (tokens[i]) method = tokens[i].toUpperCase() as HttpMethod
      } else if (token === '-H' || token === '--header') {
        i++
        if (tokens[i]) {
          const colonIdx = tokens[i].indexOf(':')
          if (colonIdx > 0) {
            headers.push({
              key: tokens[i].substring(0, colonIdx).trim(),
              value: tokens[i].substring(colonIdx + 1).trim(),
              enabled: true,
            })
          }
        }
      } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
        i++
        if (tokens[i]) {
          bodyRaw = tokens[i]
          bodyType = 'json'
          if (!method || method === 'GET') method = 'POST'
          const ct = headers.find(
            (h) => h.key.toLowerCase() === 'content-type'
          )
          if (!ct) {
            headers.push({
              key: 'Content-Type',
              value: 'application/json',
              enabled: true,
            })
          }
        }
      } else if (token === '--data-urlencode') {
        i++
        if (tokens[i]) {
          bodyType = 'x-www-form-urlencoded'
          if (bodyRaw) bodyRaw += '&'
          bodyRaw += tokens[i]
          if (!method || method === 'GET') method = 'POST'
        }
      } else if (token === '-F' || token === '--form') {
        i++
        if (tokens[i]) {
          const eqIdx = tokens[i].indexOf('=')
          if (eqIdx > 0) {
            const key = tokens[i].substring(0, eqIdx)
            const value = tokens[i].substring(eqIdx + 1)
            const isFile = value.startsWith('@')
            formData.push({
              key,
              value: isFile ? value.slice(1) : value,
              enabled: true,
              type: isFile ? 'file' : 'text',
              fileName: isFile ? value.slice(1) : undefined,
            })
            bodyType = 'form-data'
            if (!method || method === 'GET') method = 'POST'
          }
        }
      } else if (token === '-u' || token === '--user') {
        i++
        if (tokens[i]) {
          const colonIdx = tokens[i].indexOf(':')
          const authConfig: AuthConfig = {}
          if (colonIdx > 0) {
            authConfig.username = tokens[i].substring(0, colonIdx)
            authConfig.password = tokens[i].substring(colonIdx + 1)
          } else {
            authConfig.username = tokens[i]
          }
          return {
            method,
            url,
            headers,
            bodyRaw,
            bodyType,
            formData,
            authType: 'basic' as AuthType,
            authConfig,
          }
        }
      } else if (token === '-b' || token === '--cookie') {
        skippedOptions.push(token)
        i++
      } else if (token === '--compressed' || token === '-k' || token === '--insecure' || token === '-s' || token === '--silent' || token === '-S' || token === '--show-error' || token === '-L' || token === '--location' || token === '-v' || token === '--verbose' || token === '-o' || token === '--output' || token === '-w' || token === '--write-out') {
        skippedOptions.push(token)
        if (['-o', '--output', '-w', '--write-out'].includes(token)) i++
      } else if (!token.startsWith('-')) {
        url = token.replace(/^['"]|['"]$/g, '')
      }
      i++
    }

    const result: Partial<RequestData> = {
      method,
      url,
      headers,
      bodyRaw,
      bodyType,
      formData,
    }
    if (skippedOptions.length > 0) {
      ;(result as Record<string, unknown>)._skippedOptions = skippedOptions
    }
    return result
  } catch {
    return null
  }
}

function tokenize(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inSingleQuote = false
  let inDoubleQuote = false
  let escaped = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]

    if (escaped) {
      current += ch
      escaped = false
      continue
    }

    if (ch === '\\') {
      escaped = true
      continue
    }

    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote
      continue
    }

    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote
      continue
    }

    if (ch === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += ch
  }

  if (current) tokens.push(current)
  return tokens
}

export function generateCurl(request: RequestData): string {
  const parts: string[] = ['curl']

  if (request.method !== 'GET') {
    parts.push(`-X ${request.method}`)
  }

  const enabledHeaders = request.headers.filter((h) => h.enabled && h.key)
  for (const h of enabledHeaders) {
    parts.push(`-H '${h.key}: ${h.value}'`)
  }

  if (request.authType === 'bearer' && request.authConfig.token) {
    parts.push(`-H 'Authorization: Bearer ${request.authConfig.token}'`)
  } else if (request.authType === 'basic' && request.authConfig.username) {
    const creds = btoa(`${request.authConfig.username}:${request.authConfig.password || ''}`)
    parts.push(`-H 'Authorization: Basic ${creds}'`)
  }

  if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
    if (request.bodyType === 'form-data') {
      const enabled = request.formData.filter((f) => f.enabled && f.key)
      for (const f of enabled) {
        if (f.type === 'file' && f.fileName) {
          parts.push(`-F '${f.key}=@${f.fileName}'`)
        } else {
          parts.push(`-F '${f.key}=${f.value}'`)
        }
      }
    } else if (request.bodyRaw) {
      parts.push(`-d '${request.bodyRaw.replace(/'/g, "'\\''")}'`)
    }
  }

  let url = request.url || 'http://localhost'
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  const enabledParams = request.params.filter((p) => p.enabled && p.key)
  if (enabledParams.length > 0) {
    const qs = enabledParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
    url += (url.includes('?') ? '&' : '?') + qs
  }

  parts.push(`'${url}'`)
  parts.push('--compressed')

  return parts.join(' \\\n  ')
}
