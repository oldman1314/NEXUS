# 侧边栏折叠状态「人生建议」功能设计方案

## 一、需求分析

侧边栏折叠后宽度仅 48px，4 个导航图标 + 底部折叠按钮占据的空间有限，Nav 与 Footer 之间存在大量纵向空白区域。计划在该空白区域展示「人生建议」，每 2 小时自动更新一条。

## 二、设计方案

### 核心思路：竖排文字 + 悬浮卡片

折叠状态下侧边栏仅 48px 宽，横排文字无法展示。但**中文天然支持竖排书写**，利用 `writing-mode: vertical-rl` 可以在 48px 宽度内优雅地展示竖排人生建议，既充分利用空间，又具有东方美学韵味。

#### 交互设计

| 状态 | 展示方式 |
|------|---------|
| **折叠态（默认）** | 竖排文字，淡色显示，安静不干扰 |
| **折叠态（悬浮）** | 鼠标悬停时，右侧弹出浮动卡片，展示完整横排文字 + 来源 |
| **展开态** | 不显示（展开态有完整内容区，无需此功能） |

#### 视觉设计

- **竖排文字**：使用 `writing-mode: vertical-rl`，字号 `var(--text-xs)`（11px），颜色 `var(--text-tertiary)`，opacity 0.6
- **浮动卡片**：圆角卡片，宽度 220px，带柔和阴影，背景 `var(--bg-panel)`，边框 `var(--border-light)`
- **切换动画**：文字切换时使用淡入淡出过渡（opacity 0 → 1），时长 600ms
- **主题适配**：支持 light / dark / immersive 三套主题，immersive 下使用毛玻璃效果
- **装饰元素**：竖排文字顶部加一个小引号图标（`"`），用 `var(--text-tertiary)` 颜色，opacity 0.3

#### 数据源设计

- 本地 JSON/TS 数组，内置 60+ 条人生建议（覆盖 5 天不重复，每 2 小时一条）
- 每条建议格式：`{ text: string, author?: string }`
- 无外部 API 依赖，确保 Electron 离线可用
- 随机打乱顺序后按序展示，避免短时间内重复

#### 更新机制

- 使用 `useEffect` + `setInterval` 实现 2 小时定时轮换
- 记录 `lastUpdateTime`，组件挂载时检查是否已超过 2 小时，若超过则立即切换
- 切换时使用淡出 → 更新内容 → 淡入的过渡动画
- 清理函数中清除定时器，避免内存泄漏

## 三、文件变更清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `src/components/layout/sidebar/SidebarWisdom.tsx` | 人生建议组件，包含竖排文字展示 + 悬浮卡片逻辑 |
| `src/components/layout/sidebar/sidebar-wisdom.css` | 人生建议样式，包含竖排、悬浮卡片、动画、主题适配 |
| `src/data/wisdom-quotes.ts` | 人生建议数据源，60+ 条中文建议 |

### 修改文件

| 文件路径 | 变更内容 |
|---------|---------|
| `src/components/layout/Sidebar.tsx` | 在 Nav 和 Footer 之间引入 `SidebarWisdom` 组件，仅折叠态显示 |

## 四、详细实现步骤

### 步骤 1：创建数据源 `src/data/wisdom-quotes.ts`

```typescript
export interface WisdomQuote {
  text: string
  author?: string
}

export const wisdomQuotes: WisdomQuote[] = [
  { text: '生活不是等待暴风雨过去，而是学会在雨中跳舞', author: '维维安·格林' },
  { text: '你无法改变风向，但可以调整风帆', author: '吉米·迪恩' },
  // ... 60+ 条
]
```

- 内置 60+ 条精选中文人生建议
- 导出类型 `WisdomQuote` 和数组 `wisdomQuotes`

### 步骤 2：创建 `SidebarWisdom` 组件

组件结构：

```
SidebarWisdom
├── .sidebar-wisdom（竖排文字容器，flex: 1 填充空白）
│   ├── <Quote> 图标（装饰性引号）
│   └── .wisdom-text（竖排文字，writing-mode: vertical-rl）
└── FloatingPortal（悬浮卡片，仅 hover 时显示）
    └── .wisdom-card
        ├── .wisdom-card-text（横排完整文字）
        └── .wisdom-card-author（作者，若有）
```

核心逻辑：

```typescript
// 状态
const [quoteIndex, setQuoteIndex] = useState(() => randomStartIndex())
const [opacity, setOpacity] = useState(1)

// 2 小时定时轮换
useEffect(() => {
  const timer = setInterval(() => {
    setOpacity(0)                    // 淡出
    setTimeout(() => {
      setQuoteIndex(prev => (prev + 1) % wisdomQuotes.length)
      setOpacity(1)                  // 淡入
    }, 600)
  }, 2 * 60 * 60 * 1000)            // 2 小时

  return () => clearInterval(timer)
}, [])
```

悬浮卡片使用项目已有的 `@floating-ui/react` 实现，与 Tooltip 组件保持一致的交互模式。

### 步骤 3：创建样式 `sidebar-wisdom.css`

关键样式：

```css
.sidebar-wisdom {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  overflow: hidden;
}

.wisdom-text {
  writing-mode: vertical-rl;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  opacity: 0.6;
  letter-spacing: 0.15em;
  line-height: 1.8;
  transition: opacity 600ms var(--ease-out-quart);
}

.wisdom-card {
  width: 220px;
  padding: 12px 16px;
  background: var(--bg-panel);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
```

Immersive 主题适配：

```css
[data-visual-style="immersive"] .wisdom-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-md));
  border: 1px solid var(--glass-border);
}
```

### 步骤 4：修改 `Sidebar.tsx` 集成组件

在 Nav 和 Footer 之间添加 SidebarWisdom，仅折叠态渲染：

```tsx
{sidebarCollapsed && <SidebarWisdom />}
```

位置在 `{!sidebarCollapsed && ...}` 条件块之后、`<SidebarFooter />` 之前。

## 五、效果示意

```
折叠态侧边栏（48px宽）：
┌──────┐
│  📤  │  ← Nav: Requests 图标
│  🔀  │  ← Nav: Workflow 图标
│  📊  │  ← Nav: Data Table 图标
│  🖥️  │  ← Nav: Remote Tools 图标
│      │
│  "   │  ← 装饰性引号
│  生  │
│  活  │  ← 竖排人生建议
│  不  │     （淡色，安静）
│  是  │
│  等  │
│  待  │
│  ... │
│      │
│  ◀   │  ← Footer: 展开按钮
└──────┘

悬浮态（鼠标悬停在竖排文字上）：
┌──────┐  ┌─────────────────────────┐
│  📤  │  │  生活不是等待暴风雨过去，  │
│  🔀  │  │  而是学会在雨中跳舞       │
│  📊  │  │              — 维维安·格林 │
│  🖥️  │  └─────────────────────────┘
│  "   │
│  生  │
│  活  │
│  ... │
│  ◀   │
└──────┘
```

## 六、注意事项

1. **文字长度控制**：竖排展示的建议控制在 15-25 字以内，避免超出可视区域
2. **性能**：定时器在组件卸载时必须清理；浮动卡片仅在 hover 时渲染
3. **离线可用**：数据源为本地数组，不依赖网络
4. **主题一致性**：三套主题（light/dark/immersive）均需适配
5. **无障碍**：悬浮卡片内容添加 `role="tooltip"` 和 `aria-label`
