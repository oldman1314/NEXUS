import { useCallback } from 'react'
import { FileCheck } from 'lucide-react'
import { useRequestStore } from '@/stores/useRequestStore'
import { useAppStore } from '@/stores/useAppStore'
import ScriptEditor from './ScriptEditor'
import { TEST_SNIPPETS } from '@/constants/script-snippets'
import { executeTestScript } from '@/utils/script-engine'

export default function TestsTab() {
  const request = useRequestStore((state) => state.activeRequest)
  const updateActiveRequest = useRequestStore((state) => state.updateActiveRequest)
  const response = useRequestStore((state) => state.response)
  const lastScriptVariables = useRequestStore((state) => state.lastScriptVariables)
  const environments = useAppStore((state) => state.environments)
  const activeEnvId = useAppStore((state) => state.activeEnvId)

  const activeEnv = environments.find((e) => e.id === activeEnvId) || null

  const handleTest = useCallback((): string[] => {
    if (!request) return []
    if (!response) {
      return ['[ERROR] No response available. Send a request first.']
    }
    const result = executeTestScript(request.testScript, response, activeEnv, lastScriptVariables)
    const logs = [...result.consoleLogs]
    if (result.testResults.length > 0) {
      const passed = result.testResults.filter((t) => t.passed).length
      const total = result.testResults.length
      logs.push(`${passed === total ? '✓' : '✗'} ${passed}/${total} tests passed`)
      result.testResults.forEach((t) => {
        if (!t.passed) {
          logs.push(`  ✗ ${t.name}: ${t.error || 'Failed'}`)
        }
      })
    }
    return logs.length > 0 ? logs : ['✓ Script executed successfully (no output)']
  }, [request, response, activeEnv, lastScriptVariables])

  if (!request) return null

  return (
    <ScriptEditor
      icon={<FileCheck size={14} />}
      label="Tests"
      value={request.testScript}
      onChange={(v) => updateActiveRequest({ testScript: v })}
      snippets={TEST_SNIPPETS}
      onTest={handleTest}
      isTestScript={true}
      placeholder={`// Example: Check status code\npm.test('Status code is 200', () => {\n  pm.expect.equal(pm.response.status, 200);\n});\n\n// Available APIs:\n// pm.response.status / statusText / headers / body / duration / size\n// pm.response.json() / text()\n// pm.test(name, fn)\n// pm.expect.equal / notEqual / deepEqual / include / match / isTrue / isFalse / isAbove / isBelow / exist\n// pm.environment.get/set/has/unset(key)\n// pm.variables.get/set/has/unset(key)\n// console.log(...)`}
    />
  )
}
