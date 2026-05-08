# Requests 页面 UI 细节优化计划

## 项目背景

- **技术栈**: React 18 + TypeScript + Vite 6 + Electron 33
- **样式方案**: 纯原生 CSS + CSS Variables（Design Tokens），无预处理器/框架
- **主题系统**: 4 套变量层（Light/Dark/Immersive-Light/Immersive-Dark），11 种强调色
- **涉及文件**: 7 个 CSS 文件 + 6 个 TSX 组件文件

---

## 优化模块一：页面布局结构优化 — 提升视觉层次感

### 1.1 URL 工具栏视觉层次强化
- **文件**: `request-view.css`
- **优化内容**:
  - 为 `.request-toolbar` 增加微妙的内阴影 `box-shadow`，与内容区形成层次分离
  - 调整 `.url-bar` 的间距 `gap` 从 `6px` → `8px`，让元素呼吸感更强
  - 为 `.method-color-band` 增加渐变效果，从纯色改为 `linear-gradient(180deg, color, color-dark)`，增加视觉深度
  - Send 按钮与 Cancel 按钮增加视觉权重差异，Send 按钮增加 `min-width: 80px` 保证视觉稳定

### 1.2 请求/响应面板分隔优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.resize-handle` 增加悬停时的背景渐变过渡效果（从透明到强调色），而非突然变色
  - `.resize-handle-line` 增加圆点装饰（三点式拖拽指示器），替代当前的单线条
  - `.resize-handle-h` 同步优化，增加三点式水平拖拽指示器

### 1.3 面板内容区层次优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.panel-content` 增加微妙的内边距调整，从 `16px` → `16px 16px 16px 20px`，左侧略增加形成缩进层次
  - `.script-section` 与 `.main-tabs-section` 之间增加视觉分隔线样式优化

---

## 优化模块二：色彩搭配优化 — 符合品牌视觉规范

### 2.1 响应状态色彩语义增强
- **文件**: `request-view.css`
- **优化内容**:
  - `.response-status.success` 增加浅色背景 `background: var(--success-light)`，当前仅有文字色和边框色，缺乏视觉面积
  - `.response-status.error` 同理增加 `background: var(--error-light)`
  - `.response-status.warning` 增加 `background: var(--warning-light)`
  - 状态码文字增加 `font-variant-numeric: tabular-nums` 确保数字等宽

### 2.2 错误横幅色彩优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.error-banner` 各类型增加左侧色条 `border-left: 3px solid`，增强视觉区分
  - `.error-banner.abort` 当前使用灰色，改为更柔和的蓝灰色调，避免与禁用状态混淆

### 2.3 Tab 徽章色彩一致性
- **文件**: `request-view.css`
- **优化内容**:
  - `.tab-badge` 在非激活状态下增加微妙的边框 `border: 1px solid var(--border-light)`，与背景形成层次
  - `.tab-badge.dot` 增加微妙的脉冲动画 `animation: dotPulse 2s infinite`，提示用户有配置

---

## 优化模块三：字体样式与大小优化 — 增强可读性

### 3.1 URL 输入框字体优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.url-input` 的 `font-size` 从 `var(--text-base)` (13px) → `var(--text-md)` (14px)，URL 作为核心输入需要更大字号
  - `.url-input` 增加 `letter-spacing: var(--tracking-micro)`，提升 URL 字符辨识度

### 3.2 响应元信息字体优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.response-status-code` 增加 `font-size: var(--text-md)` 和 `font-weight: 700`，使状态码更醒目
  - `.response-time` 和 `.response-size` 增加 `font-weight: 500`，提升数字可读性

### 3.3 KV 编辑器字体优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.kv-header` 的 `font-size` 从 `var(--text-xs)` (11px) → `var(--text-sm)` (12px)，表头过小影响可读性
  - `.kv-row input[type="text"]` 的 `font-size` 从 `var(--text-sm)` (12px) → `var(--text-base)` (13px)

### 3.4 空状态提示文字优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.empty-response-title` 的 `font-size` 从 `var(--text-md)` → `var(--text-lg)`，增强视觉引导
  - `.empty-response-hint` 增加 `line-height: var(--leading-relaxed)` 确保多行可读性

---

## 优化模块四：交互反馈效果完善

### 4.1 按钮悬停/激活状态增强
- **文件**: `request-view.css`
- **优化内容**:
  - `.send-btn` 增加 `focus-visible` 样式：`outline: 2px solid var(--accent); outline-offset: 2px`
  - `.cancel-btn` 增加 `focus-visible` 样式
  - `.save-btn` 悬停时增加微妙的阴影 `box-shadow: var(--shadow-sm)` 替代纯位移
  - `.action-btn` 增加按下态 `transform: scale(0.97)` 反馈

