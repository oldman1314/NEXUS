import type { HttpMethod, BodyType, AuthType } from '@/types'

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export const METHOD_COLORS: Record<HttpMethod, { color: string; bg: string }> = {
  GET: { color: '#34c759', bg: 'rgba(52, 199, 89, 0.15)' },
  POST: { color: '#ff9500', bg: 'rgba(255, 149, 0, 0.15)' },
  PUT: { color: '#007aff', bg: 'rgba(0, 122, 255, 0.15)' },
  PATCH: { color: '#af52de', bg: 'rgba(175, 82, 222, 0.15)' },
  DELETE: { color: '#ff2d55', bg: 'rgba(255, 45, 85, 0.15)' },
  HEAD: { color: '#86868b', bg: 'rgba(134, 134, 139, 0.15)' },
  OPTIONS: { color: '#5ac8fa', bg: 'rgba(90, 200, 250, 0.15)' },
}

export const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
]

export const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apikey', label: 'API Key' },
]
