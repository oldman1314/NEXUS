# Tasks

- [x] Task 1: 重写执行引擎核心逻辑 — 修复 Transform/Output 节点输入数据 Bug + 拓扑排序
  - [x] SubTask 1.1: 重写 `executeWorkflow` 函数，使用拓扑排序 + 入度计数替代简单 BFS
  - [x] SubTask 1.2: 为每个节点维护 `prevOutput`（直接上游节点输出），修复 Transform 节点 `input` 始终为 undefined 的 Bug
  - [x] SubTask 1.3: 修复 Output 节点使用自身 ID 查找数据的 Bug，改为使用 `prevOutput`
  - [x] SubTask 1.4: 实现 `{{prev}}` 模板变量解析，在 `resolveValue` 中支持 `prev` 关键字引用直接上游输出
  - [x] SubTask 1.5: 在 `WorkflowContext` 中增加 `prevOutputs: Record<string, unknown>` 字段，存储每个节点的直接上游输出

- [x] Task 2: 修复 WorkflowView 状态管理 Bug
  - [x] SubTask 2.1: 修复 `addNode` 中 `Date.now()` ID 碰撞问题，改用 `crypto.randomUUID()`
  - [x] SubTask 2.2: 修复 `handleSaveWorkflow` 始终弹窗问题，已有工作流直接更新
  - [x] SubTask 2.3: 修复 `handleLoadWorkflow` 不清除日志和节点状态的问题
  - [x] SubTask 2.4: 添加 `isDirty` 状态追踪，节点/边变更时标记为脏
  - [x] SubTask 2.5: 在 `handleNewWorkflow` 和 `handleLoadWorkflow` 中添加未保存变更确认对话框

- [x] Task 3: 修复 StartNode 允许输入连线的问题
  - [x] SubTask 3.1: 移除 StartNode 中 `opacity: 0` 的 target Handle

- [x] Task 4: 添加运行前工作流图验证
  - [x] SubTask 4.1: 实现循环检测函数 `detectCycle`
  - [x] SubTask 4.2: 实现孤立节点检测函数 `findOrphanNodes`
  - [x] SubTask 4.3: 在 `handleRun` 中调用验证，缺少 Start 节点或存在循环时阻止执行并显示错误提示
  - [x] SubTask 4.4: 存在孤立节点时显示警告但允许执行

# Task Dependencies
- [Task 2] depends on [Task 1] (执行引擎修复后才能正确验证状态管理)
- [Task 4] depends on [Task 1] (验证逻辑依赖新的执行引擎结构)
- [Task 3] 无依赖，可并行
