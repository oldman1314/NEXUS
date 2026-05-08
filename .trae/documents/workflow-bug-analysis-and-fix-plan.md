# Workflow 深度 Bug 分析与修复计划

基于对 workflow-engine.ts、workflow-validation.ts、WorkflowView.tsx、NodeConfigPanel.tsx、useWorkflowAnimationStore.ts、useAppStore.ts、SidebarWorkflows.tsx 等核心文件的深入审查，发现以下潜在 bug 和问题，按严重程度分类。

---

## 🔴 严重 Bug（影响核心功能正确性）

### Bug 1: API 节点响应体解析 — 双重消费 ReadableStream
- **文件**: [workflow-engine.ts:247-251](file:///d:/std/postman-app/src/utils/workflow-engine.ts#L247-L251)
- **问题**: 先调用 `response.json()`，失败后 fallback 到 `response.text()`。但 `response.body` 是 ReadableStream，只能消费一次。`response.json()` 失败时流已被消费，`response.text()` 会抛出 `TypeError: body stream already read`。
- **影响**: 当 API 返回非法 JSON 时，不仅拿不到 JSON，连原始文本也拿不到，body 会变成 undefined 或抛错。
- **修复**: 先 `response.text()` 获取原始文本，再尝试 `JSON.parse()`。

```typescript
// 修复前
try {
  body = contentType.includes('json') ? await response.json() : await response.text()
} catch {
  body = await response.text()  // ❌ 流已被消费，这里会报错
}

// 修复后
const text = await response.text()
try {
  body = contentType.includes('json') ? JSON.parse(text) : text
} catch {
  body = text
}
```

### Bug 2: 保存新工作流后 activeWorkflowId 未更新
- **文件**: [WorkflowView.tsx:372-396](file:///d:/std/postman-app/src/components/views/WorkflowView.tsx#L372-L396)
- **问题**: `performSave` 在 `activeWorkflowId` 为 null 时调用 `addWorkflow(name, nodes, edges)`，但 `addWorkflow` 不返回新创建的 workflow ID，`activeWorkflowId` 状态保持 null。
- **影响**: 保存新工作流后，再次保存会创建重复的工作流而不是更新已有的。每次 Save As 都会创建新副本。
- **修复**: `addWorkflow` 返回新 workflow 的 ID，并在 `performSave` / `handleSaveDialogConfirm` 中设置 `activeWorkflowId`。

### Bug 3: activeWorkflowId 状态双重维护导致不同步
- **文件**: [WorkflowView.tsx:150](file:///d:/std/postman-app/src/components/views/WorkflowView.tsx#L150) vs [useAppStore.ts:302](file:///d:/std/postman-app/src/stores/useAppStore.ts#L302)
- **问题**: WorkflowView 维护了本地 `const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null)`，同时 useAppStore 也有全局的 `activeWorkflowId`。两者互不关联。
- **影响**:
  - 侧边栏 SidebarWorkflows 点击工作流时设置全局 `activeWorkflowId`，但 WorkflowView 读取的是本地状态，不会加载对应工作流。
  - WorkflowView 中加载/新建工作流时更新本地状态，全局状态不变。
- **修复**: WorkflowView 应直接使用全局 store 的 `activeWorkflowId`，移除本地重复状态。

### Bug 4: 侧边栏点击工作流不会加载到编辑器
- **文件**: [SidebarWorkflows.tsx:37](file:///d:/std/postman-app/src/components/layout/sidebar/SidebarWorkflows.tsx#L37)
- **问题**: 点击侧边栏工作流只调用了 `setView('workflow'); setActiveWorkflowId(wf.id)`，没有调用 `handleLoadWorkflow` 来将节点和边加载到编辑器画布中。
- **影响**: 从侧边栏点击工作流后，虽然切换到了 workflow 视图，但画布上不会显示该工作流的内容。
- **修复**: 需要一种机制让 WorkflowView 响应全局 `activeWorkflowId` 的变化并自动加载对应工作流。

### Bug 5: 错误节点下游处理不当 — 静默丢失节点
- **文件**: [workflow-engine.ts:320-327](file:///d:/std/postman-app/src/utils/workflow-engine.ts#L320-L327)
- **问题**: 当节点执行出错时，代码只递减下游节点的入度但不将它们加入队列，也不标记为 voided/skipped。导致：
  1. 入度为 1 的下游节点：入度变为 0 但永远不会执行，也不会出现在日志中 — 静默消失。
  2. 入度 > 1 的下游节点：当其他前驱完成时入度变为 0，节点会执行但缺少错误节点的输出数据，可能导致后续逻辑异常。
- **影响**: 工作流执行出错后，下游节点要么静默消失，要么带着不完整数据继续执行。
- **修复**: 错误节点的直接下游应标记为 skipped 并记录日志；多前驱节点的下游应检查所有前驱是否成功完成。

---

## 🟠 中等 Bug（影响用户体验或数据一致性）

### Bug 6: 条件分支 voided 节点不记录日志
- **文件**: [workflow-engine.ts:92-110](file:///d:/std/postman-app/src/utils/workflow-engine.ts#L92-L110)
- **问题**: `voidBranch` 函数将节点标记为 voided 但不生成 `WorkflowLog`。用户在日志面板中看不到哪些节点因条件分支被跳过。
- **影响**: 用户无法从日志中了解工作流的完整执行路径，调试困难。
- **修复**: 在 `voidBranch` 中为每个被 void 的节点生成 status 为 'skipped' 的日志。

### Bug 7: 允许多个 Start 节点
- **文件**: [workflow-validation.ts:90-93](file:///d:/std/postman-app/src/utils/workflow-validation.ts#L90-L93) 和 [WorkflowView.tsx:193-252](file:///d:/std/postman-app/src/components/views/WorkflowView.tsx#L193-L252)
- **问题**: 验证只检查"至少有一个 start 节点"，不限制数量。`addNode` 也不阻止添加第二个 Start 节点。多个 Start 节点会导致它们同时以入度 0 开始执行，产生不可预测的行为。
- **修复**: 验证应检查恰好一个 start 节点；`addNode` 应在已有 start 节点时禁用或提示。

### Bug 8: handleTemplate 不重置 activeWorkflowId 和 isDirty
- **文件**: [WorkflowView.tsx:493-500](file:///d:/std/postman-app/src/components/views/WorkflowView.tsx#L493-L500)
- **问题**: 应用模板时只设置了 nodes/edges/nodeOffset，没有：
  1. 清除 `activeWorkflowId` — 模板修改会被误认为是编辑当前已保存的工作流。
  2. 设置 `isDirty = true` — 用户不会被提示保存，可能丢失模板修改。
- **修复**: `handleTemplate` 应设置 `setActiveWorkflowId(null)` 和 `setIsDirty(true)`。

### Bug 9: confirmDiscard 只警告不提供选择
- **文件**: [WorkflowView.tsx:282-288](file:///d:/std/postman-app/src/components/views/WorkflowView.tsx#L282-L288)
- **问题**: `confirmDiscard` 显示 toast 警告后直接返回 false，用户无法选择"放弃更改继续"。实际上阻止了所有有未保存更改时的操作（加载新工作流、新建等）。
- **修复**: 改为使用确认对话框，提供"保存"、"不保存"、"取消"三个选项。

### Bug 10: 侧边栏节点数量显示方式不当
- **文件**: [SidebarWorkflows.tsx:42](file:///d:/std/postman-app/src/components/layout/sidebar/SidebarWorkflows.tsx#L42)
- **问题**: `Object.keys(wf.nodes || {}).length` — `wf.nodes` 是数组不是对象，虽然 `Object.keys` 对数组返回索引所以结果正确，但语义不对且脆弱。
- **修复**: 改为 `(wf.nodes || []).length`。

### Bug 11: onConnect 不验证连接合法性
- **文件**: [WorkflowView.tsx:177-183](file:///d:/std/postman-app/src/components/views/WorkflowView.tsx#L177-L183)
- **问题**: `onConnect` 回调直接添加边，不验证：
  1. 自环（节点连接到自身）
  2. 重复边（同一 source+target 已存在）
  3. Start 节点作为 target（Start 不应有入边）
  4. Output 节点作为 source（Output 不应有出边）
- **修复**: 在 `onConnect` 中添加验证逻辑。

---

## 🟡 低优先级问题（安全/代码质量）

### Bug 12: evaluateExpression 和 executeTransform 存在代码注入风险
- **文件**: [workflow-engine.ts:57-76](file:///d:/std/postman-app/src/utils/workflow-engine.ts#L57-L76)
- **问题**: 使用 `new Function()` 执行用户输入的表达式和脚本，相当于 `eval()`，可执行任意 JavaScript 代码。`with` 语句也已废弃。
- **影响**: 恶意工作流可执行任意代码（虽然这是本地应用，风险较低，但导入他人工作流时仍有风险）。
- **建议**: 长期考虑使用 Web Worker 或 iframe sandbox 隔离执行；短期至少在文档中标注风险。

### Bug 13: evaluateExpression 错误时静默返回 false
- **文件**: [workflow-engine.ts:61-66](file:///d:/std/postman-app/src/utils/workflow-engine.ts#L61-L66)
- **问题**: 表达式求值失败时 catch 块返回 false，不抛出错误也不记录警告。用户不知道表达式写错了。
- **修复**: 应将节点状态设为 error 并记录错误信息，而不是静默走 false 分支。

### Bug 14: API 节点不支持 form-data 和 x-www-form-urlencoded
- **文件**: [workflow-engine.ts:232-239](file:///d:/std/postman-app/src/utils/workflow-engine.ts#L232-L239)
- **问题**: 类型定义中 `BodyType` 包含 `form-data` 和 `x-www-form-urlencoded`，但引擎只处理了 `json` 和 `text`。
- **影响**: 用户选择这两种 body type 时请求不会发送 body。
- **修复**: 补充实现这两种 body type 的处理逻辑。

### Bug 15: useWorkflowAnimationStore 的 _timers 数组可能无限增长
- **文件**: [useWorkflowAnimationStore.ts:41-45](file:///d:/std/postman-app/src/stores/useWorkflowAnimationStore.ts#L41-L45)
- **问题**: `schedule()` 不断往 `_timers` 数组 push timer ID，但 `triggerCombo` 中 `schedule` 的回调只执行 `set({ showComboText: false, comboLevel: 0 })`，不清理已执行的 timer ID。长时间运行可能导致数组膨胀。
- **修复**: 在 timer 回调执行后从 `_timers` 中移除对应 ID，或使用 `filter` 定期清理。

### Bug 16: onNodeStart 中的 executingNodes Set 未被使用
- **文件**: [WorkflowView.tsx:324-348](file:///d:/std/postman-app/src/components/views/WorkflowView.tsx#L324-L348)
- **问题**: `handleRun` 中创建了 `const executingNodes = new Set<string>()`，`onNodeStart` 回调中往里添加 nodeId，但这个 Set 从未被读取。
- **修复**: 移除未使用的变量，或利用它实现"正在执行的节点"高亮等功能。

### Bug 17: handleSaveWorkflow 存在冗余代码
- **文件**: [WorkflowView.tsx:398-421](file:///d:/std/postman-app/src/components/views/WorkflowView.tsx#L398-L421)
- **问题**: 当 `activeWorkflowId` 存在且非 forceDialog 时，`handleSaveWorkflow` 手动映射 nodes/edges 并调用 `updateWorkflow`，与 `performSave` 逻辑重复。
- **修复**: 统一使用 `performSave`。

---

## 📋 修复优先级排序

| 优先级 | Bug # | 描述 | 预计改动量 |
|--------|-------|------|-----------|
| P0 | Bug 1 | 响应体双重消费 Stream | 小 |
| P0 | Bug 2 | 保存新工作流后 ID 未更新 | 中 |
| P0 | Bug 3 | activeWorkflowId 状态不同步 | 中 |
| P0 | Bug 4 | 侧边栏点击不加载工作流 | 中 |
| P0 | Bug 5 | 错误节点下游静默丢失 | 中 |
| P1 | Bug 6 | voided 节点无日志 | 小 |
| P1 | Bug 7 | 允许多个 Start 节点 | 小 |
| P1 | Bug 8 | 模板不重置状态 | 小 |
| P1 | Bug 9 | confirmDiscard 阻塞操作 | 中 |
| P1 | Bug 10 | 节点数量显示方式 | 极小 |
| P1 | Bug 11 | 连接不验证合法性 | 中 |
| P2 | Bug 12 | 代码注入风险 | 大(长期) |
| P2 | Bug 13 | 表达式错误静默返回 false | 小 |
| P2 | Bug 14 | 缺少 form-data 支持 | 中 |
| P2 | Bug 15 | _timers 数组膨胀 | 小 |
| P2 | Bug 16 | 未使用的 executingNodes | 极小 |
| P2 | Bug 17 | 冗余保存代码 | 小 |

---

## 🔧 实施步骤

### 第一阶段：修复 P0 严重 Bug

1. **修复 Bug 1** — 修改 `workflow-engine.ts` 中 API 节点的响应体解析逻辑
2. **修复 Bug 2** — 修改 `addWorkflow` 返回新 ID，更新 `performSave` 和 `handleSaveDialogConfirm`
3. **修复 Bug 3** — 移除 WorkflowView 本地 `activeWorkflowId` 状态，改用全局 store
4. **修复 Bug 4** — 在 WorkflowView 中添加 useEffect 监听全局 `activeWorkflowId` 变化并自动加载
5. **修复 Bug 5** — 修改错误节点处理逻辑，将下游节点标记为 skipped 并记录日志

### 第二阶段：修复 P1 中等 Bug

6. **修复 Bug 6** — 在 `voidBranch` 中为 voided 节点生成 skipped 日志
7. **修复 Bug 7** — 验证添加"恰好一个 start 节点"检查，addNode 添加限制
8. **修复 Bug 8** — handleTemplate 中重置 activeWorkflowId 和 isDirty
9. **修复 Bug 9** — 将 confirmDiscard 改为确认对话框
10. **修复 Bug 10** — 修改节点数量显示为 `.length`
11. **修复 Bug 11** — 在 onConnect 中添加连接验证

### 第三阶段：修复 P2 低优先级问题

12. **修复 Bug 13** — 表达式求值失败时标记为 error
13. **修复 Bug 14** — 补充 form-data/x-www-form-urlencoded 支持
14. **修复 Bug 15** — 清理 _timers 数组
15. **修复 Bug 16** — 移除未使用的 executingNodes
16. **修复 Bug 17** — 统一保存逻辑
17. **Bug 12** — 标注安全风险（长期方案另行规划）
