# Remote Tool 专属视觉效果与交互体验 — 实施计划

## 一、设计概览

### 1.1 核心概念：WarpTunnel（曲速隧道）

为 Remote Tool 功能模块设计 **"曲速隧道"** 主题的 CreativeBar，灵感来源于 SSH 隧道、远程连接的"穿越空间"概念。与现有三个 CreativeBar 形成鲜明对比：

| 视图 | CreativeBar | 主题隐喻 | 视觉风格 |
|------|-------------|----------|----------|
| Request | DroneBar | 无人机投递 | 机械/物流 |
| Workflow | CircuitBar | 电路信号传输 | 电子/芯片 |
| Data Table | DataPulseBar | 数据管道脉冲 | 工业/管道 |
| **Remote Tools** | **WarpTunnelBar** | **曲速隧道穿越** | **科幻/空间** |

### 1.2 视觉元素

**整体布局**：`[本地网关] ─── [曲速隧道] ─── [远程信标]`

- **本地网关（LocalGateway）**：左侧，终端/传送门图标，代表本地机器
- **曲速隧道（WarpTunnel）**：中间，具有深度透视的汇聚光线 + 流动粒子，代表 SSH 隧道/远程连接
- **远程信标（RemoteBeacon）**：右侧，服务器/信号塔图标，代表远程服务器

### 1.3 动画状态机

```
idle → connecting → connected → idle
  ↓                    ↓
error ←───────────────┘
```

| 状态 | 视觉表现 |
|------|----------|
| `idle` | 网关柔和脉冲，隧道暗淡偶有粒子飘过，信标微弱呼吸 |
| `connecting` | 本地网关亮起，隧道开始形成（光线汇聚），信标搜索信号 |
| `connected` | 全速曲速效果，粒子流高速穿越，双端网关全亮 |
| `error` | 隧道不稳定闪烁（红色），连接断裂火花，信标显示错误 |

### 1.4 交互设计

- **悬停**：隧道效果增强，粒子加速，网关发光增强
- **点击**：触发"脉冲爆发"效果（全隧道闪光波）
- **连击系统**：连续成功连接累计连击，3级递增发光（与 DroneBar/CircuitBar 一致）
- **语音气泡**：趣味状态消息，如 "Tunneling... 🌀"、"Warp speed! 🚀"、"Connection lost! 💥"
- **空闲休眠**：20秒无操作后进入休眠，粒子减速，网关半透明

---

## 二、文件清单

### 2.1 新建文件

| 文件 | 用途 |
|------|------|
| `src/components/layout/titlebar/WarpTunnelBar.tsx` | 曲速隧道 CreativeBar 组件 |
| `src/components/layout/titlebar/warp-tunnel-bar.css` | 曲速隧道样式与动画 |
| `src/stores/useRemoteToolsAnimationStore.ts` | Remote Tools 动画状态管理 |
| `src/hooks/useWarpTunnelAnimation.ts` | 曲速隧道位置动画 hook |

### 2.2 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/components/layout/TitleBar.tsx` | 添加 WarpTunnelBar 分支，remote-tools 视图不再回退到 DroneBar |
| `src/components/layout/sidebar/SidebarNav.tsx` | 为 Remote Tools 按钮添加专属样式类 |
| `src/components/layout/sidebar/sidebar-nav.css` | 添加 Remote Tools 按钮专属激活态样式（曲速发光效果） |
| `src/types/index.ts` | 添加 `WarpTunnelState` 类型定义 |

---

## 三、详细实施步骤

### 步骤 1：定义类型

**文件**：`src/types/index.ts`

添加 `WarpTunnelState` 类型：

```typescript
export type WarpTunnelState = 'idle' | 'connecting' | 'connected' | 'error'
```

### 步骤 2：创建动画状态管理

**文件**：`src/stores/useRemoteToolsAnimationStore.ts`

基于 `useAnimationStore` 的模式，创建 Remote Tools 专属动画 store：

- **状态字段**：
  - `tunnelState: WarpTunnelState` — 隧道状态
  - `activeSessions: number` — 活跃会话数
  - `errorMessage: string` — 错误消息
  - `comboCount: number` — 连击数
  - `showComboText: boolean` — 是否显示连击文字
  - `comboLevel: number` — 连击等级
  - `particleBurst: boolean` — 粒子爆发
  - `isSleeping: boolean` — 休眠状态

