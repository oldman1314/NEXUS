import type { MergedTestCase } from '@/types/data-table'

const RESULT_POOL = ['通过', '失败', '阻塞', '等待']
const PRIORITY_POOL = ['P0', 'P1', 'P2', 'P3']
const ENV_POOL = ['staging', 'production', 'dev', 'qa']
const ASSIGNEE_POOL = ['张三', '李四', '王五', '赵六', 'Alice', 'Bob', 'Charlie']
const FEATURE_POOL = ['用户登录', '支付模块', '订单管理', '搜索功能', '数据报表', '消息推送', '权限管理', '文件上传']
const STATUS_POOL = ['Active', 'Draft', 'Review', 'Deprecated']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateMockData(count: number): MergedTestCase[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = i + 1
    const result = pick(RESULT_POOL)
    const executed = pick([0, 1])
    const duration = executed === 1 ? Number((Math.random() * 15).toFixed(1)) : undefined

    return {
      id: `CASE-${String(idx).padStart(4, '0')}`,
      title: `测试用例：功能验证-${idx} - ${pick(FEATURE_POOL)}场景`,
      executed,
      result,
      testPriority: pick(PRIORITY_POOL),
      testContent: `验证${pick(FEATURE_POOL)}模块的${idx}号测试场景，包含正常流程与异常边界`,
      testEnvironment: pick(ENV_POOL),
      duration,
      executedTime: executed === 1 ? `2026-04-${String(randomInRange(20, 28)).padStart(2, '0')} ${randomInRange(8, 22)}:${String(randomInRange(0, 59)).padStart(2, '0')}:00` : undefined,
      executedBy: executed === 1 ? pick(ASSIGNEE_POOL) : undefined,
      stepResultCount: result === '通过' ? randomInRange(3, 8) : randomInRange(1, 5),
      defectURI: result === '失败' && Math.random() > 0.4 ? `https://issues.example.com/DEFECT-${randomInRange(100, 999)}` : null,
      assignee: pick(ASSIGNEE_POOL),
      caseStatus: pick(STATUS_POOL),
      automation: pick(['已自动化', '未自动化', '部分自动化']),
      featureCluster: pick(['核心功能', '辅助功能', '边缘场景']),
      featureName: pick(FEATURE_POOL),
      testStepCount: randomInRange(2, 10),
      prerequisites: `需要${pick(ENV_POOL)}环境，已部署最新版本`,
      testCaseDetail: {
        id: `CASE-${String(idx).padStart(4, '0')}`,
        type: { id: 'Functional' },
        title: `测试用例：功能验证-${idx}`,
        priority: { id: pick(PRIORITY_POOL) },
        status: { id: pick(STATUS_POOL) },
        assignee: { User: [{ id: `${idx}`, name: pick(ASSIGNEE_POOL), email: `user${idx}@example.com` }] },
        author: { id: '1', name: 'PM', email: 'pm@example.com' },
        created: `2026-04-${String(randomInRange(10, 20)).padStart(2, '0')}T10:00:00Z`,
        updated: `2026-04-${String(randomInRange(22, 28)).padStart(2, '0')}T14:30:00Z`,
        customFields: null,
        testSteps: Array.from({ length: randomInRange(2, 5) }, (_, si) => ({
          description: `<p>步骤 ${si + 1}：执行${pick(FEATURE_POOL)}相关操作</p>`,
          expectedResult: `<p>预期结果：系统正常响应，数据一致性校验通过</p>`,
        })),
      },
      fetchFailed: Math.random() < 0.1,
    }
  })
}
