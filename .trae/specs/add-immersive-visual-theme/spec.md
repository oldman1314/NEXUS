# Immersive 视觉主题 Spec

## Why
当前 UI 采用 Apple HIG 标准配色 + 扁平色块布局，与无数 SaaS 产品视觉同质化，缺乏记忆点和情绪吸引力。需要提供一种可选的"沉浸"视觉风格，通过玻璃质感、氛围背景、情绪化色彩、微交互和签名时刻，让 API Studio 从"又一个 API 工具"变成"让人愿意打开的工具"。

## What Changes
- 新增 `VisualStyle` 类型（`'classic' | 'immersive'`），与现有 `ThemeMode` 解耦
- 扩展 `useThemeStore`，新增 `visualStyle` 状态和 `setVisualStyle` 方法
- 在 `<html>` 上设置 `data-visual-style` 属性驱动 CSS 切换
- 新增 20+ 个 CSS 自定义属性（玻璃效果、氛围光、渐变强调色等）
- 新增 `[data-visual-style="immersive"]` 和 `[data-visual-style="immersive"][data-theme="dark"]` CSS 选择器覆盖
- 侧边栏底部新增视觉风格切换 UI（Sparkles 图标 + Popover）
- 6 大视觉模块的 CSS 实现：空间深度、氛围背景、色彩情绪化、排版升级、微交互、签名时刻
- 少量 TSX 增量改动：Tab 滑动指示器、响应状态码大号显示、空状态引导、响应面板 data-status 属性

## Impact
- Affected specs: 主题系统（useThemeStore）、类型系统（types/index.ts）、全局样式（global.css）、动画系统（animations.css）
- Affected code:
  - `src/types/index.ts` —— 新增 VisualStyle 类型
  - `src/stores/useThemeStore.ts` —— 扩展状态和方法
  - `src/styles/global.css` —— 新增 CSS 变量和选择器
  - `src/styles/app.css` —— 画布背景
  - `src/styles/animations.css` —— 新增关键帧
  - `src/components/layout/sidebar.css` —— 玻璃效果 + 动效
  - `src/components/layout/title-bar.css` —— 品牌升级
  - `src/components/layout/Sidebar.tsx` —— 切换 UI + 信息密度
  - `src/components/views/request-view.css` —— 卡片化 + 色彩 + 动效
  - `src/components/views/RequestView.tsx` —— Tab 指示器 + 空状态 + 状态码
  - `src/components/views/workflow-view.css` —— 画布视觉
  - `src/components/common/command-palette.css` —— 玻璃效果
  - `src/components/common/context-menu.css` —— 浮层玻璃
  - `src/components/dialogs/dialog.css` —— 弹窗玻璃
  - `src/components/history/history-panel.css` —— 排版
  - `src/components/tabs/kv-editor.css` —— 空状态

## ADDED Requirements

### Requirement: Visual Style Type
系统 SHALL 提供 `VisualStyle` 类型，值为 `'classic' | 'immersive'`，默认值为 `'classic'`。

#### Scenario: 默认值
- **WHEN** 应用首次启动
- **THEN** `visualStyle` 为 `'classic'`，`<html>` 上无 `data-visual-style` 属性或值为 `'classic'`

#### Scenario: 切换到 immersive
- **WHEN** 用户选择 immersive 风格
- **THEN** `<html>` 上 `data-visual-style` 属性设为 `'immersive'`，所有 `[data-visual-style="immersive"]` CSS 选择器生效

### Requirement: Visual Style Persistence
系统 SHALL 将 `visualStyle` 持久化到 `theme-storage`，与 `mode` 和 `accentColor` 一起存储和恢复。

#### Scenario: 页面刷新后恢复
- **WHEN** 用户刷新页面或重启应用
- **THEN** `visualStyle` 从持久化存储中恢复，`<html>` 上 `data-visual-style` 属性正确设置

### Requirement: Visual Style Switch UI
系统 SHALL 在侧边栏底部主题区域提供视觉风格切换入口，使用 `Sparkles` 图标（lucide-react），点击弹出 Popover 显示两个选项。

#### Scenario: 切换选项展示
- **WHEN** 用户点击 Sparkles 图标
- **THEN** Popover 显示 "Classic"（纯色预览块 + "经典 · 简洁高效"）和 "Immersive"（渐变预览块 + "沉浸 · 玻璃质感"）两个选项

#### Scenario: 选择 Classic
- **WHEN** 用户选择 Classic
- **THEN** `data-visual-style` 设为 `'classic'`，所有 immersive CSS 效果移除，界面恢复原始样式