- **动作**：
  - `startConnecting()` — 开始连接（idle → connecting）
  - `connectionSuccess()` — 连接成功（connecting → connected，1.5s 后 → idle）
  - `connectionError(message?)` — 连接失败（→ error，1.8s 后 → idle）
  - `triggerParticleBurst()` — 触发粒子爆发
  - `resetCombo()` — 重置连击
  - `cleanup()` — 清理定时器

- **连击逻辑**：30秒内连续成功连接累计，3/5/10 次对应 1/2/3 级

### 步骤 3：创建位置动画 Hook

**文件**：`src/hooks/useWarpTunnelAnimation.ts`

参考 `useDroneAnimation` 和 `useCircuitAnimation` 的模式：

- 使用 `requestAnimationFrame` 驱动信号粒子在隧道中的位置动画
- 计算本地网关到远程信标之间的距离
- 根据状态切换动画目标位置和缓动函数
- 支持 `data-performance-tier` 性能降级

### 步骤 4：创建 WarpTunnelBar 组件

**文件**：`src/components/layout/titlebar/WarpTunnelBar.tsx`

组件结构：

```
WarpTunnelBar
├── ComboDisplay（连击显示）
├── LocalGateway（本地网关图标）
├── WarpTunnelArea（隧道区域）
│   ├── WarpSignal（信号粒子，带位置动画）
│   ├── WarpSpeechBubble（语音气泡）
│   └── WarpCrashEffect（错误特效）
└── RemoteBeacon（远程信标图标）
```

**子组件详细设计**：

#### LocalGateway
- SVG 图标：圆形传送门 + 终端符号 `>_`
- 状态变化：
  - idle：柔和脉冲发光
  - connecting：门环旋转加速，亮度增加
  - connected：全亮 + 外环光晕
  - error：红色闪烁

#### WarpTunnelArea
- 隧道背景：3-4条汇聚线（透视效果），从左到右收窄再展开
- 流动粒子：小圆点沿隧道路径移动
- 状态变化：
  - idle：线条半透明，偶有粒子
  - connecting：线条从左向右亮起，粒子开始流动
  - connected：全速粒子流，线条高亮
  - error：线条抖动，红色闪烁，火花

#### WarpSignal
- 中心信号图标：小型飞船/数据包 SVG
- 使用 `useWarpTunnelAnimation` hook 控制位置
- 浮动动画（bob）+ 状态变化

#### RemoteBeacon
- SVG 图标：信号塔 + 服务器符号
- 状态变化：
  - idle：微弱呼吸
  - connecting：搜索信号脉冲
  - connected：信号满格 + 接收脉冲
  - error：信号断裂 + 烟雾

#### WarpSpeechBubble
- 与 DroneBar/CircuitBar 的语音气泡模式一致
- 消息列表：
  - idle: ['Ready! ✨', 'Standing by~', 'Awaiting signal... 📡']
  - connecting: ['Tunneling... 🌀', 'Establishing link~', 'Warp drive charging! ⚡']
  - connected: ['Warp speed! 🚀', 'Tunnel stable!', 'Connected! 🌐']
  - error: ['Connection lost! 💥', 'Tunnel collapsed! 🆘', 'Signal jammed! ⚠️']
- 休眠消息: ['*static* 💤', '*zzz* 😴', 'Hibernating... 🥱']

#### WarpCrashEffect
- 错误时的烟雾粒子效果
- 错误文字提示

### 步骤 5：创建样式文件

**文件**：`src/components/layout/titlebar/warp-tunnel-bar.css`

**关键帧动画**：

```css
/* 网关脉冲 */
@keyframes warpGatePulse { ... }

/* 网关门环旋转 */
@keyframes warpGateRingSpin { ... }

/* 隧道线条流动 */
@keyframes warpLineFlow { ... }

/* 粒子穿越 */
@keyframes warpParticleStream { ... }

/* 信号浮动 */
@keyframes warpSignalBob { ... }

/* 信标呼吸 */
@keyframes warpBeaconBreathe { ... }

/* 信标信号脉冲 */
@keyframes warpBeaconSignalPulse { ... }

/* 信标搜索脉冲 */
@keyframes warpBeaconSearchPulse { ... }

/* 隧道不稳定（错误） */
@keyframes warpDestabilize { ... }

/* 火花闪烁 */
@keyframes warpSparkBlink { ... }

/* 烟雾 */
@keyframes warpSmoke { ... }

/* 错误文字 */
@keyframes warpCrashText { ... }

/* 休眠浮动 */
@keyframes warpSleepBob { ... }

/* 休眠LED */
@keyframes warpLedSleep { ... }

/* 连击显示 */
@keyframes comboAppear { ... }
@keyframes comboPulse { ... }
```

