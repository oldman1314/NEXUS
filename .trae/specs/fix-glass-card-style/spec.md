# 玻璃卡片样式深度修复 Spec

## Why
当前 Immersive 视觉主题的"玻璃卡片"效果在浅色和深色主题下均存在严重的视觉问题：
1. **玻璃感缺失**：面板看起来像实心色块，而非半透明玻璃
2. **边框不可见**：浅色主题使用白色边框，在浅色背景上完全不可见
3. **层次感弱**：阴影过轻，无法体现卡片的"浮起"感
4. **背景对比不足**：画布背景渐变过于微妙，与卡片缺乏视觉区分
5. **深色模式暗淡**：整体过于暗沉，缺乏玻璃的高光质感
6. **样式冲突**：部分组件样式未正确应用 immersive 变量

## What Changes
- **修复玻璃背景透明度**：降低不透明度以展现真正的半透明效果
- **修复边框可见性**：使用带色调的边框替代纯白/纯透明边框
- **增强阴影层次**：提升 elevation shadow 的强度和扩散范围
- **增强画布背景对比度**：加大渐变色差，使卡片更突出
- **优化高光效果**：增加玻璃顶部高光的强度
- **修复深色模式色彩**：调整暗色下的玻璃参数以增强质感
- **统一组件样式一致性**：确保所有卡片化元素使用一致的玻璃参数

## Impact
- Affected specs: Immersive 视觉主题（CSS 变量系统）
- Affected code:
  - `src/styles/global.css` —— CSS 变量定义（核心修复）
  - `src/components/views/request-view.css` —— 请求/响应面板卡片
  - `src/components/layout/sidebar/sidebar-base.css` —— 侧边栏玻璃效果
  - `src/styles/app.css` —— 主内容区背景
  - `src/components/common/command-palette.css` —— 命令面板
  - `src/components/dialogs/dialog.css` —— 弹窗
  - `src/components/common/context-menu.css` —— 右键菜单

## 问题诊断详情

### 问题 1: 玻璃背景不透明度过高（致命）
**现状**：
- 浅色: `--glass-bg: rgba(255, 255, 255, 0.62)` → 几乎是不透明白色
- 深色: `--glass-bg: rgba(28, 28, 35, 0.68)` → 几乎是不透明深色

**后果**：backdrop-filter blur 效果被完全遮挡，看不出玻璃质感

**修复方案**：
- 浅色: 降低至 `rgba(255, 255, 255, 0.45~0.5)`
- 深色: 降低至 `rgba(28, 28, 35, 0.55~0.6)`

### 问题 2: 边框颜色不可见（严重）
**现状**：
- 浅色: `--glass-border: rgba(255, 255, 255, 0.35)` → 白色边框在白色/浅灰背景上不可见
- 深色: `--glass-border: rgba(255, 255, 255, 0.15)` → 过于微弱
- `--glass-border-subtle: rgba(255, 255, 255, 0.25)` → 同样问题
- `--glass-border-pronounced: rgba(255, 255, 255, 0.5)` → 仍然不够

**后果**：卡片没有清晰的边界轮廓，无法识别为独立卡片

**修复方案**：
- 浅色: 使用半透明灰色/蓝色调边框 `rgba(0, 0, 0, 0.08~0.12)`
- 深色: 增强至 `rgba(255, 255, 255, 0.18~0.22)`

### 问题 3: 阴影强度不足（中等）
**现状**（浅色模式）：
```
--glass-elevation-1: 0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)
--glass-elevation-2: 0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)
--glass-elevation-3: 0 16px 48px rgba(0, 0, 0, 0.10), 0 4px 16px rgba(0, 0, 0, 0.05)
```

**后果**：阴影几乎看不见，卡片看起来是"贴"在背景上而非"浮"在上面

**修复方案**：将 opacity 值提升 50%~100%

### 问题 4: 画布背景对比度不足（中等）
**现状**：
- 浅色: `#f0f0f2` → `#e4e4e8` （色差极小）
- 深色: `#0f0f1a` → `#16213e` （尚可但偏暗）

**后果**：卡片与背景几乎融为一体，无层次感

**修复方案**：
- 浅色: 使用更有层次的灰蓝调 `#e8eaed` → `#dfe3e8`
- 深色: 保持或略微提亮 `#12121e` → `#1a1a3e`

