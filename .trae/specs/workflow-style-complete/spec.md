# Workflow 节点与面板样式补全 Spec

## Why
截图显示 Workflow 编辑器的节点和配置面板存在严重的样式缺失问题：
- `.wf-node` 基础样式只有 `padding`/`min-width`，完全没有背景、边框、阴影、文字颜色等视觉属性
- 节点的外观完全依赖 ReactFlow 的外层包装选择器和 `[data-visual-style="immersive"]` 条件选择器，导致**非沉浸式模式下节点显示为纯白方块**
- 各节点类型之间缺乏视觉差异化（仅有图标颜色不同，无左侧类型指示条、无类型特有配色）
- Config Panel 的表单区域缺少分组感，输入框之间没有视觉呼吸空间
- 整体看起来像一个未完成的原型而非 polished 产品

## What Changes
- 为 `.wf-node` 添加完整的**默认模式基础样式**（背景、边框、圆角、阴影、字体颜色），确保不依赖 immersive 模式也能正常显示
- 为每种节点类型添加**左侧 3px 类型指示条**（Start=绿 / API=蓝 / Condition=橙 / Transform=紫 / Output=靛蓝），一眼识别节点类型
- 为每种节点类型添加**微妙的类型特有背景色调**（通过极淡的 type-color 背景）
- 优化 Config Panel：添加 label 与输入框之间的间距优化、section 分隔线、聚焦态增强
- 优化 NodeKVEditor 行样式：添加行间 hover 高亮、更紧凑的间距
- 优化 ScriptEditor 容器：添加微妙的代码编辑器氛围（等宽字体确认、行号区域优化）
- 确保所有样式在亮色/暗色主题下均表现良好

## Impact
- Affected code:
  - `src/components/workflow/workflow-nodes.css` — 主要修改文件
  - `src/components/workflow/StartNode.tsx` — 可能需调整结构以支持左侧指示条
  - `src/components/workflow/ApiNode.tsx` — 同上
  - `src/components/workflow/ConditionNode.tsx` — 同上
  - `src/components/workflow/TransformNode.tsx` — 同上
  - `src/components/workflow/OutputNode.tsx` — 同上
  - `src/components/workflow/NodeConfigPanel.tsx` — 微调

## ADDED Requirements

### Requirement: wf-node 完整基础样式
系统 SHALL 为 `.wf-node` 提供完整的基础视觉样式，包括：
- `background: var(--bg-panel)` 面板背景色
- `border: 1px solid var(--border-color)` 边框
- `border-radius: var(--radius-lg)` 圆角
- `box-shadow: var(--shadow-sm)` 基础阴影
- `color: var(--text-primary)` 文字颜色
- `font-size: var(--text-sm); font-weight: 500;` 字体

#### Scenario: 默认模式下的节点外观
- **WHEN** 用户在非沉浸式模式下查看 Workflow 画布
- **THEN** 所有节点具有面板级背景色、边框、圆角和轻微阴影，不再是纯白方块

#### Scenario: 沉浸式模式下的节点外观
- **WHEN** 用户切换到沉浸式视觉风格
- **THEN** 节点应用 glass morphism 样式（已有实现不受影响）

### Requirement: 节点类型左侧指示条
系统 SHALL 为每种节点类型渲染一个 3px 宽的左侧彩色指示条：

| 节点类型 | 指示条颜色 | CSS 变量 |
|---------|-----------|----------|
| Start | 绿色 | `var(--success)` |
| API Request | 蓝色 | `var(--accent)` |
| Condition | 橙色 | `var(--warning)` |
| Transform | 紫色 | `var(--node-transform)` |
| Output | 靛蓝 | `var(--node-output)` |

#### Scenario: 节点类型快速识别
- **WHEN** 用户查看画布上的任意节点
- **THEN** 节点左侧有 3px 彩色竖条，立即标识该节点的类型

### Requirement: 节点类型特有背景色调
系统 SHALL 为每种节点类型添加极淡的左侧渐变背景（从类型色 3% 透明度到透明）：

#### Scenario: 节点视觉层次
- **WHEN** 用户查看多个不同类型的节点
- **THEN** 每种类型的节点有微妙的色彩倾向，增强可区分性

### Requirement: Config Panel 视觉优化
系统 SHALL 优化 NodeConfigPanel 的视觉呈现：
- label 与输入框之间增加合理间距（gap: 8px → 保持现有但确保一致）
- 输入框 focus 态增加微妙的发光效果
- config-section 之间保持 16px gap（已有）
- Header 区域增加底部边框分隔（已有）

#### Scenario: 配置面板易读性
- **WHEN** 用户打开任意节点的配置面板
- **THEN** 表单字段分组清晰，label 可读性强，输入框 focus 态明确

### Requirement: NodeKVEditor 行交互优化
系统 SHALL 优化 KV 编辑器行的视觉效果：
- 行 hover 时添加极淡的背景高亮 `var(--bg-hover)`
- 删除按钮 hover 时有明确的红色反馈（已有）
- Add 按钮有清晰的虚线边框（已有）

### Requirement: ScriptEditor 容器优化
系统 SHALL 优化 Transform 节点的脚本编辑器容器：
- 确保行号区域背景为 `var(--bg-tertiary)`
- textarea 区域背景为透明或 `var(--bg-input)`
- 编辑器容器有明确的边框和圆角（已有）

## MODIFIED Requirements

### Requirement: .wf-node 基础样式
将 `.wf-node` 从仅包含布局属性扩展为包含完整视觉属性的组件基础样式。

### Requirement: ReactFlow 节点包装样式
`.reactflow-wrapper .react-flow__node` 中已定义的部分样式（background/border/shadow）现在由 `.wf-node` 自身承担，避免重复。ReactFlow 包装层仅保留 min-width 和过渡动画。

### Requirement: immersive 模式节点样式
`[data-visual-style="immersive"] .wf-node` 的 glass morphism 样式保持不变，作为默认样式的增强覆盖。
