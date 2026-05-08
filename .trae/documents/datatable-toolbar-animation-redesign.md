# 数据表工具栏创意动画重构计划

## 一、当前动画实现审计

### 现有动画清单

| 动画名 | 位置 | 效果 | 评价 |
|--------|------|------|------|
| `dt-breathe` | 工具栏加载 | opacity 0.88↔1 呼吸 | ❌ 过于微弱，几乎不可感知 |
| `dt-ripple` | 搜索按钮点击 | 圆形波纹扩散 | ⚠️ 仅搜索按钮有，其他按钮无 |
| `dt-tagFlip` | 密度标签切换 | rotateX 翻转 | ⚠️ 每次渲染都触发，无状态关联 |
| `dt-nodePulse` | 面包屑节点 | box-shadow 脉冲 | ⚠️ 太微弱，3s 周期太慢 |
| `dt-lineGrow` | 面包屑连接线 | 宽度从0增长 | ⚠️ 只在首次出现时有动画 |
| `dt-dotPulse` | 面包屑线端点 | opacity+scale 脉冲 | ⚠️ 同上，太微弱 |
| `dt-chipSlideIn` | 弹出菜单 | translateY+scale | ⚠️ 标准效果，缺乏个性 |
| `dt-shimmer` | 加载进度条 | 水平流光 | ⚠️ 仅在命令栏底部，太隐蔽 |
| `dt-dejavu-in` | 似曾相识提示 | translateY+scale | ✅ 有趣但孤立 |

### 核心问题

1. **动画碎片化** — 各处动画互不关联，没有统一的动画语言
2. **微交互缺失** — 悬停/点击/状态切换的反馈太弱或没有
3. **视觉节奏平淡** — 没有惊喜时刻（delight moment），缺少"哇"的瞬间
4. **加载体验空洞** — 加载时只有呼吸灯和底部shimmer，没有沉浸感
5. **轨道控件静态** — 轨道点(dot)是死物，没有能量流动感
6. **成功反馈单薄** — 只有 border-color 闪烁，没有庆祝感
7. **弹出菜单无聊** — chip-popup 只是标准的 slideIn，没有弹性/个性

---

## 二、新动画设计概念：「Living Circuit」活体电路

核心隐喻：工具栏是一条**活体电路**——数据像电流一样在其中流动，控件像节点一样响应交互，整个系统有生命感。

### 2.1 Command Bar —「能量核心」

**移除当前**：呼吸灯、shimmer 进度条、简单 ripple

**新设计**：

- **待机脉冲**：未聚焦时，命令栏边框有微弱的 accent 色脉冲波沿边框流动（边框跑马灯），暗示「等待输入」
- **聚焦充能**：聚焦时，边框从脉冲变为稳定发光，内部有极微弱的光晕从左向右扫过（类似充电），Sparkles 图标开始缓慢旋转
- **输入共振**：每输入一个字符，命令栏有极微的 scale 弹跳（1→1.005→1），像心跳
- **发射动画**：点击搜索按钮时
  - 按钮先收缩（0.85x），然后爆发式弹出（1.15x→1x），带弹性
  - 从按钮位置向左发射一道光波穿过整个命令栏（光波扫过效果）
  - 命令栏边框短暂变为实心 accent 色，然后渐退回脉冲
- **加载能量流**：加载时
  - 命令栏内部有粒子流从左向右持续流动（用 CSS 渐变动画模拟）
  - 搜索按钮变为旋转状态，旋转时有拖尾效果（用 box-shadow 模拟）
  - 进度条从底部 shimmer 升级为**能量条**——从左到右填充，填充部分有微弱的脉动发光
- **成功庆祝**：查询完成时
  - 命令栏边框闪烁 3 次快速 accent 脉冲
  - 搜索按钮短暂变为 ✓ 图标，带弹性缩放
  - 一道「完成波」从右到左扫过命令栏（与发射方向相反，表示数据回流）

### 2.2 Orbital Controls —「能量轨道」

**移除当前**：静态 dot、简单 hover scale

**新设计**：

- **轨道能量流**：orbital dot 之间有微弱的 accent 色能量脉冲从左到右依次传递（每个 dot 依次亮起再暗下，循环往复），像电路中的信号传递
- **悬停吸引**：鼠标悬停某个 orbital 按钮时
  - 该按钮放大 1.15x + 发光光晕
  - 相邻的 dot 被该按钮「吸引」，微微向按钮方向偏移 1px
  - 按钮下方浮现极短的 tooltip（用 CSS ::after + animation），150ms 淡入
