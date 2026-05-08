# 浅色主题玻璃卡片样式问题修复 Spec

## Why
从截图可见，浅色主题下存在以下严重视觉问题：
1. **侧边栏没有玻璃卡片效果**：看起来像实色灰色块，与主内容区缺乏层次感
2. **响应面板内层仍有实色层**：编辑器区域、行号区域等仍显示为不透明白色/灰色方块
3. **内部元素悬停/选中状态不透明**：hover 和 active 状态使用实色覆盖，破坏玻璃质感
4. **边框和分隔线不协调**：内部边框颜色与玻璃风格不匹配
5. **整体缺乏"玻璃"的通透感**：各区域之间没有明显的半透明层次区分

## What Changes
- **侧边栏全面玻璃化**：覆盖所有子元素的 hover/active 状态为半透明
- **响应面板内层完全透明化**：编辑器、行号、输入框等全部使用玻璃变量
- **统一边框风格**：内部边框使用 glass-border 系列变量
- **增强玻璃对比度**：调整背景参数使玻璃效果更明显

## Impact
- Affected code:
  - `src/styles/global.css` —— CSS 变量补充（hover/active 变量）
  - `src/components/layout/sidebar/sidebar-base.css` —— sidebar 子元素覆盖
  - `src/components/layout/sidebar/sidebar-collections.css` —— collection item 覆盖
  - `src/components/layout/sidebar/sidebar-history.css` —— history section 覆盖
  - `src/components/layout/sidebar/sidebar-footer.css` —— footer 覆盖
  - `src/components/layout/sidebar/sidebar-nav.css` —— nav item 覆盖
  - `src/components/views/request-view.css` —— 响应面板内部元素覆盖
  - `src/components/tabs/body-tab.css` —— body editor 覆盖
  - `src/components/tabs/script-tab.css` —— script editor 覆盖

## 问题诊断详情

### 问题 1：侧边栏 hover/active 状态不透明

**现状**：
- `.collection-header:hover` → `background: var(--bg-hover)` = `rgba(0,0,0,0.04)` → 深色实色覆盖在玻璃上
- `.collection-header.selected` → `background: var(--bg-active)` = `rgba(0,122,255,0.1)` → 蓝色实色覆盖
- `.request-item:hover` → `background: var(--bg-hover)` → 同上
- `.request-item.selected` → `background: var(--bg-active)` → 同上
- `.nav-item:hover` → `background: var(--bg-hover)` → 同上
- `.sidebar-toggle-btn:hover` → `background: var(--bg-hover)` → 同上
- `.section-header:hover` (history) → `background: var(--bg-hover)` → 同上

**后果**：鼠标悬停或选中时，这些区域变成不透明的深色/蓝色块，完全遮挡背后的玻璃效果

### 问题 2：响应面板内层仍有实色

**现状**：
- `.body-editor-wrapper` → `background: var(--bg-input)` = `rgba(255,255,255,0.55)` → 虽然半透明但可能仍偏白
- `.body-line-numbers` → `background: var(--bg-tertiary)` = `rgba(255,255,255,0.12)` → 同上
- 但 request-view.css 中仍有大量元素使用 `--bg-panel` 或 `--bg-input` 的默认样式，未添加 immersive 覆盖

**后果**：编辑器区域看起来仍是白色方块，与玻璃卡片外层不协调

### 问题 3：边框颜色不协调

**现状**：
- 内部边框仍使用 `var(--border-light)` = `rgba(0,0,0,0.08)`（已覆盖）但部分组件使用 `var(--border-color)` 未覆盖
- `--border-color` 在亮色模式下为 `#d1d1d6`（不透明）

**后果**：边框看起来是实线而非玻璃风格的微妙分隔

### 问题 4：玻璃背景与内容对比度不足

**现状**：
- `--glass-bg: rgba(255,255,255,0.38)` 在浅色 `#dde1e8` 背景上，差异不够明显
- `--bg-input: rgba(255,255,255,0.55)` 仍然偏白

**后果**：整体看起来仍是"白色块叠白色块"，没有玻璃的通透感

## ADDED Requirements

### Requirement: 侧边栏子元素玻璃化
系统 SHALL 在 immersive 模式下使侧边栏所有子元素的 hover/active 状态保持半透明。

#### Scenario: Collection item hover
- **WHEN** 鼠标悬停在 collection/request item 上
- **THEN** hover 背景为半透明而非实色

#### Scenario: Collection item selected
- **WHEN** item 被选中
- **THEN** selected 背景为半透明高亮而非实色蓝色

#### Scenario: Nav item hover
- **WHEN** 鼠标悬停在 nav item 上
- **THEN** hover 背景为半透明

### Requirement: 响应面板内层完全透明化
系统 SHALL 在 immersive 模式下使响应面板内所有区域呈现透明/半透明效果。

#### Scenario: Body editor 区域
- **WHEN** immersive 模式激活
- **THEN** body-editor-wrapper 和 body-line-numbers 背景完全透明或使用 glass 变量

#### Scenario: Headers/Params 表格区域
- **WHEN** immersive 模式激活
- **THEN** 表格行背景透明，边框使用 glass-border

### Requirement: 边框风格统一
系统 SHALL 在 immersive 模式下统一所有内部边框为 glass 风格。

#### Scenario: 内部边框
- **WHEN** immersive 模式激活
- **THEN** 所有 `border-color: var(--border-color)` 变为 `var(--glass-border-subtle)` 或透明

## MODIFIED Requirements

### Requirement: 浅色模式 CSS 变量调整
修改 `[data-visual-style="immersive"]` 下的变量值，增强玻璃对比度。

#### Scenario: 玻璃背景对比度
- **WHEN** 浅色 immersive 模式
- **THEN** `--glass-bg` 不透明度适当降低，`--bg-input` 降低，`--bg-canvas` 与 `--glass-bg` 色差增大
