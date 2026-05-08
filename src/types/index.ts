export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type DroneState = 'idle' | 'launching' | 'flying' | 'hovering' | 'landing' | 'crashed'

export type WarpTunnelState = 'idle' | 'connecting' | 'connected' | 'error'

export type BodyType = 'none' | 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded'

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey'

export type KVPairValue = string | File

export interface KVPair {
  id?: string
  key: string
  value: string
  description?: string
  enabled: boolean
  type?: 'text' | 'file'
  fileName?: string
}

export interface AuthConfig {
  token?: string
  username?: string
  password?: string
  apiKey?: string
  apiValue?: string
  apiIn?: 'header' | 'query'
}

export interface SavedResponse {
  id: string
  name: string
  status: number
  statusText: string
  headers: Record<string, string>
  body: string | object
  duration: number
  size: number
  timestamp: string
}

export interface RequestData {
  id: string
  name: string
  method: HttpMethod
  url: string
  params: KVPair[]
  headers: KVPair[]
  bodyType: BodyType
  bodyRaw: string
  formData: KVPair[]
  urlEncodedData: KVPair[]
  authType: AuthType
  authConfig: AuthConfig
  preRequestScript: string
  testScript: string
  savedResponses: SavedResponse[]
}

export interface TestResult {
  name: string
  passed: boolean
  error?: string
}

export type RequestErrorType =
  | 'network'
  | 'timeout'
  | 'abort'
  | 'cors'
  | 'parse'
  | 'script'
  | 'unknown'

export interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string | object
  duration: number
  size: number
  ok: boolean
  error?: string
  errorType?: RequestErrorType
  testResults?: TestResult[]
  consoleLogs?: string[]
}

export interface Collection {
  id: string
  name: string
  requests: RequestData[]
  createdAt: string
}

export interface HistoryEntry {
  id: string
  method: HttpMethod
  url: string
  status: number
  duration: number
  timestamp: string
  requestData?: RequestData
  responseSize: number
  starred?: boolean
}

export interface EnvironmentVariable {
  id: string
  key: string
  value: string
  sensitive?: boolean
  description?: string
}

export interface Environment {
  id: string
  name: string
  variables: EnvironmentVariable[]
  color?: string
  baseUrl?: string
  baseUrlEnabled?: boolean
}

export type ViewType = 'request' | 'workflow' | 'data-table' | 'remote-tools'

export type ThemeMode = 'light' | 'dark' | 'system'

export type AccentColor = 'blue' | 'purple' | 'indigo' | 'pink' | 'rose' | 'red' | 'orange' | 'green' | 'mint' | 'teal' | 'cyan'

export type VisualStyle = 'classic' | 'immersive'

export type FontFamily = 'harmonyos' | 'lxgw' | 'misans' | 'noto' | 'sarasa'

export interface YApiItem {
  _id: number
  method: string
  path: string
  title: string
  req_headers?: Array<{
    name: string
    value: string
    required?: string
    desc?: string
  }>
  req_query?: Array<{
    name: string
    required?: string
    desc?: string
    example?: string
  }>
  req_body_type?: string
  req_body_other?: string
  req_body_form?: Array<{
    name: string
    type: string
    required?: string
    desc?: string
  }>
  res_body?: string
}

export interface YApiExport {
  list: YApiItem[]
}

export interface WorkflowNodeData {
  label: string
  description?: string
}

export interface ApiNodeData extends WorkflowNodeData {
  requestId?: string
  method: HttpMethod
  url: string
  headers: KVPair[]
  bodyType: BodyType
  bodyRaw: string
  params: KVPair[]
}

export interface ConditionNodeData extends WorkflowNodeData {
  expression: string
}

export interface TransformNodeData extends WorkflowNodeData {
  script: string
}

export interface StartNodeData extends WorkflowNodeData { }

export interface OutputNodeData extends WorkflowNodeData {
  format: 'json' | 'text'
}

export type CustomNodeData =
  | { type: 'start'; data: StartNodeData }
  | { type: 'api'; data: ApiNodeData }
  | { type: 'condition'; data: ConditionNodeData }
  | { type: 'transform'; data: TransformNodeData }
  | { type: 'output'; data: OutputNodeData }

export interface WorkflowLog {
  nodeId: string
  nodeName: string
  status: 'success' | 'error' | 'skipped'
  input?: unknown
  output?: unknown
  duration: number
  timestamp: number
}

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  label?: string
}