**Immersive 模式增强**：
- `filter: drop-shadow(0 0 4px var(--accent-glow))` 整体发光
- 语音气泡使用强调色半透明背景
- 网关/信标激活时 SVG 元素使用强调色

**性能降级**：
- Tier 2：动画减速（2x 时长）
- Tier 3：禁用装饰性动画
- `prefers-reduced-motion`：所有动画 `0.01ms`

### 步骤 6：集成到 TitleBar

**文件**：`src/components/layout/TitleBar.tsx`

修改 `renderCreativeBar()` 函数：

```tsx
const renderCreativeBar = () => {
  switch (view) {
    case 'workflow':
      return <CircuitBar />
    case 'data-table':
      return <DataPulseBar />
    case 'remote-tools':
      return <WarpTunnelBar />
    default:
      return <DroneBar />
  }
}
```

添加 import：
```tsx
import WarpTunnelBar from './titlebar/WarpTunnelBar'
```

### 步骤 7：增强侧边栏导航按钮

**文件**：`src/components/layout/sidebar/SidebarNav.tsx`

为 Remote Tools 按钮添加专属 CSS 类名 `nav-item--remote-tools`。

**文件**：`src/components/layout/sidebar/sidebar-nav.css`

添加 Remote Tools 专属激活态样式：

```css
/* Remote Tools 专属激活态 — 曲速发光效果 */
.nav-item--remote-tools.active {
  background: linear-gradient(135deg, 
    color-mix(in srgb, var(--accent) 8%, transparent), 
    color-mix(in srgb, var(--accent) 4%, transparent));
  color: var(--accent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 15%, transparent),
    0 0 12px color-mix(in srgb, var(--accent) 8%, transparent);
}

.nav-item--remote-tools.active::before {
  background: linear-gradient(to bottom, var(--accent), color-mix(in srgb, var(--accent) 60%, cyan));
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 40%, cyan),
    0 0 16px color-mix(in srgb, var(--accent) 20%, transparent);
  animation: warpNavIndicatorPulse 2s ease-in-out infinite;
}

@keyframes warpNavIndicatorPulse {
  0%, 100% { box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 40%, cyan); }
  50% { box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 60%, cyan), 0 0 20px color-mix(in srgb, var(--accent) 20%, transparent); }
}
```

与 Requests 按钮的激活态对比：
- Requests：标准渐变背景 + 左侧竖线 + 强调色文字
- Remote Tools：更深的渐变背景 + 外发光阴影 + 左侧竖线带脉冲动画 + 青色混合光晕

---

## 四、与现有模块的差异化对比

| 维度 | Requests (DroneBar) | Remote Tools (WarpTunnelBar) |
|------|---------------------|------------------------------|
| 主题 | 无人机物流投递 | 曲速隧道穿越 |
| 色调 | 强调色为主 | 强调色 + 青色混合 |
| 动画风格 | 机械运动（螺旋桨、摆动） | 空间扭曲（汇聚线、粒子流） |
| 交互反馈 | 无人机飞行/坠毁 | 隧道建立/断裂 |
| 侧边栏按钮 | 标准渐变激活态 | 曲速发光脉冲激活态 |
| 空闲状态 | 无人机休眠浮动 | 隧道暗淡粒子飘移 |
| 错误状态 | 坠毁烟雾 | 隧道不稳定火花 |

---

## 五、实施顺序

1. ✅ 类型定义（`WarpTunnelState`）
2. ✅ 动画状态管理（`useRemoteToolsAnimationStore`）
3. ✅ 位置动画 Hook（`useWarpTunnelAnimation`）
4. ✅ 样式文件（`warp-tunnel-bar.css`）
5. ✅ 组件实现（`WarpTunnelBar.tsx`）
6. ✅ TitleBar 集成
7. ✅ 侧边栏按钮增强
8. ✅ 验证与测试

---

## 六、注意事项

- 遵循现有代码风格：CSS 变量、BEM 命名、memo 优化、ErrorBoundary 包裹
- 支持双视觉风格（Classic / Immersive）
- 支持双主题（Light / Dark）
- 支持 6 种强调色
- 支持性能分级（Tier 1/2/3）
- 支持 `prefers-reduced-motion`
- 不添加代码注释（遵循项目规范）
