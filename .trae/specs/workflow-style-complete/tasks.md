# Tasks

- [x] Task 1: 为 `.wf-node` 添加完整基础样式
  - [x] 在 `workflow-nodes.css` 的 `.wf-node` 规则中添加：`background: var(--bg-panel); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); color: var(--text-primary); font-size: var(--text-sm); font-weight: 500;`
  - [x] 确保与 `.reactflow-wrapper .react-flow__node` 不冲突（ReactFlow 包装层保留 min-width + transition，移除重复的 background/border/shadow/color）

- [x] Task 2: 为各节点类型添加左侧指示条和类型色调
  - [x] 方案选择：使用 `border-left: 3px solid <color>` （无需修改 TSX），通过 `.wf-node.wf-node-start` 等选择器实现
  - [x] 定义 5 种类型的样式：3px 宽左侧指示条 + hover 时极淡背景渐变
  - [x] 颜色映射：Start=success(green) / API=accent(blue) / Condition=warning(orange) / Transform=#a855f7(purple) / Output=#6366f1(indigo)

- [x] Task 3: Config Panel 视觉微调
  - [x] `.config-section label` 添加 `display: block; margin-bottom: 6px;`
  - [x] `.config-section input:focus` / `select:focus` / `textarea:focus` 已有 accent 边框 + input-focus-ring
  - [x] `.config-header` 已有底部细边框分隔线

- [x] Task 4: NodeKVEditor 行交互优化
  - [x] 为 `.node-kv-row` 添加 `transition: background-color` + `border-radius`
  - [x] 添加 `.node-kv-row:hover { background: var(--bg-hover); }`
  - [x] 删除按钮已有 hover 变红效果

- [x] Task 5: ScriptEditor 容器优化
  - [x] `.editor-line-count` 背景为 `var(--bg-tertiary)` ✓
  - [x] textarea 有等宽字体 `var(--font-mono)` 和合适行高 ✓

- [x] Task 6: 验证亮暗主题一致性 + 构建验证
  - [x] 所有 CSS 变量引用在亮色/暗色模式下均有合理值（--bg-panel, --border-color, --shadow-sm, --text-primary, --success, --accent, --warning, --bg-hover, --bg-tertiary 均在两种主题下定义）
  - [x] `vite build` 构建成功通过

# Task Dependencies
- [Task 2] depends on [Task 1] (指示条需要 wf-node 有 position: relative)
- [Task 3] 独立
- [Task 4] 独立
- [Task 5] 独立
- [Task 6] depends on [Task 1, Task 2]
