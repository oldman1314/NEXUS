import type { RequestData } from '@/types'

export interface RequestTemplate {
  id: string
  name: string
  description: string
  request: Partial<RequestData>
}

export const defaultTemplates: RequestTemplate[] = [
  {
    id: 'template-get',
    name: 'GET Request',
    description: 'Simple GET request template',
    request: {
      method: 'GET',
      url: 'https://api.example.com/users',
      headers: [
        { key: 'Accept', value: 'application/json', enabled: true },
      ],
      params: [],
      bodyType: 'none',
      bodyRaw: '',
      formData: [],
      authType: 'none',
      authConfig: {},
    },
  },
  {
    id: 'template-post-json',
    name: 'POST JSON',
    description: 'POST request with JSON body',
    request: {
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Accept', value: 'application/json', enabled: true },
      ],
      params: [],
      bodyType: 'json',
      bodyRaw: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
      formData: [],
      authType: 'none',
      authConfig: {},
    },
  },
  {
    id: 'template-auth-bearer',
    name: 'Bearer Auth',
    description: 'Request with Bearer token authentication',
    request: {
      method: 'GET',
      url: 'https://api.example.com/protected',
      headers: [
        { key: 'Accept', value: 'application/json', enabled: true },
      ],
      params: [],
      bodyType: 'none',
      bodyRaw: '',
      formData: [],
      authType: 'bearer',
      authConfig: { token: '{{access_token}}' },
    },
  },
  {
    id: 'template-form-data',
    name: 'Form Data',
    description: 'POST request with form-data body',
    request: {
      method: 'POST',
      url: 'https://api.example.com/upload',
      headers: [],
      params: [],
      bodyType: 'form-data',
      bodyRaw: '',
      formData: [
        { key: 'file', value: '', enabled: true, description: 'File to upload' },
        { key: 'name', value: 'example', enabled: true },
      ],
      authType: 'none',
      authConfig: {},
    },
  },
  {
    id: 'template-graphql',
    name: 'GraphQL',
    description: 'GraphQL query request template',
    request: {
      method: 'POST',
      url: 'https://api.example.com/graphql',
      headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
      ],
      params: [],
      bodyType: 'json',
      bodyRaw: '{\n  "query": "query GetUsers { users { id name email } }"\n}',
      formData: [],
      authType: 'none',
      authConfig: {},
    },
  },
]
