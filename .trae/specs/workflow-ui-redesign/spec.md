# Workflow UI 重构与体验优化 Spec

## Why
当前 Workflow 编辑器虽然具备基础的节点编排和执行能力，但存在大量 UX 问题：使用浏览器原生 `prompt()` 保存、节点面板不支持拖拽、API 节点缺少 Headers/Params 编辑器、Transform 节点无语法高亮、侧边栏与编辑器未打通、缺少引导和模板等。这些问题严重影响了工作流功能的可用性和专业感。

## What Changes
- 替换 `prompt()` 为内联保存对话框，统一设计语言
- 节点面板支持拖拽添加节点到画布指定位置
- API 节点配置面板补充 Headers 和 Params 编辑器
- Transform 节点使用代码编辑器替代纯文本域
- 侧边栏 Workflow 列表与编辑器双向联动（点击导航、同步选中状态）
- 画布空状态引导与工作流模板
- 节点添加时智能定位（基于当前视口中心，而非随机位置）
- 执行时边线流动动画，增强数据流感知
- 日志面板支持拖拽调整高度
- 键盘快捷键支持（Delete 删除节点、Ctrl+Z 撤销、Ctrl+S 保存）
- 条件节点 Handle 优化（更直观的 True/False 分支标识）
- 工作流描述编辑支持

## Impact
- Affected specs: workflow 编辑器核心交互流程
- Affected code:
  - `src/components/views/WorkflowView.tsx` - 主视图重构
  - `src/components/views/workflow-view.css` - 样式更新
  - `src/components/workflow/NodeConfigPanel.tsx` - 配置面板增强
  - `src/components/workflow/workflow-nodes.css` - 节点样式优化
  - `src/components/workflow/ConditionNode.tsx` - 条件节点 Handle 优化
  - `src/components/workflow/WorkflowLogs.tsx` - 日志面板可调整高度
  - `src/components/layout/sidebar/SidebarWorkflows.tsx` - 侧边栏联动
  - `src/stores/useAppStore.ts` - 新增 activeWorkflowId 状态

## ADDED Requirements

### Requirement: 内联保存对话框
系统 SHALL 提供内联保存对话框替代浏览器原生 `prompt()`，包含工作流名称输入框和描述输入框。

#### Scenario: 保存新工作流
- **WHEN** 用户点击 Save 按钮
- **THEN** 显示内联保存对话框，包含名称和描述输入框，预填当前工作流名

#### Scenario: 更新已有工作流
- **WHEN** 用户在已加载的工作流中点击 Save
- **THEN** 直接更新当前工作流，不弹出对话框；若需另存为则显示对话框

### Requirement: 拖拽添加节点
系统 SHALL 支持从节点面板拖拽节点到画布指定位置添加。

#### Scenario: 拖拽节点到画布
- **WHEN** 用户从节点面板拖拽一个节点类型到画布
- **THEN** 节点在鼠标释放位置创建，带入场动画

#### Scenario: 点击添加节点（兼容）
- **WHEN** 用户点击节点面板中的节点类型
- **THEN** 节点在当前视口中心位置创建（智能定位，非随机位置）

### Requirement: API 节点 Headers/Params 编辑器
系统 SHALL 在 API 节点配置面板中提供 Headers 和 Params 的键值对编辑器。

#### Scenario: 编辑 Headers
- **WHEN** 用户选中 API 节点并打开配置面板
- **THEN** 显示 Headers 键值对编辑器，支持启用/禁用、添加、删除行

#### Scenario: 编辑 Params
- **WHEN** 用户选中 API 节点并打开配置面板
- **THEN** 显示 Params 键值对编辑器，支持启用/禁用、添加、删除行

### Requirement: Transform 节点代码编辑器
系统 SHALL 为 Transform 节点提供带语法高亮的代码编辑器替代纯文本域。

#### Scenario: 编辑 Transform 脚本
- **WHEN** 用户选中 Transform 节点并打开配置面板
- **THEN** 显示带 JavaScript 语法高亮的代码编辑器

### Requirement: 侧边栏与编辑器联动
系统 SHALL 实现侧边栏 Workflow 列表与编辑器的双向联动。

#### Scenario: 从侧边栏打开工作流
- **WHEN** 用户在侧边栏点击某个工作流
- **THEN** 自动切换到 Workflow 视图并加载该工作流

#### Scenario: 编辑器中加载的工作流在侧边栏高亮
- **WHEN** 用户在编辑器中加载某个工作流
- **THEN** 侧边栏中对应的工作流项显示为选中状态

### Requirement: 画布空状态引导
系统 SHALL 在画布为空时显示引导信息和快速操作入口。

#### Scenario: 空画布引导
- **WHEN** 工作流画布为空（无节点）
- **THEN** 显示引导文案和快速添加 Start 节点的按钮

### Requirement: 工作流模板
系统 SHALL 提供预置的工作流模板供用户快速创建。

#### Scenario: 从模板创建工作流
- **WHEN** 用户在空状态引导中点击模板
- **THEN** 基于模板创建包含预设节点和连线的完整工作流

### Requirement: 执行时边线流动动画
系统 SHALL 在工作流执行时为正在执行的边线添加流动动画效果。

#### Scenario: 节点执行中边线动画
- **WHEN** 工作流正在执行，某节点正在运行
- **THEN** 该节点的入边显示流动动画，表示数据正在传输

### Requirement: 日志面板可调整高度
系统 SHALL 支持通过拖拽调整日志面板的高度。

#### Scenario: 拖拽调整日志面板高度
- **WHEN** 用户拖拽日志面板顶部分隔线
- **THEN** 日志面板高度随鼠标移动实时调整，有最小/最大高度限制

### Requirement: 键盘快捷键
系统 SHALL 支持常用键盘快捷键操作。

#### Scenario: Delete 删除选中节点
- **WHEN** 用户选中节点后按 Delete 或 Backspace 键
- **THEN** 删除选中的节点及其关联连线

#### Scenario: Ctrl+S 保存工作流
- **WHEN** 用户按 Ctrl+S
- **THEN** 触发保存操作（同点击 Save 按钮）

### Requirement: 条件节点 Handle 优化
系统 SHALL 优化条件节点的 True/False 分支 Handle 的视觉标识。

#### Scenario: 条件分支直观标识
- **WHEN** 用户查看条件节点
- **THEN** True/False Handle 有明确的颜色区分（绿色/红色）和标签，Handle 位置更直观

## MODIFIED Requirements

### Requirement: 节点智能定位
节点添加时 SHALL 基于当前视口中心位置计算放置点，而非随机位置。多个连续添加的节点自动偏移避免重叠。

### Requirement: 工作流描述编辑
工作流 SHALL 支持在配置中编辑描述信息，描述显示在侧边栏列表项中。
