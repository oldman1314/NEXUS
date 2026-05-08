import type { RequestData, HttpMethod, KVPair, BodyType } from '@/types'

export type ImportFormat = 'yapi' | 'swagger' | 'openapi' | 'postman'

export interface ImportResult {
  requests: RequestData[]
  collectionName?: string
}

export interface ImportAdapter {
  name: string
  detect: (data: unknown) => boolean
  parse: (data: unknown, baseUrl?: string) => ImportResult
}

function generateId(prefix: string, rawId: string | number): string {
  return `${prefix}-${rawId}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeMethod(method: string): HttpMethod {
  const m = method.toUpperCase()
  const valid: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
  return valid.includes(m as HttpMethod) ? (m as HttpMethod) : 'GET'
}

function buildUrl(base: string, path: string): string {
  if (!base) return path
  return `${base.replace(/\/$/, '')}${path}`
}

function mapHeaders(headers: Array<Record<string, unknown>>): KVPair[] {
  return headers.map((h) => ({
    key: String(h.name ?? ''),
    value: String(h.value ?? ''),
    description: String(h.desc ?? h.description ?? ''),
    enabled: h.required === '1' || h.required === true,
  }))
}

function mapQueries(queries: Array<Record<string, unknown>>): KVPair[] {
  return queries.map((q) => ({
    key: String(q.name ?? ''),
    value: String(q.example ?? q.default ?? ''),
    description: String(q.desc ?? q.description ?? ''),
    enabled: q.required === '1' || q.required === true,
  }))
}

function mapFormData(fields: Array<Record<string, unknown>>): KVPair[] {
  return fields.map((f) => ({
    key: String(f.name ?? ''),
    value: '',
    description: String(f.desc ?? f.description ?? ''),
    enabled: f.required === '1' || f.required === true,
  }))
}

function extractBody(
  bodyType?: string,
  bodyOther?: string,
  bodyForm?: Array<Record<string, unknown>>,
  bodyMode?: string,
  bodyRaw?: string,
  bodyUrlencoded?: Array<Record<string, unknown>>,
  bodyFormdata?: Array<Record<string, unknown>>
): { bodyType: BodyType; bodyRaw: string; formData: KVPair[] } {
  if (bodyMode) {
    if (bodyMode === 'raw') return { bodyType: 'text', bodyRaw: bodyRaw || '', formData: [] }
    if (bodyMode === 'json') return { bodyType: 'json', bodyRaw: bodyRaw || '', formData: [] }
    if (bodyMode === 'formdata') return { bodyType: 'form-data', bodyRaw: '', formData: mapFormData(bodyFormdata || []) }
    if (bodyMode === 'urlencoded') return { bodyType: 'x-www-form-urlencoded', bodyRaw: '', formData: mapFormData(bodyUrlencoded || []) }
    return { bodyType: 'none', bodyRaw: '', formData: [] }
  }

  if (bodyType === 'json') return { bodyType: 'json', bodyRaw: bodyOther || '', formData: [] }
  if (bodyType === 'form') return { bodyType: 'form-data', bodyRaw: '', formData: mapFormData(bodyForm || []) }
  if (bodyType === 'raw') return { bodyType: 'text', bodyRaw: bodyOther || '', formData: [] }
  return { bodyType: 'none', bodyRaw: '', formData: [] }
}

function createBaseRequest(): Omit<RequestData, 'id' | 'name' | 'method' | 'url' | 'params' | 'headers' | 'bodyType' | 'bodyRaw' | 'formData'> {
  return {
    authType: 'none',
    authConfig: {},
    preRequestScript: '',
    testScript: '',
    savedResponses: [],
    urlEncodedData: [],
  }
}

const yapiAdapter: ImportAdapter = {
  name: 'YApi',
  detect: (data) => {
    if (typeof data !== 'object' || data === null) return false
    const d = data as Record<string, unknown>
    return Array.isArray(d.list) && (d.list.length === 0 || typeof (d.list[0] as Record<string, unknown>)._id !== 'undefined')
  },
  parse: (data, baseUrl = '') => {
    const d = data as Record<string, unknown>
    const list = d.list as Array<Record<string, unknown>>
    const requests: RequestData[] = list.map((item) => {
      const method = normalizeMethod(String(item.method ?? 'GET'))
      const headers = mapHeaders((item.req_headers as Array<Record<string, unknown>>) || [])
      const params = mapQueries((item.req_query as Array<Record<string, unknown>>) || [])
      const { bodyType, bodyRaw, formData } = extractBody(
        item.req_body_type as string,
        item.req_body_other as string,
        item.req_body_form as Array<Record<string, unknown>>
      )
      const url = buildUrl(baseUrl, String(item.path ?? ''))
      return {
        id: generateId('yapi', Number(item._id)),
        name: String(item.title ?? item.path ?? 'Untitled'),
        method,
        url,
        params,
        headers,
        bodyType,
        bodyRaw,
        formData,
        ...createBaseRequest(),
      }
    })
    return { requests }
  },
}

function extractSwaggerRequests(
  paths: Record<string, unknown>,
  baseUrl: string,
  prefix: string
): RequestData[] {
  const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options'])
  const requests: RequestData[] = []
  for (const [path, pathItem] of Object.entries(paths)) {
    if (typeof pathItem !== 'object' || pathItem === null) continue
    for (const [method, operation] of Object.entries(pathItem as Record<string, unknown>)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue
      if (typeof operation !== 'object' || operation === null) continue
      const op = operation as Record<string, unknown>
      const parameters = (op.parameters as Array<Record<string, unknown>>) || []
      const queryParams = parameters.filter((p) => p.in === 'query')
      const headerParams = parameters.filter((p) => p.in === 'header')
      const bodyParam = parameters.find((p) => p.in === 'body')
      const requestBody = op.requestBody as Record<string, unknown> | undefined

      let bodyType: BodyType = 'none'
      let bodyRaw = ''
      let formData: KVPair[] = []

      if (requestBody) {
        const content = (requestBody.content as Record<string, unknown>) || {}
        if (content['application/json']) {
          bodyType = 'json'
          const schema = (content['application/json'] as Record<string, unknown>).schema as Record<string, unknown>
          if (schema) bodyRaw = JSON.stringify(schema, null, 2)
        } else if (content['multipart/form-data']) {
          bodyType = 'form-data'
          const schema = (content['multipart/form-data'] as Record<string, unknown>).schema as Record<string, unknown>
          if (schema && typeof schema.properties === 'object' && schema.properties !== null && !Array.isArray(schema.properties)) {
            formData = Object.entries(schema.properties as Record<string, unknown>).map(([key]) => ({
              key,
              value: '',
              enabled: true,
            }))
          }
        } else if (content['application/x-www-form-urlencoded']) {
          bodyType = 'x-www-form-urlencoded'
        }
      } else if (bodyParam) {
        const schema = (bodyParam.schema as Record<string, unknown>) || {}
        bodyType = 'json'
        bodyRaw = JSON.stringify(schema, null, 2)
      }

      requests.push({
        id: generateId(prefix, `${method}-${path}`),
        name: String(op.summary ?? op.operationId ?? `${method.toUpperCase()} ${path}`),
        method: normalizeMethod(method),
        url: buildUrl(baseUrl, path),
        params: mapQueries(queryParams),
        headers: mapHeaders(headerParams),
        bodyType,
        bodyRaw,
        formData,
        ...createBaseRequest(),
      })
    }
  }
  return requests
}

const swaggerAdapter: ImportAdapter = {
  name: 'Swagger 2.0',
  detect: (data) => {
    if (typeof data !== 'object' || data === null) return false
    const d = data as Record<string, unknown>
    return d.swagger === '2.0' && typeof d.paths === 'object'
  },
  parse: (data, baseUrl = '') => {
    const d = data as Record<string, unknown>
    const host = String(d.host ?? '')
    const basePath = String(d.basePath ?? '')
    const schemes = (d.schemes as string[]) || []
    const scheme = schemes[0] || 'http'
    const inferredBase = baseUrl || (host ? `${scheme}://${host}${basePath}` : '')
    const requests = extractSwaggerRequests(d.paths as Record<string, unknown>, inferredBase, 'swagger')
    return { requests, collectionName: String(d.info && (d.info as Record<string, unknown>).title || 'Swagger Import') }
  },
}