- **点击冲击波**：点击按钮时
  - 按钮先缩小到 0.9x，然后弹回 1.05x→1x（弹性）
  - 从按钮位置向两侧发射极微弱的圆形冲击波（box-shadow 扩散）
- **激活态呼吸**：激活状态的按钮有微弱的 accent 色呼吸（不是整个工具栏呼吸，而是单个按钮），周期 2s
- **密度切换变形**：切换密度时
  - 图标执行一次 360° Y 轴翻转（rotateY），翻转中途切换为新图标
  - 标签文字执行翻牌动画（旧文字向上翻出，新文字从下方翻入）

### 2.3 Segmented Mode —「滑动舱门」

**移除当前**：简单 translateX 滑动

**新设计**：

- **高亮块滑动**：高亮块移动时
  - 先微微抬起（scaleY 1.05），滑动到目标位置，再落下（scaleY 回到 1）
  - 移动过程中有极微弱的运动模糊效果（用 box-shadow 水平拉伸模拟）
- **文字切换**：切换时，旧文字 fadeOut+向上微移，新文字 fadeIn+从下方微移进入，形成接力感
- **点击反馈**：点击时，被点击的按钮有微弱的按下效果（translateY 1px）

### 2.4 Chip Popups —「弹性展开」

**移除当前**：标准 chipSlideIn

**新设计**：

- **弹性展开**：弹出菜单从按钮位置展开
  - 先从 0.9x 快速放大到 1.05x，再弹回 1x（弹性曲线）
  - 同时从按钮位置向下偏移 8px→0px
  - 背景有极微弱的 accent 色边框发光脉冲（出现时闪一下）
- **项目依次入场**：弹出菜单内的每个 item 依次入场（stagger），每项延迟 30ms
  - 从右侧微偏移 + 透明 → 原位 + 不透明
- **关闭收缩**：关闭时快速缩小到 0.95x + fadeOut，而非直接消失

### 2.5 Breadcrumb Trail —「数据流」

**移除当前**：nodePulse、lineGrow、dotPulse

**新设计**：

- **节点呼吸**：节点有更明显的脉冲，周期 2s，box-shadow 从 0 扩展到 6px
- **连接线能量脉冲**：连接线不再是静态渐变，而是有光点从左到右持续流动
  - 用 CSS 动画让渐变背景持续移动，模拟能量脉冲
  - 光点到达右端节点时，节点短暂增亮
- **流动粒子**：连接线上有 2-3 个微小的光点持续从左向右移动（用 ::before/::after + animation-delay 模拟）

### 2.6 进度条 —「能量填充」

**移除当前**：简单宽度过渡

**新设计**：

- **能量条**：进度条从底部 2px 升级为 3px
  - 已填充部分有持续的微弱脉动发光
  - 填充前沿有一个更亮的光点
  - 完成时，整条进度条闪烁一次然后渐隐

### 2.7 全局微交互升级

- **所有按钮**：统一点击反馈——缩至 0.92x → 弹回 1.02x → 1x，总时长 200ms
- **所有弹出层**：统一弹性展开 + stagger 入场
- **Dejavu 提示**：保留但增强——出现时命令栏边框短暂变为渐变色（accent→warning→accent），增加戏剧感
- **刷新按钮**：加载时旋转，但加入加速→匀速→减速的缓动，而非线性旋转

---

## 三、实施步骤

### 阶段一：彻底移除当前动画实现

1. **移除 TSX 中的动画状态和逻辑**
   - 移除 `ripple` 状态和 `fireRipple` 函数
   - 移除 `successFlash` 状态和相关 useEffect
   - 移除 `dejavuTip` 状态和 DEJAVU_TIPS 常量
   - 移除 typewriter 相关的所有状态和 useEffect（typewriterIndex, typewriterCharIndex, typewriterDeleting, typewriterPaused）
   - 简化 handleCommandChange 回调（移除 dejavu 检测逻辑）

2. **移除 CSS 中所有工具栏动画**
   - 删除 `@keyframes dt-breathe`
   - 删除 `@keyframes dt-ripple`
   - 删除 `@keyframes dt-tagFlip`
   - 删除 `@keyframes dt-nodePulse`
   - 删除 `@keyframes dt-lineGrow`
   - 删除 `@keyframes dt-dotPulse`
   - 删除 `@keyframes dt-chipSlideIn`
   - 删除 `@keyframes dt-dejavu-in`
   - 删除所有引用这些动画的 CSS 规则
   - 删除 `.dt-command-bar__ripple` 样式
   - 删除 `.dt-command-bar__shimmer` 样式
   - 删除 `.dt-dejavu-tip` 样式
   - 删除 `.dt-toolbar--loading` 呼吸灯
   - 删除 `.dt-toolbar--success` 闪烁
   - 删除 `.dt-breadcrumb-trail__node--pulse` 动画
   - 删除 `.dt-breadcrumb-trail__line` lineGrow 动画
   - 删除 `.dt-breadcrumb-trail__line::after` dotPulse 动画
   - 删除 `.dt-orbital__tag` tagFlip 动画
   - 清理 reduced-motion 中对应的引用