### 问题 5: 高光效果过弱（中等）
**现状**：
- 浅色: `linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 40%)`
- 深色: `linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 40%)`

**后果**：玻璃顶部的反光高光不够明显，缺少真实玻璃的光泽感

**修复方案**：增强高光的不透明度和覆盖范围

### 问题 6: Inner Shadow 参数不当（轻微）
**现状**：
- 浅色: `inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(0, 0, 0, 0.03)`
- 深色: `inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)`

**后果**：内阴影边缘线不够清晰

### 问题 7: 组件样式不一致（轻微）
部分子组件未正确继承玻璃效果：
- `.request-toolbar` 使用 `var(--bg-panel)` 而非透明背景
- `.panel-tabs` 使用 `var(--bg-panel)` 背景但在 immersive 下应透明
- `.response-header` / `.response-toolbar` 背景处理不一致

## ADDED Requirements

### Requirement: 玻璃透明度重构
系统 SHALL 调整 immersive 模式下玻璃背景的透明度参数，确保 backdrop-filter blur 效果可见。

#### Scenario: 浅色模式玻璃透明度
- **WHEN** `data-visual-style="immersive"` 且 `data-theme="light"`
- **THEN** `--glass-bg` 不透明度 ≤ 0.5，能够透过面板看到背景模糊效果

#### Scenario: 深色模式玻璃透明度
- **WHEN** `data-visual-style="immersive"` 且 `data-theme="dark"`
- **THEN** `--glass-bg` 不透明度 ≤ 0.62，保持一定的可读性同时展现玻璃效果

### Requirement: 边框可见性保障
系统 SHALL 确保玻璃卡片的边框在两种主题下均清晰可见。

#### Scenario: 浅色模式边框
- **WHEN** immersive 亮色模式激活
- **THEN** `--glass-border` 使用深色调（rgba(0,0,0,x)），在浅色背景上形成清晰轮廓

#### Scenario: 深色模式边框
- **WHEN** immersive 暗色模式激活
- **THEN** `--glass-border` 不透明度 ≥ 0.18，形成可见的边缘定义

### Requirement: 阴影层次增强
系统 SHALL 提升 immersive 模式下卡片的投影强度，营造浮起的空间感。

#### Scenario: 卡片浮起效果
- **WHEN** immersive 模式激活
- **THEN** 面板卡片具有清晰可见的 box-shadow，产生从背景"浮起"的视觉效果

### Requirement: 背景对比度优化
系统 SHALL 增强主内容区背景与卡片之间的视觉对比度。

#### Scenario: 浅色背景层次
- **WHEN** immersive 亮色模式激活
- **THEN** `--bg-canvas` 与 `--bg-canvas-end` 具有明显的色相/亮度差异（ΔE ≥ 8）

#### Scenario: 深色背景层次
- **WHEN** immersive 暗色模式激活
- **THEN** 背景渐变具有足够的深度感，卡片在其上清晰可辨

### Requirement: 玻璃高光增强
系统 SHALL 增强玻璃卡片顶部的高光反射效果。

#### Scenario: 高光可见性
- **WHEN** immersive 模式激活
- **THEN** `--glass-highlight` 渐变在卡片顶部形成可见的光泽带

### Requirement: 子组件样式统一
系统 SHALL 确保 immersive 模式下所有子组件正确继承玻璃效果。

#### Scenario: 工具栏透明化
- **WHEN** immersive 模式激活
- **THEN** `.request-toolbar`、`.panel-tabs`、`.response-header` 等子区域背景透明或使用玻璃变量

## MODIFIED Requirements

### Requirement: Immersive CSS Variables（来自原 spec）
修改全局 CSS 变量的 immersive 覆盖值，解决上述诊断的所有问题。

#### Scenario: 浅色变量修正
- **WHEN** `data-visual-style="immersive"`
- **THEN** 所有玻璃相关变量的值经过重新校准，确保视觉效果协调一致

#### Scenario: 深色变量修正
- **WHEN** `data-visual-style="immersive"][data-theme="dark"]`
- **THEN** 所有玻璃相关变量的值针对深色背景优化，避免过度暗淡