const openapiAdapter: ImportAdapter = {
  name: 'OpenAPI 3.x',
  detect: (data) => {
    if (typeof data !== 'object' || data === null) return false
    const d = data as Record<string, unknown>
    return String(d.openapi ?? '').startsWith('3') && typeof d.paths === 'object'
  },
  parse: (data, baseUrl = '') => {
    const d = data as Record<string, unknown>
    const servers = (d.servers as Array<Record<string, unknown>>) || []
    const serverUrl = String(servers[0]?.url ?? '')
    const inferredBase = baseUrl || serverUrl.replace(/\/$/, '')
    const requests = extractSwaggerRequests(d.paths as Record<string, unknown>, inferredBase, 'openapi')
    return { requests, collectionName: String(d.info && (d.info as Record<string, unknown>).title || 'OpenAPI Import') }
  },
}

function extractPostmanItems(items: Array<Record<string, unknown>>, baseUrl: string): RequestData[] {
  const requests: RequestData[] = []
  for (const item of items) {
    if (Array.isArray(item.item)) {
      requests.push(...extractPostmanItems(item.item as Array<Record<string, unknown>>, baseUrl))
      continue
    }
    const req = item.request as Record<string, unknown> | undefined
    if (!req) continue
    const urlObj = req.url as Record<string, unknown> | string | undefined
    let url = ''
    if (typeof urlObj === 'string') {
      url = urlObj
    } else if (urlObj) {
      const raw = String(urlObj.raw ?? '')
      const protocol = String(urlObj.protocol ?? '')
      const hostParts = (urlObj.host as string[]) || []
      const pathParts = (urlObj.path as string[]) || []
      url = raw || (protocol ? `${protocol}://${hostParts.join('.')}/${pathParts.join('/')}` : `/${pathParts.join('/')}`)
    }
    url = baseUrl ? buildUrl(baseUrl, url) : url

    const method = normalizeMethod(String(req.method ?? 'GET'))
    const headerArr = (req.header as Array<Record<string, unknown>>) || []
    const headers = mapHeaders(headerArr)
    const queryArr = (req.url && (req.url as Record<string, unknown>).query) as Array<Record<string, unknown>> | undefined
    const params = queryArr ? mapQueries(queryArr) : []

    const body = req.body as Record<string, unknown> | undefined
    const { bodyType, bodyRaw, formData } = extractBody(
      undefined,
      undefined,
      undefined,
      body?.mode as string,
      body?.raw as string,
      body?.urlencoded as Array<Record<string, unknown>>,
      body?.formdata as Array<Record<string, unknown>>
    )

    requests.push({
      id: generateId('postman', String(item.id || item.name || Math.random())),
      name: String(item.name ?? 'Untitled'),
      method,
      url,
      params,
      headers,
      bodyType,
      bodyRaw,
      formData,
      ...createBaseRequest(),
    })
  }
  return requests
}

