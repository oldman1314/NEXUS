export interface CompletionItem {
  label: string
  insertText: string
  detail?: string
  kind: 'keyword' | 'function' | 'property' | 'variable' | 'snippet'
}

const JS_KEYWORDS: CompletionItem[] = [
  { label: 'const', insertText: 'const ', kind: 'keyword' },
  { label: 'let', insertText: 'let ', kind: 'keyword' },
  { label: 'var', insertText: 'var ', kind: 'keyword' },
  { label: 'function', insertText: 'function ', kind: 'keyword' },
  { label: 'return', insertText: 'return ', kind: 'keyword' },
  { label: 'if', insertText: 'if () {\n  \n}', kind: 'snippet', detail: 'if statement' },
  { label: 'else', insertText: 'else {\n  \n}', kind: 'snippet', detail: 'else block' },
  { label: 'for', insertText: 'for (let i = 0; i < ; i++) {\n  \n}', kind: 'snippet', detail: 'for loop' },
  { label: 'while', insertText: 'while () {\n  \n}', kind: 'snippet', detail: 'while loop' },
  { label: 'try', insertText: 'try {\n  \n} catch (e) {\n  \n}', kind: 'snippet', detail: 'try/catch' },
  { label: 'new', insertText: 'new ', kind: 'keyword' },
  { label: 'typeof', insertText: 'typeof ', kind: 'keyword' },
  { label: 'instanceof', insertText: 'instanceof ', kind: 'keyword' },
  { label: 'true', insertText: 'true', kind: 'keyword' },
  { label: 'false', insertText: 'false', kind: 'keyword' },
  { label: 'null', insertText: 'null', kind: 'keyword' },
  { label: 'undefined', insertText: 'undefined', kind: 'keyword' },
  { label: 'async', insertText: 'async ', kind: 'keyword' },
  { label: 'await', insertText: 'await ', kind: 'keyword' },
  { label: '=>', insertText: '=> ', kind: 'snippet', detail: 'arrow function' },
]

const CONSOLE_COMPLETIONS: CompletionItem[] = [
  { label: 'log', insertText: 'console.log($0)', kind: 'function', detail: 'console.log(...)' },
  { label: 'error', insertText: 'console.error($0)', kind: 'function', detail: 'console.error(...)' },
  { label: 'warn', insertText: 'console.warn($0)', kind: 'function', detail: 'console.warn(...)' },
  { label: 'info', insertText: 'console.info($0)', kind: 'function', detail: 'console.info(...)' },
  { label: 'debug', insertText: 'console.debug($0)', kind: 'function', detail: 'console.debug(...)' },
  { label: 'table', insertText: 'console.table($0)', kind: 'function', detail: 'console.table(...)' },
]

