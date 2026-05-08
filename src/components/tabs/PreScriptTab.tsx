import { useCallback } from 'react'
import { ScrollText } from 'lucide-react'
import { useRequestStore } from '@/stores/useRequestStore'
import { useAppStore } from '@/stores/useAppStore'
import ScriptEditor from './ScriptEditor'
import { PRE_REQUEST_SNIPPETS } from '@/constants/script-snippets'
import { executePreRequestScript } from '@/utils/script-engine'

export default function PreScriptTab() {
  const request = useRequestStore((state) => state.activeRequest)
  const updateActiveRequest = useRequestStore((state) => state.updateActiveRequest)
  const environments = useAppStore((state) => state.environments)
  const activeEnvId = useAppStore((state) => state.activeEnvId)

  const activeEnv = environments.find((e) => e.id === activeEnvId) || null

  const handleTest = useCallback((): string[] => {
    if (!request) return []
    const result = executePreRequestScript(request.preRequestScript, request, activeEnv)
    return result.consoleLogs.length > 0 ? result.consoleLogs : ['✓ Script executed successfully (no output)']
  }, [request, activeEnv])

  if (!request) return null

  return (
    <ScriptEditor
      icon={<ScrollText size={14} />}
      label="Pre-request Script"
      value={request.preRequestScript}
      onChange={(v) => updateActiveRequest({ preRequestScript: v })}
      snippets={PRE_REQUEST_SNIPPETS}
      onTest={handleTest}
      placeholder={`// Example: Add a timestamp parameter\npm.request.addHeader('X-Timestamp', new Date().toISOString());\n\n// Available APIs:\n// pm.request.url / method / headers / body\n// pm.request.addHeader(key, value)\n// pm.environment.get/set(key)\n// console.log(...)`}
    />
  )
}
