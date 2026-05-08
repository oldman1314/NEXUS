# Dark Mode 星星闪烁修复计划

## 原始需求

> 偶尔会出现 3-5 颗星星出现在不同的位置闪烁几秒后消失，一段时间再次出现

## 当前实现分析

### 涉及文件

| 文件 | 角色 |
|------|------|
| `src/components/common/DarkModeStars.tsx` | 暗色模式下渲染星星的 React 组件 |
| `src/styles/app.css` (L67-L128) | `.dm-stars-container` 和 `.dm-star` 的 CSS 样式 |
| `src/App.tsx` (L8, L16) | 引入并使用 `<DarkModeStars />` |
| `src/config/themeAnimationConfig.ts` (L117-L138) | 主题切换过渡动画中的 STARS 配置（20颗固定位置星星） |
| `src/components/common/ThemePageEffect.tsx` (L29-L31) | 使用 STARS 配置渲染主题过渡页面的星星 |
| `src/styles/animations.css` (L434-L628) | `starGlowAndFade` / `starGlowAndFadeB` / `starGlowAndFadeC` 关键帧动画 |

### 当前实现与需求的差异

| | 当前 DarkModeStars | 需求 |
|---|---|---|
| 星星数量 | 8-16 颗（随机） | 3-5 颗 |
| 生命周期 | 永久存在（`animation: infinite`） | 出现 → 闪烁几秒 → 消失 |
| 周期性 | 无，一次性生成 | 消失后等待一段时间再次出现 |
| 位置 | 随机 | 随机（已满足） |

### 具体 Bug

**Bug 1 — `app.css` L119**：`.dm-star` 动画设为 `infinite`，导致星星永不消失：

```css
animation: dmStarTwinkle var(--dm-dur, 2s) ease-in-out var(--dm-delay, 0ms) infinite;
```

**Bug 2 — `DarkModeStars.tsx` L13-L14**：生成 8-16 颗星星，与需求 3-5 颗不符：

```ts
const count = 8 + Math.floor(Math.random() * 8) // 8~15
```

**Bug 3 — `DarkModeStars.tsx`**：缺少周期性控制逻辑——星星生成后永远留在 DOM 中，从未被清除或重新生成。

**Bug 4 — CSS 变量不匹配**：CSS 中使用 `var(--dm-dur, 2s)` 和 `var(--dm-delay, 0ms)`，但组件通过 React inline style 设置 `animationDuration` / `animationDelay`，部分工作但语义混乱。

---

## 修复计划

### 步骤 1：修复 `app.css` — 调整星星动画

**文件**：`src/styles/app.css`（L81-L128）

**改动**：
1. 将 `.dm-star` 的 `animation` 从 `infinite` 改为播放固定次数（如 `3` 次），使星星在有限时间内完成闪烁后自然停止：
   ```css
   animation: dmStarTwinkle 2s ease-in-out 0ms 3 both;
   ```
2. 简化 `dmStarTwinkle` 关键帧，移除 CSS 变量依赖（`--dm-dur`、`--dm-delay`），让 inline style 的 `animationDuration` / `animationDelay` 生效覆盖默认值
3. `.dm-stars-container` 的 `transition` 保持 600ms（用作批次淡入淡出），确保与 JavaScript 控制的 `visible` 状态配合

---

### 步骤 2：重构 `DarkModeStars.tsx` — 实现周期性生命周期

**文件**：`src/components/common/DarkModeStars.tsx`

**改写逻辑**：

| 阶段 | 行为 | 时长 |
|------|------|------|
| 1. 生成 | 随机生成 3-5 颗星星，随机位置/size/delay | - |
| 2. 显示 | `setVisible(true)` → 容器 fade in，星星开始闪烁 | ~4-6s |
| 3. 隐藏 | `setVisible(false)` → 容器 fade out（600ms CSS transition） | ~0.6s |
| 4. 清理 | `setStars([])` 移除所有 DOM 节点 | - |
| 5. 等待 | 随机间隔 | ~8-20s |
| 6. 循环 | 回到步骤 1 | - |

**具体代码结构**：

```ts
// generateStars: 改为生成 3-5 颗
function generateStars(): StarConfig[] {
  const count = 3 + Math.floor(Math.random() * 3) // 3~5
  // ...同现有逻辑
}

// 组件内
export default function DarkModeStars() {
  const resolvedMode = useThemeStore((s) => s.resolvedMode)
  const [stars, setStars] = useState<StarConfig[]>([])
  const [visible, setVisible] = useState(false)
  const cycleTimerRef = useRef<...>(null)
  
  const isDark = resolvedMode === 'dark'
  
  useEffect(() => {
    // 非 dark 模式：立即停止周期，隐藏星星，清理
    if (!isDark) {
      clearCycle()
      setVisible(false)
      // 600ms 后清空 stars（等 CSS transition 完成）
      setTimeout(() => setStars([]), 600)
      return
    }
    
    // dark 模式：启动周期性星星
    const startCycle = () => {
      // 步骤 1: 生成新星星
      setStars(generateStars())
      
      // 步骤 2: 100ms 后显示（让 React 先渲染 DOM，再触发 transition）
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      
      // 步骤 3-4: X 秒后隐藏并清理
      const displayDuration = 4000 + Math.random() * 2000 // 4-6s
      cycleTimerRef.current = setTimeout(() => {
        setVisible(false)
        setTimeout(() => setStars([]), 600) // 等 CSS transition
      }, displayDuration)
      
      // 步骤 5-6: 再等 Y 秒后重新开始
      const waitDuration = 8000 + Math.random() * 12000 // 8-20s
      cycleTimerRef.current = setTimeout(() => {
        startCycle() // 递归
      }, displayDuration + 600 + waitDuration)
    }
    
    startCycle()
    
    return () => clearCycle()
  }, [isDark])
  
  // 渲染逻辑不变：当非 dark 且无 stars 时不渲染
}
```

**关键点**：
- `generateStars()` 改为返回 3-5 颗
- `cycleTimerRef` 统一管理所有 setTimeout，cleanup 时全部清除
- 使用双重 `requestAnimationFrame` 确保 CSS transition 能正确触发
- 显示时长 4-6s（含闪烁动画），隐藏后等待 8-20s 再出现下一批
- 当 `isDark` 变为 false 时立即停止并清理

---

### 步骤 3：验证 — 不影响其他文件

- `src/App.tsx`：无需改动，`<DarkModeStars />` 使用方式不变
- `src/config/themeAnimationConfig.ts`：STARS 配置用于主题过渡动画（一次性），与常态化周期性星星职责不同，**不改动**
- `src/components/common/ThemePageEffect.tsx`：主题切换过渡动画，**不改动**
- `src/styles/animations.css`：`starGlowAndFade` 系列用于过渡动画，**不改动**

---

## 预期效果

暗色模式下：
1. 首次进入约 100ms 后，3-5 颗星星出现在屏幕随机位置
2. 每颗星星以不同的 delay/duration 独立闪烁（`dmStarTwinkle` 动画）
3. 约 4-6s 后所有星星一起淡出消失
4. 约 8-20s 后，新一批 3-5 颗星星在新随机位置出现
5. 以上循环持续进行
6. 切换到亮色模式时立即停止并清理

亮色模式下：完全不渲染星星 DOM。