#### Scenario: 选择 Immersive
- **WHEN** 用户选择 Immersive
- **THEN** `data-visual-style` 设为 `'immersive'`，所有 immersive CSS 效果生效，界面呈现玻璃质感 + 渐变 + 光效

### Requirement: Classic Mode Zero Impact
系统 SHALL 确保 `classic` 视觉风格下，所有现有 CSS 样式完全不变。所有 immersive 专属样式 MUST 仅在 `[data-visual-style="immersive"]` 选择器下定义。

#### Scenario: Classic 模式无新样式
- **WHEN** `data-visual-style` 为 `'classic'` 或未设置
- **THEN** 不加载任何 immersive 专属 CSS 效果，界面与当前完全一致

### Requirement: Immersive CSS Variables
系统 SHALL 在 `:root` 中定义 immersive 专属 CSS 变量，默认值与 classic 一致（不破坏现有样式），在 `[data-visual-style="immersive"]` 下覆盖为沉浸值。

#### Scenario: 默认变量值不破坏 classic
- **WHEN** `data-visual-style` 为 `'classic'`
- **THEN** `--glass-blur` 为 `0px`，`--accent-glow` 为 `transparent`，`--glass-bg` 等于 `--bg-sidebar`，所有 immersive 变量回退到 classic 等价值

#### Scenario: Immersive 亮色变量
- **WHEN** `data-visual-style` 为 `'immersive'` 且 `data-theme` 为 `'light'`
- **THEN** `--bg-canvas` 为 `#f0f0f2`，`--glass-bg` 为 `rgba(255,255,255,0.72)`，`--glass-blur` 为 `20px`，`--accent-glow` 为 `rgba(0,122,255,0.15)`

#### Scenario: Immersive 暗色变量
- **WHEN** `data-visual-style` 为 `'immersive'` 且 `data-theme` 为 `'dark'`
- **THEN** `--bg-canvas` 为 `#0f0f1a`，`--glass-bg` 为 `rgba(28,28,30,0.78)`，`--accent-glow` 为 `rgba(10,132,255,0.2)`

### Requirement: Module 1 - Space Depth & Glassmorphism
系统 SHALL 在 immersive 模式下实现空间深度与玻璃质感。

#### Scenario: 侧边栏玻璃效果
- **WHEN** immersive 模式激活
- **THEN** 侧边栏具有 `backdrop-filter: blur(20px)` + 半透明背景 + 微妙发光边框

#### Scenario: 面板层级系统
- **WHEN** immersive 模式激活
- **THEN** 主内容区使用 `--bg-canvas` 背景，面板使用 `--bg-container`（带阴影和圆角），弹窗使用 `--bg-elevated`（带更强阴影）

#### Scenario: 请求面板卡片化
- **WHEN** immersive 模式激活
- **THEN** 请求/响应面板具有 `border-radius: 12px` + `box-shadow` + 微妙边框 + 6px margin

#### Scenario: 弹窗浮层玻璃效果
- **WHEN** immersive 模式激活
- **THEN** 模态框、命令面板、右键菜单具有 `backdrop-filter: blur(12px)` + 半透明背景 + 微妙边框

### Requirement: Module 2 - Ambient Background
系统 SHALL 在 immersive 模式下实现氛围背景与动态纹理。

#### Scenario: 渐变氛围背景
- **WHEN** immersive 模式激活
- **THEN** 主内容区背景为从 `--bg-canvas` 到 `--bg-canvas-end` 的对角渐变，60s 周期缓慢动画

#### Scenario: 点阵网格纹理
- **WHEN** immersive 模式激活
- **THEN** 主内容区叠加极淡点阵网格（`radial-gradient`），亮色 `rgba(0,0,0,0.03)` 1px 圆点 20px 间距，暗色 `rgba(255,255,255,0.02)` 1px 圆点 24px 间距

#### Scenario: 响应状态氛围光
- **WHEN** immersive 模式下请求成功
- **THEN** 响应面板右上角短暂出现绿色光晕，1.5s 后淡出
- **WHEN** immersive 模式下请求失败
- **THEN** 响应面板右上角短暂出现红色光晕，1.5s 后淡出

### Requirement: Module 3 - Emotional Color System
系统 SHALL 在 immersive 模式下实现色彩情绪化升级。

#### Scenario: HTTP 方法色渗透
- **WHEN** immersive 模式激活
- **THEN** URL 栏方法色条加宽到 4px 并添加微光，请求面板顶部添加方法色渐变条，侧边栏请求项 hover 时左侧滑入方法色指示条

