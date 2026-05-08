import { useCallback, useRef } from 'react'
import { useDataTableStore } from '../stores/useDataTableStore'
import type { DataTableMode, MergedTestCase } from '../types/data-table'
import {
  fetchCaseList,
  fetchTestCaseDetails,
  fetchTestRunDetail,
} from '../utils/data-table-api'
import {
  extractAssigneeNames,
  extractCustomFieldId,
  extractCustomFieldName,
  extractPrerequisites,
  extractUserNameFromURI,
  sanitizeHtml,
} from '../utils/data-table-api'
import {
  normalizeExecuted,
  normalizeResult,
} from '../utils/data-table-utils'
import { toast } from '../stores/useToastStore'

export function useDataTableData() {
  const abortRef = useRef<AbortController | null>(null)

  const {
    mode,
    projectId,
    testRunId,
    simpleCache,
    detailedCache,
    setLoading,
    setLoadingProgress,
    setData,
    updateCache,
    setError,
    reset,
  } = useDataTableStore()

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
  }, [setLoading])

  const fetchData = useCallback(
    async (overrideMode?: DataTableMode, overrideProject?: string, overrideTestRun?: string, forceRefresh: boolean = false) => {
      const currentMode = overrideMode ?? mode
      const currentProject = overrideProject ?? projectId
      const currentTestRun = overrideTestRun ?? testRunId

      if (!currentProject || !currentTestRun) {
        toast('warning', '请输入项目ID和测试运行ID')
        return
      }

      const cache = currentMode === 'simple' ? simpleCache : detailedCache
      const cacheData = (cache && cache.projectId === currentProject && cache.testRunId === currentTestRun)
        ? cache.data
        : []

      if (!forceRefresh && cacheData.length > 0) {
        setData(cacheData)
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      reset()
      setLoading(true)

      try {
        if (currentMode === 'simple') {
          setLoadingProgress('正在获取用例列表...')
          const caseList = await fetchCaseList(currentProject, currentTestRun, controller.signal)
          const merged: MergedTestCase[] = caseList.map((item) => ({
            ...item,
            result: normalizeResult(item.result),
            executed: normalizeExecuted(item.executed),
          }))
          setData(merged)
          updateCache('simple', merged)
        } else {
          const existingSimpleCache = (simpleCache && simpleCache.projectId === currentProject && simpleCache.testRunId === currentTestRun)
            ? simpleCache.data
            : null

          const existingDetailedCache = (detailedCache && detailedCache.projectId === currentProject && detailedCache.testRunId === currentTestRun)
            ? detailedCache.data
            : null

          if (existingSimpleCache && !existingDetailedCache) {
            setLoadingProgress('正在增量加载详细信息...')

            const [testRunDetail] = await Promise.all([
              fetchTestRunDetail(currentProject, currentTestRun, controller.signal),
            ])

            const recordMap = new Map(
              testRunDetail.records.map((r) => [r.testcase_id, r])
            )

            const caseIds = existingSimpleCache.map((c) => c.id)

            const batchResult = await fetchTestCaseDetails(
              currentProject,
              currentTestRun,
              caseIds,
              controller.signal,
              5,
              (completed, total) => {
                setLoadingProgress(`正在获取用例详情 (${completed}/${total})...`, completed, total)
              }
            )

            const failedSet = new Set(batchResult.failedCaseIds)

            const merged: MergedTestCase[] = existingSimpleCache.map((item) => {
              const record = recordMap.get(item.id)
              const detail = batchResult.details.get(item.id)

              const mergedItem: MergedTestCase = {
                ...item,
                projectId: currentProject,
                testRunId: currentTestRun,
                result: item.result || normalizeResult(item.result),
                executed: item.executed || normalizeExecuted(item.executed),
              }

              if (record) {
                mergedItem.duration = record.duration
                mergedItem.executedTime = record.executed
                mergedItem.executedBy = extractUserNameFromURI(record.executedByURI)
                mergedItem.stepResultCount = record.testStepResults?.TestStepResult?.length ?? 0
                mergedItem.defectURI = record.defectURI
                mergedItem.record = record
                if (record.result?.id) {
                  const normalizedRecordResult = normalizeResult(record.result.id)
                  if (normalizedRecordResult) {
                    mergedItem.result = normalizedRecordResult
                  }
                }
                mergedItem.executed = 1

                if (record.testStepResults?.TestStepResult?.length) {
                  mergedItem.steps = record.testStepResults.TestStepResult.map((step) => ({
                    result: step.result?.id || '',
                    comment: step.comment?.content || '',
                    content: step.comment?.content ? sanitizeHtml(step.comment.content) : '',
                  }))
                }

                if (record.defectURI) {
                  mergedItem.links = [
                    { url: record.defectURI, title: 'Defect' },
                  ]
                }
              }

              if (detail) {
                mergedItem.assignee = extractAssigneeNames(detail)
                mergedItem.caseStatus = detail.status?.id
                mergedItem.automation = extractCustomFieldId(detail.customFields, 'automation')
                mergedItem.featureCluster = extractCustomFieldName(detail.customFields, 'featureCluster')
                mergedItem.featureName = extractCustomFieldName(detail.customFields, 'featureName')
                mergedItem.testStepCount = detail.testSteps?.length ?? 0
                mergedItem.prerequisites = extractPrerequisites(detail)
                mergedItem.testCaseDetail = detail
                mergedItem.priority = detail.priority?.id
                mergedItem.createdAt = detail.created
                mergedItem.updatedAt = detail.updated

                const tags: string[] = []
                if (detail.type?.id) tags.push(detail.type.id)
                if (detail.priority?.id) tags.push(detail.priority.id)
                if (detail.status?.id) tags.push(detail.status.id)
                if (tags.length > 0) mergedItem.tags = tags
              }

              if (failedSet.has(item.id)) {
                mergedItem.fetchFailed = true
              }

              return mergedItem
            })

            setData(merged)
            updateCache('detailed', merged)

            if (batchResult.failedCaseIds.length > 0) {
              toast('warning', `${batchResult.failedCaseIds.length} 条用例详情获取失败，其余数据已正常加载`)
            }
          } else {
            setLoadingProgress('正在获取用例列表和测试运行详情...')
            const [caseList, testRunDetail] = await Promise.all([
              fetchCaseList(currentProject, currentTestRun, controller.signal),
              fetchTestRunDetail(currentProject, currentTestRun, controller.signal),
            ])

            const recordMap = new Map(
              testRunDetail.records.map((r) => [r.testcase_id, r])
            )

            const caseIds = caseList.map((c) => c.id)

            const batchResult = await fetchTestCaseDetails(
              currentProject,
              currentTestRun,
              caseIds,
              controller.signal,
              5,
              (completed, total) => {
                setLoadingProgress(`正在获取用例详情 (${completed}/${total})...`, completed, total)
              }
            )

            const failedSet = new Set(batchResult.failedCaseIds)

            const merged: MergedTestCase[] = caseList.map((item) => {
              const record = recordMap.get(item.id)
              const detail = batchResult.details.get(item.id)

              const mergedItem: MergedTestCase = {
                ...item,
                projectId: currentProject,
                testRunId: currentTestRun,
                result: normalizeResult(item.result),
                executed: normalizeExecuted(item.executed),
              }

              if (record) {
                mergedItem.duration = record.duration
                mergedItem.executedTime = record.executed
                mergedItem.executedBy = extractUserNameFromURI(record.executedByURI)
                mergedItem.stepResultCount = record.testStepResults?.TestStepResult?.length ?? 0
                mergedItem.defectURI = record.defectURI
                mergedItem.record = record
                if (record.result?.id) {
                  const normalizedRecordResult = normalizeResult(record.result.id)
                  if (normalizedRecordResult) {
                    mergedItem.result = normalizedRecordResult
                  }
                }
                mergedItem.executed = 1

                if (record.testStepResults?.TestStepResult?.length) {
                  mergedItem.steps = record.testStepResults.TestStepResult.map((step) => ({
                    result: step.result?.id || '',
                    comment: step.comment?.content || '',
                    content: step.comment?.content ? sanitizeHtml(step.comment.content) : '',
                  }))
                }

                if (record.defectURI) {
                  mergedItem.links = [
                    { url: record.defectURI, title: 'Defect' },
                  ]
                }
              }

              if (detail) {
                mergedItem.assignee = extractAssigneeNames(detail)
                mergedItem.caseStatus = detail.status?.id
                mergedItem.automation = extractCustomFieldId(detail.customFields, 'automation')
                mergedItem.featureCluster = extractCustomFieldName(detail.customFields, 'featureCluster')
                mergedItem.featureName = extractCustomFieldName(detail.customFields, 'featureName')
                mergedItem.testStepCount = detail.testSteps?.length ?? 0
                mergedItem.prerequisites = extractPrerequisites(detail)
                mergedItem.testCaseDetail = detail
                mergedItem.priority = detail.priority?.id
                mergedItem.createdAt = detail.created
                mergedItem.updatedAt = detail.updated

                const tags: string[] = []
                if (detail.type?.id) tags.push(detail.type.id)
                if (detail.priority?.id) tags.push(detail.priority.id)
                if (detail.status?.id) tags.push(detail.status.id)
                if (tags.length > 0) mergedItem.tags = tags
              }

              if (failedSet.has(item.id)) {
                mergedItem.fetchFailed = true
              }

              return mergedItem
            })

            setData(merged)
            updateCache('detailed', merged)
            updateCache('simple', caseList.map((item) => ({
              ...item,
              result: normalizeResult(item.result),
              executed: normalizeExecuted(item.executed),
            })))

            if (batchResult.failedCaseIds.length > 0) {
              toast('warning', `${batchResult.failedCaseIds.length} 条用例详情获取失败，其余数据已正常加载`)
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        toast('error', err instanceof Error ? err.message : '未知错误')
      } finally {
        setLoading(false)
        setLoadingProgress('')
        if (abortRef.current === controller) {
          abortRef.current = null
        }
      }
    },
    [mode, projectId, testRunId, simpleCache, detailedCache, setLoading, setLoadingProgress, setData, updateCache, setError, reset]
  )

  return { fetchData, cancel }
}