### 阶段二：重新实现创意动画

3. **Command Bar 能量核心动画**
   - 边框脉冲跑马灯（border 动画，accent 色沿边框流动）
   - 聚焦充能效果（稳定发光 + 内部光晕扫过）
   - 输入心跳（字符输入时微弱 scale 弹跳）
   - 发射动画（按钮弹性 + 光波扫过 + 边框闪烁）
   - 加载能量流（内部粒子流动 + 按钮旋转拖尾 + 能量进度条）
   - 成功庆祝（边框脉冲 + ✓ 图标弹性 + 完成波回流）

4. **Orbital 能量轨道动画**
   - 轨道 dot 能量脉冲传递（依次亮起循环）
   - 悬停吸引效果（相邻 dot 偏移）
   - 点击冲击波（弹性缩放 + box-shadow 扩散）
   - 激活态呼吸（单个按钮呼吸）
   - 密度切换变形（rotateY 翻转 + 翻牌标签）

5. **Segmented 滑动舱门动画**
   - 高亮块抬起-滑动-落下
   - 文字接力切换
   - 点击微弱按下

6. **Chip Popup 弹性展开动画**
   - 弹性展开（0.9→1.05→1x）
   - 项目 stagger 入场
   - 关闭收缩动画

7. **Breadcrumb 数据流动画**
   - 节点增强脉冲
   - 连接线能量脉冲流动
   - 流动粒子效果

8. **进度条能量填充**
   - 脉动发光
   - 填充前沿光点
   - 完成闪烁渐隐

9. **全局微交互统一**
   - 统一按钮点击弹性
   - 统一弹出层展开
   - Dejavu 增强戏剧感
   - 刷新按钮缓动旋转

### 阶段三：CSS 动画编写

10. **编写所有新 keyframes**
    - `dt-borderPulse` — 边框跑马灯
    - `dt-innerSweep` — 内部光晕扫过
    - `dt-heartbeat` — 输入心跳
    - `dt-launchWave` — 发射光波
    - `dt-energyFlow` — 加载能量流
    - `dt_successPulse` — 成功脉冲
    - `dt_completeWave` — 完成波回流
    - `dt_dotSignal` — dot 信号传递
    - `dt_clickShock` — 点击冲击波
    - `dt_btnBreathe` — 按钮呼吸
    - `dt_flipIn` — Y轴翻转入场
    - `dt_labelFlip` — 标签翻牌
    - `dt_doorSlide` — 舱门滑动
    - `dt_textRelay` — 文字接力
    - `dt_elasticPop` — 弹性展开
    - `dt_staggerIn` — stagger 入场
    - `dt_shrinkOut` — 收缩关闭
    - `dt_energyPulse` — 连接线能量脉冲
    - `dt_particleFlow` — 粒子流动
    - `dt_progressGlow` — 进度条脉动
    - `dt_progressComplete` — 进度条完成
    - `dt_easeSpin` — 缓动旋转

11. **更新所有组件样式引用新动画**
12. **更新响应式和 reduced-motion**
13. **更新暗色主题和沉浸模式**

### 阶段四：验证

14. **TypeScript 编译验证**
15. **Vite 构建验证**
16. **功能验证** — 所有交互正常
17. **动画验证** — 流畅、有趣、不卡顿
18. **主题验证** — 暗色/沉浸模式正常

---

## 四、涉及文件

| 文件 | 操作 |
|------|------|
| `src/components/data-table/DataTableToolbar.tsx` | 移除旧动画逻辑 + 添加新动画状态 |
| `src/components/data-table/data-table.css` | 移除旧动画样式 + 编写新动画 |

---

## 五、设计原则

1. **有生命感** — 每个元素都有微弱的「呼吸」，整个工具栏像活的一样
2. **能量流动** — 动画方向暗示数据流向，从输入→处理→输出
3. **弹性优先** — 所有交互反馈用弹性曲线，而非线性或简单 ease
4. **惊喜时刻** — 关键操作（搜索/成功）有戏剧性动画，让用户会心一笑
5. **克制精致** — 待机动画极微弱（几乎潜意识级别），交互反馈即时但不过分
6. **性能优先** — 所有动画仅使用 transform/opacity/box-shadow，不触发 layout/paint