#### Scenario: 状态码色彩映射
- **WHEN** immersive 模式下响应到达
- **THEN** 2xx 响应面板顶部显示 2px 绿色条，4xx 显示橙色条，5xx 显示红色条

#### Scenario: 强调色渐变按钮
- **WHEN** immersive 模式激活
- **THEN** 主按钮（如发送按钮）背景为 `linear-gradient(135deg, --accent-start, --accent-end)`，hover 时渐变角度旋转 15°

#### Scenario: 暗色霓虹光效
- **WHEN** immersive + dark 模式激活
- **THEN** 选中 Tab、发送按钮、活跃输入框具有对应颜色的外发光效果（`box-shadow`）

### Requirement: Module 4 - Typography Upgrade
系统 SHALL 在 immersive 模式下优化排版与信息密度。

#### Scenario: 响应状态码大号显示
- **WHEN** immersive 模式下响应到达
- **THEN** 状态码数字以 28px / font-weight 700 / tabular-nums 显示，旁边小字说明状态文本

#### Scenario: Collection 请求数量
- **WHEN** immersive 模式激活
- **THEN** Collection 项下方显示灰色小字请求数量

### Requirement: Module 5 - Micro-interactions
系统 SHALL 在 immersive 模式下增强微交互与动效。

#### Scenario: Tab 滑动指示器
- **WHEN** immersive 模式下切换 Tab
- **THEN** 底部 2px 强调色条流畅滑动到新 Tab 位置

#### Scenario: 输入框聚焦展开
- **WHEN** immersive 模式下输入框聚焦
- **THEN** 底部边框从中心向两侧展开动画

#### Scenario: 空状态引导
- **WHEN** immersive 模式下无请求/无历史/无集合
- **THEN** 显示对应空状态引导插画和文字

### Requirement: Module 6 - Signature Moments
系统 SHALL 在 immersive 模式下创造签名视觉时刻。

#### Scenario: 标题栏品牌升级
- **WHEN** immersive 模式激活
- **THEN** Logo 图标具有呼吸光效（暗色模式脉冲发光），标题文字使用渐变色

#### Scenario: 发送按钮仪式感
- **WHEN** immersive 模式下点击发送按钮
- **THEN** 按钮具有渐变背景 + 微妙光晕，hover 放大 + 光晕增强，点击瞬间从按钮位置扩散圆形光波

#### Scenario: 工作流画布视觉
- **WHEN** immersive 模式下查看工作流
- **THEN** 画布背景为深色渐变 + 网格线，节点为玻璃质感卡片，执行时节点边缘发光

#### Scenario: 命令面板视觉
- **WHEN** immersive 模式下打开命令面板
- **THEN** 面板具有 `backdrop-filter: blur(40px)` 玻璃效果，搜索框底部有彩虹渐变细线

### Requirement: Accent Gradient Extension
系统 SHALL 在 immersive 模式下扩展强调色为渐变色，`applyAccent` 函数额外设置 `--accent-start`、`--accent-end`、`--accent-glow` 变量。

#### Scenario: Immersive 模式强调色渐变
- **WHEN** immersive 模式激活且用户选择蓝色强调色
- **THEN** `--accent-start` 为 `#007aff`，`--accent-end` 为偏移色相的终点色（如 `#5ac8fa`），`--accent-glow` 为 `rgba(0,122,255,0.15)`（亮色）/ `rgba(10,132,255,0.2)`（暗色）

#### Scenario: Classic 模式无渐变
- **WHEN** classic 模式激活
- **THEN** `--accent-start` 和 `--accent-end` 均等于 `--accent`，`--accent-glow` 为 `transparent`

### Requirement: Accessibility
系统 SHALL 确保所有 immersive 模式下的动画尊重 `prefers-reduced-motion: reduce`，色彩对比度保持 WCAG AA 标准。

#### Scenario: 减弱动画偏好
- **WHEN** 用户系统设置了 `prefers-reduced-motion: reduce`
- **THEN** 所有 immersive 动画时长压缩到 `0.01ms`，渐变背景静止

### Requirement: Progressive Enhancement
系统 SHALL 在不支持 `backdrop-filter` 的环境中自动回退到纯色背景。

#### Scenario: 不支持 backdrop-filter
- **WHEN** 浏览器不支持 `backdrop-filter`
- **THEN** 玻璃效果元素回退为不透明的 `--bg-sidebar` / `--bg-elevated` 背景色
