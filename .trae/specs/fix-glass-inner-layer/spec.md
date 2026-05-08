# 玻璃卡片内层穿透修复 Spec

## Why
用户反馈两个具体问题：
1. **侧边栏没有玻璃卡片样式**：虽然 `.sidebar` 容器已设置 glass 效果，但 `--bg-sidebar` 变量在 immersive 模式下未被覆盖，导致 fallback 路径和部分子元素仍为不透明实色
2. **响应栏内侧有 classic 层**：`.response-panel` 外层是玻璃卡片，但内部内容区域（编辑器、行号、输入框等）使用 `--bg-input`/`--bg-tertiary` 变量，这些变量在 immersive 下未覆盖，仍为实色（`#ffffff`/`#e8e8ed`），造成"外层玻璃+内层 classic"的割裂感

## What Changes
- **覆盖 `--bg-sidebar` 变量**：让侧边栏所有引用此变量的元素变为半透明
- **覆盖 `--bg-input` 变量**：让所有输入框/编辑器区域变为半透明玻璃效果
- **覆盖 `--bg-tertiary` 变量**：让行号区域等辅助区域变为半透明
- **覆盖 `--border-light` 变量**：让内部边框与玻璃风格协调

## Impact
- Affected code: `src/styles/global.css`（CSS 变量定义）
- Affected components: 侧边栏全局、请求面板内所有输入区、响应面板内编辑器/行号

## 问题诊断详情

### 问题 A：侧边栏无玻璃感

**根因**：`--bg-sidebar` 在 immersive 模式下**完全未覆盖**

| 位置 | 当前值 | 问题 |
|------|--------|------|
| `:root --bg-sidebar` | `#f5f5f7`（亮）/ `#1c1c1e`（暗） | 不透明实色 |
| immersive 覆盖 | **不存在** ❌ | 未覆盖 |

**后果**：
- `@supports not (backdrop-filter)` fallback 中 `.sidebar` 使用 `var(--bg-sidebar)` → 回退到不透明
- `sidebar-footer` 基础样式的 `background: var(--bg-sidebar)` 虽然有 immersive 覆盖为 transparent，但如果 CSS 加载顺序或优先级有问题则可能不生效
- 其他可能引用 `--bg-sidebar` 的地方均得不到半透明值

### 问题 B：响应面板内层是 classic

**根因**：`--bg-input` 和 `--bg-tertiary` 在 immersive 模式下**完全未覆盖**

| 元素 | 使用的变量 | 当前值（亮色） | immersive 覆盖 |
|------|-----------|---------------|--------------|
| `.body-editor-wrapper` | `--bg-input` | `#ffffff` | 无 ❌ |
| `.body-line-numbers` | `--bg-tertiary` | `#e8e8ed` | 无 ❌ |
| `.url-input` | `--bg-input` | `#ffffff` | 无 ❌ |
| params key/value 输入框 | `--bg-input` | `#ffffff` | 无 ❌ |
| headers key/value 输入框 | `--bg-input` | `#ffffff` | 无 ❌ |
| script editor 区域 | `--bg-input` | `#ffffff` | 无 ❌ |

**视觉效果**：外层 `.response-panel` 是 38% 白色的半透明玻璃，但内部编辑器是 100% 不透明白色 → 用户看到的是"白色方块嵌在半透明卡片里"

### 问题 C：`--border-light` 未覆盖

**当前值**：亮色 `#e8e8ed` / 暗色 `#48484a`
**问题**：内部边框颜色与玻璃风格不协调，看起来像 classic 边框

## ADDED Requirements

### Requirement: Immersive 背景变量完整覆盖
系统 SHALL 在 immersive 模式下覆盖所有影响视觉层次感的背景变量。

#### Scenario: 浅色模式背景变量覆盖
- **WHEN** `data-visual-style="immersive"` 激活
- **THEN** `--bg-sidebar`, `--bg-input`, `--bg-tertiary`, `--border-light` 均被覆盖为半透明/协调值

#### Scenario: 深色模式背景变量覆盖
- **WHEN** `data-visual-style="immersive"][data-theme="dark"]` 激活
- **THEN** 以上变量均被覆盖为深色模式下的半透明/协调值

### Requirement: 响应面板内层玻璃化
系统 SHALL 使响应面板内的编辑器、行号、输入框等区域呈现半透明玻璃效果。

#### Scenario: 编辑器区域玻璃化
- **WHEN** immersive 模式激活
- **THEN** `.body-editor-wrapper` 背景为半透明，不再是不透明白色

#### Scenario: 行号区域玻璃化
- **WHEN** immersive 模式激活
- **THEN** `.body-line-numbers` 背景为半透明

### Requirement: 侧边栏完整玻璃化
系统 SHALL 使侧边栏整体呈现统一的玻璃效果。

#### Scenario: 侧边栏 fallback 正确
- **WHEN** immersive 模式 + backdrop-filter 不支持
- **THEN** sidebar fallback 使用半透明的 `--bg-sidebar` 值
