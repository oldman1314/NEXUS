import type { RequestData } from '@/types'

export type LangType = 'curl' | 'fetch' | 'python' | 'axios' | 'go'

export const CODEGEN_LANGS: { value: LangType; label: string }[] = [
  { value: 'curl', label: 'cURL' },
  { value: 'fetch', label: 'JavaScript Fetch' },
  { value: 'axios', label: 'Axios' },
  { value: 'python', label: 'Python requests' },
  { value: 'go', label: 'Go' },
]

function escapeJsonString(str: string): string {
  return JSON.stringify(str)
}

function buildBodyData(request: RequestData): { contentType?: string; bodyCode?: string; rawBody?: string } {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method) || request.bodyType === 'none') {
    return {}
  }

  switch (request.bodyType) {
    case 'json':
      return {
        contentType: 'application/json',
        rawBody: request.bodyRaw,
      }
    case 'text':
      return {
        rawBody: request.bodyRaw,
      }
    case 'x-www-form-urlencoded': {
      const params = request.urlEncodedData
        .filter((f) => f.enabled && f.key)
        .map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`)
        .join('&')
      return {
        contentType: 'application/x-www-form-urlencoded',
        rawBody: params,
      }
    }
    case 'form-data': {
      return {
        contentType: 'multipart/form-data',
        rawBody: '',
      }
    }
    default:
      return {}
  }
}

function buildAuthHeaders(request: RequestData): Array<{ key: string; value: string }> {
  const authHeaders: Array<{ key: string; value: string }> = []
  if (request.authType === 'bearer' && request.authConfig.token) {
    authHeaders.push({ key: 'Authorization', value: `Bearer ${request.authConfig.token}` })
  } else if (request.authType === 'basic' && request.authConfig.username) {
    const creds = btoa(`${request.authConfig.username}:${request.authConfig.password || ''}`)
    authHeaders.push({ key: 'Authorization', value: `Basic ${creds}` })
  } else if (request.authType === 'apikey' && request.authConfig.apiKey && request.authConfig.apiValue) {
    if (request.authConfig.apiIn === 'query') {
      return authHeaders
    }
    authHeaders.push({ key: request.authConfig.apiKey, value: request.authConfig.apiValue })
  }
  return authHeaders
}

export function generateCode(request: RequestData | null, lang: LangType): string {
  if (!request) return ''

  const userHeaders = request.headers
    .filter((h) => h.enabled && h.key)
    .map((h) => ({ key: h.key, value: h.value }))

  const authHeaders = buildAuthHeaders(request)
  const allHeaders = [...userHeaders, ...authHeaders]

  const params = request.params
    .filter((p) => p.enabled && p.key)
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)

  let url = request.url
  if (request.authType === 'apikey' && request.authConfig.apiIn === 'query' && request.authConfig.apiKey && request.authConfig.apiValue) {
    params.push(`${encodeURIComponent(request.authConfig.apiKey)}=${encodeURIComponent(request.authConfig.apiValue)}`)
  }
  if (params.length) {
    const sep = url.includes('?') ? '&' : '?'
    url += sep + params.join('&')
  }

  const bodyInfo = buildBodyData(request)

  switch (lang) {
    case 'curl': {
      let cmd = `curl -X ${request.method} ${escapeJsonString(url)}`
      allHeaders.forEach((h) => {
        cmd += ` \\\n  -H ${escapeJsonString(`${h.key}: ${h.value}`)}`
      })
      if (bodyInfo.contentType) {
        cmd += ` \\\n  -H ${escapeJsonString(`Content-Type: ${bodyInfo.contentType}`)}`
      }
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
        if (request.bodyType === 'form-data') {
          const enabled = request.formData.filter((f) => f.enabled && f.key)
          for (const f of enabled) {
            if (f.type === 'file' && f.fileName) {
              cmd += ` \\\n  -F ${escapeJsonString(`${f.key}=@${f.fileName}`)}`
            } else {
              cmd += ` \\\n  -F ${escapeJsonString(`${f.key}=${f.value}`)}`
            }
          }
        } else if (bodyInfo.rawBody) {
          cmd += ` \\\n  -d ${escapeJsonString(bodyInfo.rawBody)}`
        }
      }
      return cmd
    }
    case 'fetch': {
      let code = `fetch(${escapeJsonString(url)}, {\n`
      code += `  method: "${request.method}",\n`
      const fetchHeaders = [...allHeaders]
      if (bodyInfo.contentType) {
        fetchHeaders.push({ key: 'Content-Type', value: bodyInfo.contentType })
      }
      if (fetchHeaders.length) {
        code += `  headers: {\n`
        fetchHeaders.forEach((h) => {
          code += `    ${escapeJsonString(h.key)}: ${escapeJsonString(h.value)},\n`
        })
        code += `  },\n`
      }
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
        if (request.bodyType === 'json') {
          code += `  body: JSON.stringify(${request.bodyRaw || '{}'}),\n`
        } else if (bodyInfo.rawBody) {
          code += `  body: ${escapeJsonString(bodyInfo.rawBody)},\n`
        }
      }
      code += `})\n  .then((res) => res.json())\n  .then((data) => console.log(data))\n  .catch((err) => console.error(err));`
      return code
    }
    case 'axios': {
      let code = `axios({\n`
      code += `  url: ${escapeJsonString(url)},\n`
      code += `  method: "${request.method.toLowerCase()}",\n`
      const axiosHeaders = [...allHeaders]
      if (bodyInfo.contentType) {
        axiosHeaders.push({ key: 'Content-Type', value: bodyInfo.contentType })
      }
      if (axiosHeaders.length) {
        code += `  headers: {\n`
        axiosHeaders.forEach((h) => {
          code += `    ${escapeJsonString(h.key)}: ${escapeJsonString(h.value)},\n`
        })
        code += `  },\n`
      }
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
        if (request.bodyType === 'json') {
          code += `  data: ${request.bodyRaw || '{}'},\n`
        } else if (bodyInfo.rawBody) {
          code += `  data: ${escapeJsonString(bodyInfo.rawBody)},\n`
        }
      }
      code += `})\n  .then((res) => console.log(res.data))\n  .catch((err) => console.error(err));`
      return code
    }
    case 'python': {
      let code = `import requests\n\n`
      code += `url = ${escapeJsonString(url)}\n`
      const pyHeaders = [...allHeaders]
      if (bodyInfo.contentType) {
        pyHeaders.push({ key: 'Content-Type', value: bodyInfo.contentType })
      }
      if (pyHeaders.length) {
        code += `headers = {\n`
        pyHeaders.forEach((h) => {
          code += `    ${escapeJsonString(h.key)}: ${escapeJsonString(h.value)},\n`
        })
        code += `}\n`
      }
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
        if (request.bodyType === 'json') {
          code += `payload = ${request.bodyRaw || '{}'}\n`
        } else if (bodyInfo.rawBody) {
          code += `payload = ${escapeJsonString(bodyInfo.rawBody)}\n`
        }
      }
      code += `\nresponse = requests.${request.method.toLowerCase()}(url`
      if (pyHeaders.length) code += `, headers=headers`
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
        if (request.bodyType === 'json') code += `, json=payload`
        else if (bodyInfo.rawBody) code += `, data=payload`
      }
      code += `)\n\nprint(response.json())`
      return code
    }
    case 'go': {
      let code = `package main\n\n`
      code += `import (\n\t"bytes"\n\t"fmt"\n\t"net/http"\n\t"io"\n)\n\n`
      code += `func main() {\n`
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none' && bodyInfo.rawBody) {
        code += `\tpayload := []byte(${escapeJsonString(bodyInfo.rawBody)})\n`
        code += `\treq, _ := http.NewRequest("${request.method}", ${escapeJsonString(url)}, bytes.NewBuffer(payload))\n`
      } else {
        code += `\treq, _ := http.NewRequest("${request.method}", ${escapeJsonString(url)}, nil)\n`
      }
      const goHeaders = [...allHeaders]
      if (bodyInfo.contentType) {
        goHeaders.push({ key: 'Content-Type', value: bodyInfo.contentType })
      }
      goHeaders.forEach((h) => {
        code += `\treq.Header.Set(${escapeJsonString(h.key)}, ${escapeJsonString(h.value)})\n`
      })
      code += `\n\tclient := &http.Client{}\n`
      code += `\tresp, err := client.Do(req)\n`
      code += `\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n`
      code += `\tdefer resp.Body.Close()\n\n`
      code += `\tbody, _ := io.ReadAll(resp.Body)\n`
      code += `\tfmt.Println(string(body))\n`
      code += `}`
      return code
    }
    default:
      return ''
  }
}
