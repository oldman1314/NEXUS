import { useCallback, useRef } from 'react'
import { useRequestStore } from '@/stores/useRequestStore'
import { useAppStore } from '@/stores/useAppStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { sendRequest } from '@/utils/request'

export function useRequestSender() {
  const setResponse = useRequestStore((state) => state.setResponse)
  const setLastScriptVariables = useRequestStore((state) => state.setLastScriptVariables)
  const addHistory = useAppStore((state) => state.addHistory)
  const environments = useAppStore((state) => state.environments)
  const activeEnvId = useAppStore((state) => state.activeEnvId)
  const updateEnvironment = useAppStore((state) => state.updateEnvironment)
  const requestTimeout = useRequestStore((state) => state.requestTimeout)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startRequest = useAnimationStore((s) => s.startRequest)
  const endRequest = useAnimationStore((s) => s.endRequest)
  const cancelRequest = useAnimationStore((s) => s.cancelRequest)

  const handleSend = useCallback(async () => {
    const currentRequest = useRequestStore.getState().activeRequest
    const currentEnv = environments.find((e) => e.id === activeEnvId) || null
    const currentStatus = useAnimationStore.getState().requestStatus
    if (!currentRequest || currentStatus === 'pending') return
    const controller = new AbortController()
    abortControllerRef.current = controller

    startRequest()

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    let requestResult: Awaited<ReturnType<typeof sendRequest>> | null = null
    let isError = false
    let errMsg = ''
    let httpStatus = 0

    try {
      requestResult = await sendRequest(currentRequest, currentEnv, { timeout: requestTimeout, signal: controller.signal })
      httpStatus = requestResult.response.status
      setResponse(requestResult.response)
      addHistory({
        id: crypto.randomUUID(),
        method: currentRequest.method,
        url: currentRequest.url,
        status: requestResult.response.status,
        duration: requestResult.response.duration,
        timestamp: new Date().toISOString(),
        requestData: { ...currentRequest },
        responseSize: requestResult.response.size,
      })

      isError = !requestResult.response.ok
    } catch (e) {
      isError = true
      errMsg = e instanceof Error ? e.message : 'Network Error'
    } finally {
      abortControllerRef.current = null
      if (!requestResult || !requestResult.response.ok) {
        const status = requestResult?.response?.status
        if (!requestResult) {
          errMsg = errMsg || 'Network Error'
        } else if (status === 408) errMsg = 'Timeout'
        else if (status === 0) errMsg = 'CORS Blocked'
        else if (status && status >= 400) errMsg = `${status} Error`
        else errMsg = 'Request Failed'
      }
      endRequest(!isError, httpStatus, errMsg || undefined)

      if (requestResult) {
        const result = requestResult
        if (currentEnv) {
          const hasChanges = Object.keys(result.scriptEnvChanges).length > 0
          const hasDeletions = result.scriptEnvDeletions.length > 0

          if (hasChanges || hasDeletions) {
            let updatedVars = currentEnv.variables.map((v) => {
              if (v.key in result.scriptEnvChanges) {
                return { ...v, value: result.scriptEnvChanges[v.key] }
              }
              return v
            })

            if (hasDeletions) {
              updatedVars = updatedVars.filter((v) => !result.scriptEnvDeletions.includes(v.key))
            }

            const newKeys = Object.keys(result.scriptEnvChanges).filter(
              (key) => !currentEnv.variables.some((v) => v.key === key)
            )
            const newVars = newKeys.map((key) => ({
              id: crypto.randomUUID(),
              key,
              value: result.scriptEnvChanges[key],
              sensitive: false,
            }))
            updateEnvironment(currentEnv.id, {
              variables: [...updatedVars, ...newVars],
            })
          }
        }

        const mergedVars: Record<string, unknown> = {}
        for (const log of result.preRequestLogs) {
          const match = log.match(/pm\.variables\.set\("([^"]+)",\s*(.+?)\)/)
          if (match) {
            try {
              mergedVars[match[1]] = JSON.parse(match[2])
            } catch {
              mergedVars[match[1]] = match[2]
            }
          }
        }
        setLastScriptVariables(mergedVars)
      }
    }
  }, [environments, activeEnvId, requestTimeout, setResponse, setLastScriptVariables, addHistory, startRequest, endRequest, updateEnvironment])

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    cancelRequest()
  }, [cancelRequest])

  return {
    handleSend,
    handleCancel,
  }
}