const PM_COMPLETIONS: CompletionItem[] = [
  // environment
  { label: 'pm.environment.get', insertText: 'pm.environment.get("$0")', kind: 'function', detail: 'Get env variable' },
  { label: 'pm.environment.set', insertText: 'pm.environment.set("$0", "")', kind: 'function', detail: 'Set env variable' },
  { label: 'pm.environment.has', insertText: 'pm.environment.has("$0")', kind: 'function', detail: 'Check env variable' },
  { label: 'pm.environment.unset', insertText: 'pm.environment.unset("$0")', kind: 'function', detail: 'Remove env variable' },
  { label: 'pm.environment.toObject', insertText: 'pm.environment.toObject()', kind: 'function', detail: 'Get all env variables' },
  // variables
  { label: 'pm.variables.get', insertText: 'pm.variables.get("$0")', kind: 'function', detail: 'Get variable' },
  { label: 'pm.variables.set', insertText: 'pm.variables.set("$0", "")', kind: 'function', detail: 'Set variable' },
  { label: 'pm.variables.has', insertText: 'pm.variables.has("$0")', kind: 'function', detail: 'Check variable' },
  { label: 'pm.variables.unset', insertText: 'pm.variables.unset("$0")', kind: 'function', detail: 'Remove variable' },
  // request
  { label: 'pm.request.url', insertText: 'pm.request.url', kind: 'property', detail: 'Request URL' },
  { label: 'pm.request.method', insertText: 'pm.request.method', kind: 'property', detail: 'Request method' },
  { label: 'pm.request.headers', insertText: 'pm.request.headers', kind: 'property', detail: 'Request headers' },
  { label: 'pm.request.body', insertText: 'pm.request.body', kind: 'property', detail: 'Request body' },
  { label: 'pm.request.addHeader', insertText: 'pm.request.addHeader("$0", "")', kind: 'function', detail: 'Add request header' },
  { label: 'pm.request.removeHeader', insertText: 'pm.request.removeHeader("$0")', kind: 'function', detail: 'Remove request header' },
  // response
  { label: 'pm.response.status', insertText: 'pm.response.status', kind: 'property', detail: 'Response status code' },
  { label: 'pm.response.statusText', insertText: 'pm.response.statusText', kind: 'property', detail: 'Response status text' },
  { label: 'pm.response.headers', insertText: 'pm.response.headers', kind: 'property', detail: 'Response headers' },
  { label: 'pm.response.body', insertText: 'pm.response.body', kind: 'property', detail: 'Response body' },
  { label: 'pm.response.duration', insertText: 'pm.response.duration', kind: 'property', detail: 'Response duration (ms)' },
  { label: 'pm.response.size', insertText: 'pm.response.size', kind: 'property', detail: 'Response size' },
  { label: 'pm.response.json', insertText: 'pm.response.json()', kind: 'function', detail: 'Parse JSON response' },
  { label: 'pm.response.text', insertText: 'pm.response.text()', kind: 'function', detail: 'Get text response' },
  // test / expect
  { label: 'pm.test', insertText: 'pm.test("$0", () => {\n  \n})', kind: 'function', detail: 'pm.test(name, fn)' },
  { label: 'pm.expect.equal', insertText: 'pm.expect.equal($0)', kind: 'function', detail: 'Assert equal' },
  { label: 'pm.expect.notEqual', insertText: 'pm.expect.notEqual($0)', kind: 'function', detail: 'Assert not equal' },
  { label: 'pm.expect.deepEqual', insertText: 'pm.expect.deepEqual($0)', kind: 'function', detail: 'Assert deep equal' },
  { label: 'pm.expect.include', insertText: 'pm.expect.include($0)', kind: 'function', detail: 'Assert includes' },
  { label: 'pm.expect.match', insertText: 'pm.expect.match($0)', kind: 'function', detail: 'Assert regex match' },
  { label: 'pm.expect.isTrue', insertText: 'pm.expect.isTrue($0)', kind: 'function', detail: 'Assert is true' },
  { label: 'pm.expect.isFalse', insertText: 'pm.expect.isFalse($0)', kind: 'function', detail: 'Assert is false' },
  { label: 'pm.expect.isAbove', insertText: 'pm.expect.isAbove($0)', kind: 'function', detail: 'Assert > value' },
  { label: 'pm.expect.isBelow', insertText: 'pm.expect.isBelow($0)', kind: 'function', detail: 'Assert < value' },
  { label: 'pm.expect.exist', insertText: 'pm.expect.exist($0)', kind: 'function', detail: 'Assert exists' },
  { label: 'pm.expect.typeOf', insertText: 'pm.expect.typeOf($0)', kind: 'function', detail: 'Assert type' },
  { label: 'pm.expect.property', insertText: 'pm.expect.property($0)', kind: 'function', detail: 'Assert property' },
  { label: 'pm.expect.hasLength', insertText: 'pm.expect.hasLength($0)', kind: 'function', detail: 'Assert length' },
  // console
  { label: 'pm.console', insertText: 'pm.console.', kind: 'variable', detail: 'Console object' },
]

const JSON_COMPLETIONS: CompletionItem[] = [
  { label: 'JSON.parse', insertText: 'JSON.parse(', kind: 'function', detail: 'Parse JSON string' },
  { label: 'JSON.stringify', insertText: 'JSON.stringify(', kind: 'function', detail: 'Stringify to JSON' },
]

const MATH_COMPLETIONS: CompletionItem[] = [
  { label: 'Math.random', insertText: 'Math.random()', kind: 'function', detail: 'Random 0-1' },
  { label: 'Math.floor', insertText: 'Math.floor(', kind: 'function', detail: 'Floor value' },
  { label: 'Math.ceil', insertText: 'Math.ceil(', kind: 'function', detail: 'Ceil value' },
  { label: 'Math.round', insertText: 'Math.round(', kind: 'function', detail: 'Round value' },
  { label: 'Math.max', insertText: 'Math.max(', kind: 'function', detail: 'Max value' },
  { label: 'Math.min', insertText: 'Math.min(', kind: 'function', detail: 'Min value' },
]

const DATE_COMPLETIONS: CompletionItem[] = [
  { label: 'Date.now', insertText: 'Date.now()', kind: 'function', detail: 'Current timestamp' },
  { label: 'new Date', insertText: 'new Date()', kind: 'snippet', detail: 'Create Date object' },
]

