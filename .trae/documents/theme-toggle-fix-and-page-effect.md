# 主题切换动画修复 & 页面级创意效果方案

## 问题分析

### 问题 1：图标闪烁到非目标主题

**根因**：`handleQuickToggle` 中 `setThemeAnimState()` 和 `toggle()` 同时执行。`toggle()` 同步更新 `resolvedMode`，导致 ThemeTransitionIcon 的 `mode` prop 立即变为新值，而动画还没完成。CSS 中 `--light-idle`/`--dark-idle` 修饰类在动画进行中就切换了，造成图标瞬间跳到错误状态。

**时序问题**：
```
t=0ms:  点击 → setThemeAnimState('to-light') + toggle()
        → resolvedMode 立即从 'dark' 变为 'light'
        → mode prop 从 'light' 变为 'dark'
        → CSS class 从 --light-idle 跳到 --dark-idle
        → 图标闪烁！
t=700ms: setThemeAnimState('idle') → 动画结束
```

### 问题 2：只有图标在变，页面没有创意效果

当前的 `body::after` 渐变扫光效果太微弱（仅 0.15 透明度），用户几乎感知不到。需要更有冲击力的页面级过渡。

---

## 修复方案

### 核心思路

1. **图标**：idle 状态回归静态 Sun/Moon 图标，仅在动画期间显示 ThemeTransitionIcon，彻底避免状态冲突
2. **页面**：实现「日食/月食」圆形揭幕效果——从按钮位置向外扩展/收缩的圆形遮罩，配合边缘光晕

### 效果描述

**切换到暗色（月食）**：
- 点击按钮 → 按钮图标播放日落动画（太阳旋转缩小、流星划过、月亮升起）
- 同时，一个暗色圆形从按钮位置向外扩展，像月影吞没画面
- 圆形边缘带有微弱的 accent 光晕
- 圆形覆盖全屏后，旧主题色被完全遮盖
- 遮罩从按钮位置向内收缩消散，露出新暗色主题

**切换到亮色（日食）**：
- 点击按钮 → 按钮图标播放日出动画（月亮旋转缩小、曙光扩散、太阳升起）
- 同时，一个亮色圆形从按钮位置向外扩展，像日光蔓延
- 圆形边缘带有暖色光晕
- 遮罩收缩消散，露出新亮色主题

---

## 实现步骤

### Step 1: 简化 ThemeTransitionIcon 组件

**文件**: `src/components/common/ThemeTransitionIcon.tsx`

- 移除 `mode` prop（不再需要，idle 状态不使用此组件）
- 移除 `modeClass` 逻辑
- 保留所有 SVG 层（sun/moon/stars/rays/shooting-star/halo）
- 组件仅在动画期间渲染，idle 状态由外部切换为静态图标

### Step 2: 简化主题过渡 CSS

**文件**: `src/styles/components.css`

- 移除所有 `--light-idle` / `--dark-idle` 修饰类
- 只保留 `to-dark` 和 `to-light` 状态的动画 CSS
- 移除 `.idle` 状态的样式（组件不在 idle 时使用）
- 简化后的 CSS 更清晰，不再有状态冲突

### Step 3: 修改 ToolbarArea 逻辑

**文件**: `src/components/layout/titlebar/ToolbarArea.tsx`

核心改动：

```tsx
// 新增状态
const themeToggleRef = useRef<HTMLButtonElement>(null)
const [reveal, setReveal] = useState<{
  x: number; y: number; color: string; key: number
} | null>(null)

const handleQuickToggle = () => {
  const btn = themeToggleRef.current
  if (!btn) return

  // 1. 捕获按钮位置
  const rect = btn.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  // 2. 捕获当前主题背景色（切换前）
  const currentBg = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-primary').trim()

  // 3. 设置图标动画状态
  setThemeAnimState(resolvedMode === 'dark' ? 'to-light' : 'to-dark')

  // 4. 创建圆形揭幕遮罩
  setReveal({ x, y, color: currentBg, key: Date.now() })

  // 5. 切换主题
  toggle()

  // 6. 动画结束后清理
  setTimeout(() => setThemeAnimState('idle'), 700)
  setTimeout(() => setReveal(null), 700)
}
```

按钮渲染逻辑：

```tsx
<button
  ref={themeToggleRef}
  className={`tb-tool-btn tb-theme-toggle ${themeAnimState !== 'idle' ? 'tb-theme-toggle--animating' : ''}`}
  onClick={handleQuickToggle}
  aria-label="Toggle theme"
>
  {themeAnimState !== 'idle' ? (
    <ThemeTransitionIcon size={14} state={themeAnimState} />
  ) : (
    resolvedMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />
  )}
</button>
```

圆形揭幕遮罩（Portal 到 body）：

```tsx
{reveal && createPortal(
  <div
    className="theme-reveal-overlay"
    key={reveal.key}
    style={{
      '--reveal-x': `${reveal.x}px`,
      '--reveal-y': `${reveal.y}px`,
      backgroundColor: reveal.color,
    } as React.CSSProperties}
  />,
  document.body
)}
```

同样修改 `handleThemeToggle`（下拉面板切换），使用点击事件的位置作为揭幕原点。

### Step 4: 实现圆形揭幕 CSS

**文件**: `src/styles/components.css`（新增）

```css
.theme-reveal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  clip-path: circle(150vmax at var(--reveal-x) var(--reveal-y));
  animation: themeRevealShrink 600ms var(--ease-out-quart) forwards;
  filter: drop-shadow(0 0 30px var(--accent-glow));
}

@keyframes themeRevealShrink {
  0% {
    clip-path: circle(150vmax at var(--reveal-x) var(--reveal-y));
  }
  100% {
    clip-path: circle(0px at var(--reveal-x) var(--reveal-y));
  }
}
```

原理：
1. 遮罩初始覆盖全屏（`circle(150vmax)`），背景色为旧主题色
2. 主题已切换，但遮罩盖住了新主题
3. 遮罩从按钮位置向内收缩，逐渐露出新主题
4. `drop-shadow` 在圆形边缘产生 accent 光晕
5. 动画结束后移除遮罩 DOM

### Step 5: 移除旧的 body::after 扫光效果

**文件**: `src/styles/global.css`

移除之前添加的 `.theme-transitioning body::after` 及相关 CSS，替换为圆形揭幕效果。

### Step 6: 更新 prefers-reduced-motion 降级

**文件**: `src/styles/animations.css`

在 `@media (prefers-reduced-motion: reduce)` 中：
- 禁用 `.theme-reveal-overlay` 动画
- 禁用 `.tb-theme-toggle--animating` 动画
- 图标切换降级为简单淡入淡出

---

## 涉及文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/components/common/ThemeTransitionIcon.tsx` | 修改 | 移除 mode prop，简化组件 |
| `src/styles/components.css` | 修改 | 移除 idle/--light-idle/--dark-idle CSS，新增圆形揭幕 CSS |
| `src/components/layout/titlebar/ToolbarArea.tsx` | 修改 | 重构切换逻辑，idle 用静态图标，动画用 ThemeTransitionIcon，新增圆形揭幕 |
| `src/styles/global.css` | 修改 | 移除 body::after 扫光效果 |
| `src/styles/animations.css` | 修改 | 更新 prefers-reduced-motion 降级规则 |

## 动画时序

```
t=0ms:    点击 → 捕获位置和旧色 → 创建遮罩(全覆盖) → 切换主题 → 图标动画开始
t=0-600ms: 遮罩从按钮位置向内收缩(圆形揭幕) + 图标动画播放
t=600ms:  遮罩消失，新主题完全露出
t=700ms:  图标动画结束，切换回静态图标
```
