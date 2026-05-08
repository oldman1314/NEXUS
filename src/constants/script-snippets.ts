export interface Snippet {
  label: string
  code: string
}

export const PRE_REQUEST_SNIPPETS: Snippet[] = [
  {
    label: 'Set environment variable',
    code: 'pm.environment.set("key", "value");',
  },
  {
    label: 'Get environment variable',
    code: 'const value = pm.environment.get("key");',
  },
  {
    label: 'Add header',
    code: 'pm.request.addHeader("X-Custom", "value");',
  },
  {
    label: 'Set request body',
    code: 'pm.request.body = JSON.stringify({ key: "value" });',
  },
  {
    label: 'Set URL parameter',
    code: 'pm.request.url += pm.request.url.includes("?") ? "&key=value" : "?key=value";',
  },
  {
    label: 'Log to console',
    code: 'console.log("Debug:", data);',
  },
]

export const TEST_SNIPPETS: Snippet[] = [
  {
    label: 'Status code is 200',
    code: `pm.test('Status code is 200', () => {\n  pm.expect.equal(pm.response.status, 200);\n});`,
  },
  {
    label: 'Status code is 2xx',
    code: `pm.test('Status code is 2xx', () => {\n  pm.expect.isAbove(pm.response.status, 199);\n  pm.expect.isBelow(pm.response.status, 300);\n});`,
  },
  {
    label: 'Response has JSON body',
    code: `pm.test('Response has JSON body', () => {\n  const json = pm.response.json();\n  pm.expect.exist(json);\n});`,
  },
  {
    label: 'Check response field',
    code: `pm.test('Response has data field', () => {\n  const json = pm.response.json();\n  pm.expect.exist(json.data);\n});`,
  },
  {
    label: 'Response time < 200ms',
    code: `pm.test('Response time is less than 200ms', () => {\n  pm.expect.isBelow(pm.response.duration, 200);\n});`,
  },
  {
    label: 'Set environment variable from response',
    code: `const json = pm.response.json();\npm.environment.set('token', json.token);`,
  },
]