### 4.2 输入框聚焦状态增强
- **文件**: `request-view.css`, `method-select.css`
- **优化内容**:
  - `.url-input:focus` 增加微妙的背景色变化 `background: color-mix(in srgb, var(--bg-input) 95%, var(--accent))`
  - `.method-select-trigger:focus-visible` 增加 `outline: 2px solid var(--accent); outline-offset: 2px`
  - `.body-type-select:focus-visible` 增加 outline 样式
  - `.auth-type-select:focus-visible` 增加 outline 样式

### 4.3 加载状态优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.request-progress-bar` 增加渐变背景 `background: linear-gradient(90deg, var(--accent), var(--accent-hover))`
  - `.request-progress-indeterminate` 增加发光效果 `box-shadow: 0 0 8px var(--accent-glow)`
  - Send 按钮在发送中增加 `.sending` 类的旋转图标动画

### 4.4 操作成功/失败反馈增强
- **文件**: `request-view.css`
- **优化内容**:
  - `.action-btn.copied` 增加过渡动画 `transition: all var(--duration-normal) var(--ease-spring)`
  - `.url-flash-success` 增加背景色闪烁 `background: var(--success-light)` 配合边框闪烁
  - `.url-flash-error` 增加背景色闪烁 `background: var(--error-light)` 配合边框闪烁
  - 复制按钮成功后增加勾号动画（scale 弹跳效果）

### 4.5 KV 行交互优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.kv-row` 悬停时删除按钮的显示过渡增加 `transition-delay: 0ms`（移除当前 60ms 延迟，让操作更即时）
  - `.kv-row` 增加聚焦态样式 `.kv-row:focus-within`，当行内任一输入框聚焦时高亮整行边框
  - `.add-row-btn` 增加点击波纹效果（通过 `::after` 伪元素实现）

---

## 优化模块五：表单元素设计优化

### 5.1 下拉选择器优化
- **文件**: `method-select.css`, `request-view.css`
- **优化内容**:
  - `.method-select-trigger` 增加内边距调整，使方法文字与箭头图标间距更舒适
  - `.method-select-dropdown` 增加进入动画 `animation: scaleIn + fadeSlideDown`
  - `.method-option` 增加左侧色条指示器（替代圆点），宽度 `3px`，高度 `100%`
  - `.body-type-select` 和 `.auth-type-select` 增加自定义下拉箭头图标（通过 `appearance: none` + 背景SVG）
  - `.body-type-select` 增加悬停态 `border-color: var(--border-color)` 和 `background: var(--bg-hover)`

### 5.2 输入框统一样式
- **文件**: `request-view.css`, `auth-tab.css`
- **优化内容**:
  - 所有 `.auth-field input` 统一高度为 `36px`（当前无明确高度），与 URL 输入框视觉对齐
  - `.auth-field input` 增加 `padding: 8px 12px` 统一规范
  - `.curl-import-textarea` 增加聚焦态边框 `border: 1px solid var(--accent)`（当前 `outline: none` 但无边框变化）

### 5.3 按钮组视觉优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.format-toggle-group` 增加容器背景 `background: var(--bg-tertiary); border-radius: var(--radius-sm); padding: 2px`
  - `.format-toggle-btn` 在组容器内形成分段控件效果，激活态使用 `background: var(--bg-primary); box-shadow: var(--shadow-sm)`
  - `.kv-mode-toggle` 同步优化为分段控件样式

---

## 优化模块六：响应式显示效果优化

### 6.1 小屏幕适配（<768px）
- **文件**: `request-view.css`
- **优化内容**:
  - 增加 `@media (max-width: 768px)` 下 `.request-toolbar` 的 `padding` 缩小为 `8px 12px`
  - `.url-bar` 在小屏幕下 `.save-btn` 隐藏文字只显示图标（当前已只有图标，确认OK）
  - `.send-btn` 在小屏幕下缩小为 `padding: 8px 12px`，隐藏 "Send" 文字只显示图标
  - `.method-select-trigger` 的 `min-width` 从 `90px` → `70px`

### 6.2 中等屏幕适配（769px-1024px）
- **文件**: `request-view.css`
- **优化内容**:
  - `.response-meta` 在中等屏幕下 `.response-size` 隐藏，只显示状态码和耗时
  - `.panel-tab` 的 `padding` 缩小为 `6px 10px`

### 6.3 极小屏幕适配（<600px）
- **文件**: `request-view.css`
- **优化内容**:
  - `.request-body` 改为垂直布局 `flex-direction: column`，请求面板在上、响应面板在下
  - `.request-panel` 和 `.response-panel` 的 `width` 改为 `100%`，`height` 各占 `50%`
  - `.resize-handle` 在垂直布局下变为水平拖拽条
  - `.url-bar` 允许换行 `flex-wrap: wrap`

