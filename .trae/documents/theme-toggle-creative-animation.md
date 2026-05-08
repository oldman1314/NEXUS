# 主题切换创意动画方案：「天体剧场」

## 现状分析

当前主题切换按钮（[ToolbarArea.tsx](file:///d:/std/postman-app/src/components/layout/titlebar/ToolbarArea.tsx#L83-L91)）使用 lucide-react 的 `Sun`/`Moon` 静态图标，**切换时无任何动画**。

虽然已有 `ThemeTransitionIcon` 组件和 `sunRotateOut`/`moonRotateIn`/`starBurst`/`sunRaysExpand` 等关键帧动画，但存在两个问题：
1. **ThemeTransitionIcon 仅在 Appearance 下拉面板的选中 chip 中使用**，未用于顶栏快捷切换按钮
2. **CSS 过渡状态全部相同**（所有状态下 opacity:1, scale(1)），动画实际不可见

---

## 创意概念：「天体剧场」

将主题切换视为一场微型天文表演——切换到暗色是**日落入夜**，切换到亮色是**破晓日出**。动画分为**按钮层**和**全局层**两层叙事。

### 切换到暗色（日落入夜 🌅→🌙）

| 阶段 | 时间 | 动画 | 含义 |
|------|------|------|------|
| 1 | 0-200ms | 太阳旋转下沉缩小 | 日落 |
| 2 | 100-350ms | 光线向外扩散消散 | 余晖消逝 |
| 3 | 200-500ms | 流星从右上划过 | 夜幕降临 |
| 4 | 250-550ms | 星星依次绽放（3颗，交错延迟） | 繁星初现 |
| 5 | 300-600ms | 月亮从下方旋转升起 | 月升 |

### 切换到亮色（破晓日出 🌙→🌅）

| 阶段 | 时间 | 动画 | 含义 |
|------|------|------|------|
| 1 | 0-200ms | 月亮旋转下沉淡出 | 月落 |
| 2 | 100-300ms | 星星收缩消失 | 星光隐去 |
| 3 | 150-400ms | 曙光光线从中心扩散 | 破晓 |
| 4 | 250-550ms | 太阳从下方旋转升起 | 日出 |
| 5 | 400-600ms | 光线脉冲一次 | 初光 |

---

## 实现步骤

### Step 1: 增强 ThemeTransitionIcon 组件

**文件**: `src/components/common/ThemeTransitionIcon.tsx`

- 新增 **流星 SVG 层**（`.theme-icon-shooting-star`）：一条带拖尾的斜线，仅在 `to-dark` 时可见
- 新增 **光晕 SVG 层**（`.theme-icon-halo`）：太阳/月亮周围的环形光晕，过渡时脉冲
- 将 `state` prop 的动画持续时间从 250ms 提升到 600ms，与整体叙事节奏匹配
- 保持组件接口不变（`size` + `state`），向后兼容

### Step 2: 重写主题过渡 CSS 动画

**文件**: `src/styles/components.css`（`.theme-transition-icon` 相关部分）

修复当前所有状态值相同的问题，实现完整的动画叙事：

```
/* 切换到暗色 */
.to-dark .theme-icon-sun    → rotate(180deg) scale(0) opacity(0)   // 太阳旋转下沉
.to-dark .theme-icon-moon   → rotate(0deg) scale(1) opacity(1)    // 月亮升起
.to-dark .theme-icon-stars  → opacity(1) + 交错延迟动画             // 星星绽放
.to-dark .theme-icon-rays   → scale(1.5) opacity(0)               // 光线扩散消散
.to-dark .theme-icon-shooting-star → 沿 45° 划过                    // 流星

/* 切换到亮色 */
.to-light .theme-icon-sun   → rotate(0deg) scale(1) opacity(1)    // 太阳升起
.to-light .theme-icon-moon  → rotate(-180deg) scale(0) opacity(0) // 月亮旋转下沉
.to-light .theme-icon-stars → opacity(0)                           // 星星消失
.to-light .theme-icon-rays  → scale(1.2) opacity(0.5) → scale(1)  // 曙光脉冲
```

### Step 3: 新增关键帧动画

**文件**: `src/styles/animations.css`

新增以下关键帧：
- `@keyframes shootingStar` — 流星从右上角划向左下角，带拖尾渐隐
- `@keyframes starTwinkle` — 星星闪烁（缩放+透明度交替）
- `@keyframes sunRise` — 太阳从下方升起（translateY + scale + rotate）
- `@keyframes moonRise` — 月亮从下方升起
- `@keyframes dawnPulse` — 曙光脉冲（光线从中心扩散一次）

已有的 `sunRotateOut`、`moonRotateIn`、`starBurst`、`sunRaysExpand` 可复用/微调。

### Step 4: 将 ThemeTransitionIcon 接入顶栏快捷切换按钮

**文件**: `src/components/layout/titlebar/ToolbarArea.tsx`

将当前的静态图标：
```tsx
{resolvedMode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
```

替换为动画图标：
```tsx
<ThemeTransitionIcon size={14} state={themeAnimState} />
```

这样快捷切换按钮就会展示完整的「天体剧场」动画。`themeAnimState` 已经在 `handleQuickToggle` 中正确设置。

### Step 5: 添加按钮级微交互增强

**文件**: `src/components/layout/titlebar/toolbar-area.css`

为 `.tb-theme-toggle` 按钮添加：
- 切换时短暂的 **缩放弹跳**（scale 0.85 → 1.1 → 1）
- 切换时短暂的 **accent 光晕**（box-shadow 脉冲）
- hover 时图标轻微旋转（太阳转 15°，月亮晃动）

### Step 6: 添加全局氛围过渡（可选增强）

**文件**: `src/styles/global.css`

在 `.theme-transitioning` 类激活期间，为 `body` 添加一个短暂的 **全屏渐变遮罩** 动画：
- 切到暗色：从顶部向下扫过一层深色渐变（如夜幕降临）
- 切到亮色：从底部向上扫过一层暖色渐变（如晨曦蔓延）

这通过一个 `::after` 伪元素实现，动画结束后自动移除（由 `.theme-transitioning` 类的移除触发）。

---

## 涉及文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/components/common/ThemeTransitionIcon.tsx` | 修改 | 新增流星层、光晕层 |
| `src/styles/components.css` | 修改 | 重写主题过渡 CSS，修复动画 |
| `src/styles/animations.css` | 修改 | 新增关键帧动画 |
| `src/components/layout/titlebar/ToolbarArea.tsx` | 修改 | 替换静态图标为动画组件 |
| `src/components/layout/titlebar/toolbar-area.css` | 修改 | 按钮微交互增强 |
| `src/styles/global.css` | 修改 | 全局氛围过渡（可选） |

## 动画时长设计

- 按钮图标动画：**600ms**（当前 700ms 的 `setTimeout` 足够覆盖）
- 全局氛围过渡：**400ms**（在 300ms 的 `.theme-transitioning` 窗口内完成）
- 所有动画尊重 `prefers-reduced-motion`，降级为简单淡入淡出
