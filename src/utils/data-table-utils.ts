export function normalizeResult(result: string | undefined): string {
  if (!result) return 'waiting'
  const lower = result.toLowerCase()
  if (lower.includes('pass')) return 'passed'
  if (lower.includes('fail')) return 'failed'
  if (lower.includes('block')) return 'blocked'
  if (lower.includes('wait')) return 'waiting'
  return lower
}

export function normalizeExecuted(executed: number | boolean | undefined): number {
  if (executed === undefined || executed === null) return 0
  if (typeof executed === 'boolean') return executed ? 1 : 0
  return executed
}