const STRING_COMPLETIONS: CompletionItem[] = [
  { label: 'toString', insertText: 'toString()', kind: 'function' },
  { label: 'parseInt', insertText: 'parseInt(', kind: 'function' },
  { label: 'parseFloat', insertText: 'parseFloat(', kind: 'function' },
  { label: 'encodeURIComponent', insertText: 'encodeURIComponent(', kind: 'function' },
  { label: 'decodeURIComponent', insertText: 'decodeURIComponent(', kind: 'function' },
  { label: 'btoa', insertText: 'btoa(', kind: 'function', detail: 'Base64 encode' },
  { label: 'atob', insertText: 'atob(', kind: 'function', detail: 'Base64 decode' },
]

export function getCompletions(
  textBeforeCursor: string,
  isTestScript: boolean
): CompletionItem[] {
  const trimmed = textBeforeCursor.trimEnd()

  // pm.xxx — show all pm APIs (insertText already includes full prefix)
  if (trimmed.endsWith('pm.')) {
    return PM_COMPLETIONS.filter((c) => c.label.startsWith('pm.')).map((c) => ({
      ...c,
      label: c.label.replace('pm.', ''),
    }))
  }

  // console.xxx
  if (trimmed.endsWith('console.')) {
    return CONSOLE_COMPLETIONS.map((c) => ({
      ...c,
      label: c.label,
      insertText: c.insertText.replace('console.', ''),
    }))
  }

  // JSON.xxx
  if (trimmed.endsWith('JSON.')) {
    return JSON_COMPLETIONS.map((c) => ({
      ...c,
      label: c.label.replace('JSON.', ''),
      insertText: c.insertText.replace('JSON.', ''),
    }))
  }

  // Math.xxx
  if (trimmed.endsWith('Math.')) {
    return MATH_COMPLETIONS.map((c) => ({
      ...c,
      label: c.label.replace('Math.', ''),
      insertText: c.insertText.replace('Math.', ''),
    }))
  }

  // Date
  if (/\bDate$/.test(trimmed)) {
    return DATE_COMPLETIONS
  }

  // pm (root) — suggest all pm APIs directly so user sees them immediately
  if (/\bpm$/.test(trimmed)) {
    return [
      { label: '.', insertText: '.', kind: 'property', detail: 'pm APIs' },
      ...PM_COMPLETIONS.filter((c) => c.label.startsWith('pm.')).map((c) => ({
        ...c,
        label: c.label,
      })),
    ]
  }

  // console (root)
  if (/\bconsole$/.test(trimmed)) {
    return [
      { label: '.', insertText: '.', kind: 'property', detail: 'console APIs' },
      ...CONSOLE_COMPLETIONS.map((c) => ({
        ...c,
        label: `console.${c.label}`,
      })),
    ]
  }

  // General keywords when no dot context
  const lastWord = trimmed.match(/(\w+)$/)?.[1] ?? ''
  if (lastWord.length >= 1) {
    const all = [
      ...JS_KEYWORDS,
      ...(isTestScript
        ? PM_COMPLETIONS.filter((c) => c.label.startsWith('pm.'))
        : PM_COMPLETIONS.filter(
            (c) =>
              c.label.startsWith('pm.environment') ||
              c.label.startsWith('pm.variables') ||
              c.label.startsWith('pm.request') ||
              c.label.startsWith('pm.console')
          )),
      ...JSON_COMPLETIONS,
      ...MATH_COMPLETIONS,
      ...DATE_COMPLETIONS,
      ...STRING_COMPLETIONS,
      ...CONSOLE_COMPLETIONS,
    ]
    const filtered = all.filter(
      (c) =>
        c.label.toLowerCase().startsWith(lastWord.toLowerCase()) &&
        c.label.toLowerCase() !== lastWord.toLowerCase()
    )
    // deduplicate by label
    const seen = new Set<string>()
    return filtered.filter((c) => {
      if (seen.has(c.label)) return false
      seen.add(c.label)
      return true
    })
  }

  return []
}

export function insertCompletion(
  value: string,
  cursorPos: number,
  item: CompletionItem
): { newValue: string; newCursorPos: number } {
  const before = value.slice(0, cursorPos)
  const after = value.slice(cursorPos)

  // Find the word boundary to replace: match word chars, dots, or closing brackets at end
  const wordMatch = before.match(/([a-zA-Z0-9_$\.]+)$/)
  const replaceStart = wordMatch ? cursorPos - wordMatch[0].length : cursorPos

  const newBefore = before.slice(0, replaceStart) + item.insertText
  const newValue = newBefore + after

  // Place cursor at $0 or end if no placeholder
  const placeholderIndex = item.insertText.indexOf('$0')
  const newCursorPos = placeholderIndex >= 0
    ? replaceStart + placeholderIndex
    : newBefore.length

  return { newValue, newCursorPos }
}
