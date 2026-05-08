# Workflow 页面逻辑 Bug 修复与优化 Spec

## Why
Workflow 页面存在多个严重的逻辑 Bug（Transform/Output 节点输入数据始终为 undefined、`{{prev}}` 模板变量未实现、多输入节点执行顺序错误等），导致工作流执行引擎无法正确运行，同时缺少关键的用户体验保障（无未保存提示、保存始终弹窗、无图验证等）。

## What Changes
- 修复 Transform 节点使用自身 ID 获取输入数据的 Bug，改为获取上游节点输出
- 修复 Output 节点使用自身 ID 获取数据的 Bug，改为获取上游节点输出
- 实现 `{{prev}}` 模板变量解析，引用直接上游节点的输出
- 修复 BFS 执行引擎在多输入节点场景下的执行顺序问题，改用拓扑排序 + 入度计数
- 修复保存工作流时始终弹出命名对话框的问题，已有工作流更新时不再弹窗
- 修复节点 ID 使用 `Date.now()` 可能产生碰撞的问题，改用 `crypto.randomUUID()`
- 修复加载工作流时不清除日志和节点状态的问题
- 修复 Start 节点允许接收输入连线的问题
- 添加运行前工作流图验证（缺少 Start 节点、孤立节点、循环检测）
- 添加未保存变更检测与离开提示

## Impact
- Affected specs: workflow 执行引擎核心逻辑、WorkflowView 状态管理
- Affected code:
  - `src/utils/workflow-engine.ts` — 执行引擎核心逻辑重写
  - `src/components/views/WorkflowView.tsx` — 保存逻辑、验证逻辑、状态管理
  - `src/components/workflow/StartNode.tsx` — 移除不可见的 target Handle
  - `src/components/workflow/ConditionNode.tsx` — 无变更
  - `src/types/index.ts` — 可能扩展 WorkflowNode 类型

## ADDED Requirements

### Requirement: 上游节点输出传递
执行引擎 SHALL 正确地将上游节点的输出传递给下游节点。Transform 节点和 Output 节点 SHALL 获取其直接上游节点的输出数据作为输入，而非使用自身节点 ID 查找。

#### Scenario: Transform 节点获取上游输出
- **WHEN** 工作流执行到 Transform 节点
- **THEN** Transform 节点的 `input` 参数为直接上游节点的输出数据

#### Scenario: Output 节点获取上游输出
- **WHEN** 工作流执行到 Output 节点
- **THEN** Output 节点的 `data` 字段为直接上游节点的输出数据

### Requirement: `{{prev}}` 模板变量解析
系统 SHALL 支持 `{{prev}}` 模板变量，引用当前节点的直接上游节点的输出。`{{prev.status}}` 应解析为上游节点输出的 `status` 字段。

#### Scenario: 条件节点使用 prev 变量
- **WHEN** 用户在 Condition 节点表达式中使用 `{{prev.status}} === 200`
- **AND** 上游 API 节点返回 `{ status: 200, ok: true, body: ... }`
- **THEN** 表达式解析为 `200 === 200`，结果为 `true`

### Requirement: 拓扑排序执行引擎
执行引擎 SHALL 使用拓扑排序 + 入度计数方式执行节点，确保拥有多个输入的节点在所有上游节点完成后才执行。

#### Scenario: 多输入节点等待所有上游完成
- **WHEN** 节点 C 有两条入边（A→C, B→C）
- **THEN** C 仅在 A 和 B 都执行完毕后才执行

### Requirement: 智能保存工作流
保存工作流时，若当前已关联已保存的工作流（`activeWorkflowId` 存在），SHALL 直接更新而不弹出命名对话框。仅新建工作流时弹出命名对话框。

#### Scenario: 更新已有工作流
- **WHEN** 用户点击 Save 且 `activeWorkflowId` 存在
- **THEN** 直接更新工作流数据，不弹出 prompt

#### Scenario: 保存新工作流
- **WHEN** 用户点击 Save 且 `activeWorkflowId` 为 null
- **THEN** 弹出命名对话框，输入名称后创建新工作流

### Requirement: 节点 ID 唯一性保证
添加节点时 SHALL 使用 `crypto.randomUUID()` 生成唯一 ID，而非 `${type}_${Date.now()}`。

#### Scenario: 快速连续添加节点
- **WHEN** 用户在极短时间内连续添加两个同类型节点
- **THEN** 两个节点的 ID 仍然不同

### Requirement: 加载工作流时清除状态
加载新工作流时 SHALL 清除日志、节点执行状态等上一工作流的残留状态。

#### Scenario: 从有执行日志的工作流切换到另一个工作流
- **WHEN** 用户加载另一个已保存的工作流
- **THEN** 日志列表清空，节点执行状态重置

### Requirement: Start 节点禁止输入连线
Start 节点 SHALL 不展示 target Handle，阻止用户创建指向 Start 节点的连线。

#### Scenario: 用户尝试连接到 Start 节点
- **WHEN** 用户拖拽连线到 Start 节点
- **THEN** 连线无法创建

### Requirement: 运行前工作流图验证
运行工作流前 SHALL 验证图的合法性，包括：必须存在 Start 节点、检测循环依赖、检测孤立节点（与主图断开的节点）。

#### Scenario: 缺少 Start 节点
- **WHEN** 用户点击 Run 但图中没有 Start 节点
- **THEN** 显示错误提示 "Workflow must have a start node"，不执行

#### Scenario: 存在循环依赖
- **WHEN** 用户点击 Run 但图中存在循环（A→B→C→A）
- **THEN** 显示错误提示 "Workflow contains a cycle"，不执行

#### Scenario: 存在孤立节点
- **WHEN** 用户点击 Run 但图中存在与主图断开的节点
- **THEN** 显示警告提示，但仍可执行（孤立节点将被跳过）

### Requirement: 未保存变更检测
当工作流有未保存的变更时，用户执行可能丢失数据的操作（新建、加载其他工作流）SHALL 弹出确认对话框。

#### Scenario: 有未保存变更时新建工作流
- **WHEN** 用户修改了当前工作流后点击 New
- **THEN** 弹出确认对话框 "You have unsaved changes. Discard?"

#### Scenario: 有未保存变更时加载其他工作流
- **WHEN** 用户修改了当前工作流后点击加载另一个已保存工作流
- **THEN** 弹出确认对话框 "You have unsaved changes. Discard?"

## MODIFIED Requirements

### Requirement: 工作流执行引擎
执行引擎 SHALL 使用拓扑排序方式遍历节点，维护每个节点的入度计数，仅当节点的所有上游节点执行完毕后才执行该节点。每个节点执行时，引擎 SHALL 提供其直接上游节点的输出作为 `prevOutput`，同时所有已执行节点的输出仍可通过 `{{node_id.field}}` 引用。