const postmanAdapter: ImportAdapter = {
  name: 'Postman Collection',
  detect: (data) => {
    if (typeof data !== 'object' || data === null) return false
    const d = data as Record<string, unknown>
    return !!(d.info && typeof (d.info as Record<string, unknown>).schema === 'string' && Array.isArray(d.item))
  },
  parse: (data, baseUrl = '') => {
    const d = data as Record<string, unknown>
    const requests = extractPostmanItems(d.item as Array<Record<string, unknown>>, baseUrl)
    return { requests, collectionName: String((d.info as Record<string, unknown>).name || 'Postman Import') }
  },
}

const ADAPTERS: ImportAdapter[] = [yapiAdapter, swaggerAdapter, openapiAdapter, postmanAdapter]

function detectFormat(data: unknown): ImportAdapter | null {
  for (const adapter of ADAPTERS) {
    if (adapter.detect(data)) return adapter
  }
  return null
}

export function parseImport(jsonStr: string, envBaseUrl?: string): ImportResult & { formatName: string } {
  let data: unknown
  try {
    data = JSON.parse(jsonStr)
  } catch {
    throw new Error('Invalid JSON')
  }

  const adapter = detectFormat(data)
  if (!adapter) {
    throw new Error('Unsupported import format. Supported: YApi, Swagger 2.0, OpenAPI 3.x, Postman Collection')
  }

  const baseUrl = envBaseUrl || ''
  const result = adapter.parse(data, baseUrl)

  if (envBaseUrl) {
    const normalizedBase = envBaseUrl.replace(/\/$/, '')
    result.requests = result.requests.map((req) => ({
      ...req,
      url: req.url.startsWith(normalizedBase)
        ? `{{base_url}}${req.url.slice(normalizedBase.length)}`
        : req.url,
    }))
  }

  return { ...result, formatName: adapter.name }
}