### 6.4 大屏幕优化（>1440px）
- **文件**: `request-view.css`
- **优化内容**:
  - `.panel-content` 的 `max-width` 设为 `960px`，避免内容过度拉伸
  - `.auth-editor` 的 `max-width` 从 `600px` → `680px`

---

## 优化模块七：视觉一致性提升

### 7.1 圆角统一
- **文件**: `request-view.css`
- **优化内容**:
  - `.kv-row` 的 `border-radius` 从 `var(--radius-sm)` → `var(--radius-md)`，与输入框统一
  - `.header-row` 和 `.cookie-row` 同步调整
  - `.test-result` 同步调整

### 7.2 间距统一
- **文件**: `request-view.css`
- **优化内容**:
  - `.panel-content` 的 `padding` 统一为 `16px`
  - `.script-content` 的 `padding` 统一为 `12px 16px`（当前已一致，确认OK）
  - `.response-body` 的 `padding` 确认与 `.panel-content` 一致

### 7.3 阴影层级统一
- **文件**: `request-view.css`
- **优化内容**:
  - 所有悬停态行（`.kv-row:hover`, `.header-row:hover`, `.cookie-row:hover`, `.saved-response-item:hover`）统一使用 `box-shadow: var(--shadow-sm)`
  - 所有下拉菜单统一使用 `box-shadow: var(--shadow-lg)`

### 7.4 过渡动画统一
- **文件**: `request-view.css`
- **优化内容**:
  - 所有交互元素的 `transition` 统一使用 `var(--duration-fast) var(--ease-out-quart)`
  - 所有弹性反馈统一使用 `var(--duration-fast) var(--ease-spring)`
  - 移除不一致的硬编码时长值

---

## 优化模块八：Immersive 主题专项优化

### 8.1 玻璃拟态细节增强
- **文件**: `request-view.css`
- **优化内容**:
  - `.kv-row` 在 immersive 模式下增加 `background: rgba(255, 255, 255, 0.06)` 和 `border-color: var(--glass-border-subtle)`
  - `.test-result` 在 immersive 模式下增加透明背景
  - `.auth-preview` 在 immersive 模式下增加玻璃效果

### 8.2 发光效果优化
- **文件**: `request-view.css`
- **优化内容**:
  - `.response-status.success` 在 immersive 暗色模式下增加微妙的成功色发光
  - `.response-status.error` 在 immersive 暗色模式下增加微妙的错误色发光

---

## 实施步骤

### 第一步：布局与层次优化（模块一）
1. 修改 `request-view.css` 中工具栏、面板分隔、内容区样式

### 第二步：色彩优化（模块二）
1. 修改响应状态色彩、错误横幅色彩、Tab 徽章色彩

### 第三步：字体优化（模块三）
1. 修改 URL 输入框、响应元信息、KV 编辑器、空状态文字样式

### 第四步：交互反馈优化（模块四）
1. 修改按钮悬停/聚焦状态、输入框聚焦状态、加载状态、操作反馈、KV 行交互

### 第五步：表单元素优化（模块五）
1. 修改下拉选择器、输入框、按钮组样式

### 第六步：响应式优化（模块六）
1. 增加各断点媒体查询规则

### 第七步：视觉一致性优化（模块七）
1. 统一圆角、间距、阴影、过渡动画

### 第八步：Immersive 主题优化（模块八）
1. 增加沉浸模式下的玻璃拟态和发光效果

### 第九步：兼容性验证
1. 启动开发服务器
2. 在不同视口宽度下验证布局
3. 切换 Light/Dark/Immersive 主题验证
4. 检查所有交互状态（悬停、聚焦、激活、禁用）

---

## 涉及文件清单

| 文件 | 修改类型 |
|------|---------|
| `src/components/views/request-view.css` | 主要修改（8个模块均涉及） |
| `src/components/views/method-select.css` | 次要修改（下拉选择器优化） |
| `src/components/tabs/kv-editor.css` | 次要修改（模式切换分段控件） |
| `src/components/tabs/body-tab.css` | 微调（Immersive 适配） |
| `src/components/tabs/auth-tab.css` | 微调（输入框统一样式） |
| `src/components/tabs/script-tab.css` | 微调（Immersive 适配） |
| `src/components/views/RequestView.tsx` | 微调（添加必要的 CSS 类名/状态） |

**不修改的文件**: `global.css`（Design Tokens 已足够完善）、`ResponsePanel.tsx`、`MethodSelect.tsx`、`KVEditor.tsx`、`BodyTab.tsx`、`AuthTab.tsx`（组件逻辑无需变更，纯 CSS 优化为主）
