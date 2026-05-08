# 主题切换性能优化 Spec

## Why
当前应用在切换主题（ThemeMode: light/dark 或 VisualStyle: classic/immersive）时存在明显的页面卡顿和不流畅问题。经过代码分析，发现主要性能瓶颈来自：
1. **backdrop-filter 滥用**：全项目 40+ 处使用，这是最昂贵的 CSS 属性之一
2. **全局过渡选择器**：`.theme-transitioning *` 影响所有元素，造成巨大计算开销
3. **持续运行动画**：ambientShift 60s 无限循环 + 点阵网格纹理叠加
4. **大量 CSS 变量同时切换**：100+ 变量同步更新触发大规模重绘
5. **复杂 box-shadow 组合**：玻璃效果的多层阴影增加渲染成本
6. **缺少 GPU 加速优化**：未使用 will-change/transform: translateZ(0) 等 GPU 加速技术

这些问题在 immersive 模式下尤为严重，因为该模式集中了所有昂贵的视觉效果。

## What Changes
- **优化 backdrop-filter 使用策略**：减少模糊半径、限制并发数量、添加条件启用
- **重构 theme-transitioning 过渡机制**：替换全局 * 选择器为目标化选择器
- **优化持续动画性能**：降低 ambientShift 帧率、条件渲染点阵纹理
- **实现 CSS 变量批量更新优化**：减少重绘次数
- **添加 GPU 加速提示**：对关键动画元素使用 will-change
- **实现性能分级策略**：根据设备能力动态调整视觉效果等级
- **BREAKING**: 可能需要降低部分视觉效果的保真度以换取流畅度

## Impact
- Affected specs: 主题系统（useThemeStore）、全局样式（global.css）、动画系统（animations.css）、所有 immersive 相关组件
- Affected code:
  - `src/stores/useThemeStore.ts` —— 优化 setMode/setVisualStyle 方法
  - `src/styles/global.css` —— 重构 .theme-transitioning 选择器 + CSS 变量优化
  - `src/styles/animations.css` —— 优化动画性能
  - `src/styles/app.css` —— 优化氛围背景动画
  - `src/components/layout/sidebar/sidebar-base.css` —— 优化侧边栏玻璃效果
  - `src/components/layout/title-bar.css` —— 优化标题栏玻璃效果
  - `src/components/views/request-view.css` —— 优化面板玻璃效果
  - `src/components/common/command-palette.css` —— 优化命令面板玻璃效果
  - `src/components/common/context-menu.css` —— 优化右键菜单玻璃效果
  - `src/components/dialogs/dialog.css` —— 优化弹窗玻璃效果
  - 所有其他使用 backdrop-filter 的组件

## ADDED Requirements

### Requirement: Performance Profiling API
系统 SHALL 提供主题切换性能分析能力，用于测量和监控切换耗时。

#### Scenario: 测量主题切换耗时
- **WHEN** 用户切换主题或视觉风格
- **THEN** 系统记录切换开始时间、CSS 更新完成时间、首帧渲染时间，并输出到控制台（开发模式）

#### Scenario: 性能阈值告警
- **WHEN** 主题切换耗时超过 100ms
- **THEN** 控制台显示性能警告，提示可能的性能瓶颈

### Requirement: Backdrop Filter Optimization Strategy
系统 SHALL 实现智能的 backdrop-filter 优化策略。

#### Scenario: 降低默认模糊半径
- **WHEN** immersive 模式激活
- **THEN** 默认模糊半径降低 25%（--glass-blur-md: 24px → 18px, --glass-blur-lg: 36px → 27px）

#### Scenario: 限制并发 backdrop-filter 数量
- **WHEN** 页面中同时存在多个 backdrop-filter 元素
- **THEN** 仅对顶层/可见元素应用 backdrop-filter，嵌套或重叠元素回退到半透明纯色背景

#### Scenario: 条件性禁用 backdrop-filter
- **WHEN** 检测到设备性能较低（通过 FPS 监测或用户设置）
- **THEN** 自动禁用所有 backdrop-filter 效果，回退到纯色背景

#### Scenario: 延迟激活 backdrop-filter
- **WHEN** 切换到 immersive 模式
- **THEN** backdrop-filter 在主题切换动画完成后 200ms 再激活（避免切换期间的峰值负载）

### Requirement: Theme Transition Selector Refactor
系统 SHALL 重构 `.theme-transitioning` 全局选择器以提升性能。

#### Scenario: 替换通配符选择器
- **WHEN** 主题切换过渡激活
- **THEN** 不再使用 `.theme-transitioning *` 影响所有元素，改为仅对实际需要过渡的元素类型应用过渡效果（如 background-color, color, border-color, box-shadow 属性变化的元素）

#### Scenario: 减少过渡属性数量
- **WHEN** 主题切换过渡激活
- **THEN** 仅对确实发生变化的属性应用过渡（通过类名白名单机制），而非统一对所有元素应用 4 个属性的过渡

#### Scenario: 缩短过渡时长
- **WHEN** 设备性能较低
- **THEN** 过渡时长从 400ms 缩短至 200ms

### Requirement: Animation Performance Optimization
系统 SHALL 优化 immersive 模式下的动画性能。

#### Scenario: 降低 ambientShift 动画开销
- **WHEN** immersive 模式激活
- **THEN** ambientShift 动画改为使用 transform 替代 background-position（如果可能），或降低更新频率至 30fps（使用 steps(30) 或类似技术）

####Scenario: 条件渲染点阵纹理
- **WHEN** 设备性能较低或用户偏好简化视觉效果
- **THEN** 不渲染点阵网格纹理伪元素（设置 --dot-color: transparent）

#### Scenario: logoBreathe 动画优化
- **WHEN** immersive 模式激活
- **THEN** logoBreathe 动画使用 will-change: filter, opacity 提示浏览器优化，并考虑改用 opacity-only 动画替代 drop-shadow 动画

### Requirement: GPU Acceleration Hints
系统 SHALL 为关键动画元素添加 GPU 加速提示。

#### Scenario: 玻璃效果元素 GPU 加速
- **WHEN** 元素使用 backdrop-filter 或复杂 box-shadow
- **THEN** 添加 `will-change: backdrop-filter` 或 `transform: translateZ(0)` 触发 GPU 合成层

#### Scenario: 持续动画元素 GPU 加速
- **WHEN** 元素具有无限循环动画（如 ambientShift、logoBreathe）
- **THEN** 添加对应的 will-change 提示（will-change: transform, background-position 等）

#### Scenario: 过渡动画元素 GPU 加速
- **WHEN** 元素参与主题切换过渡
- **THEN** 添加 `will-change: background-color, color, border-color, box-shadow`

### Requirement: Performance Tier System
系统 SHALL 实现性能分级系统，根据设备能力自动调整视觉效果。

#### Scenario: 高性能设备（Tier 1）
- **WHEN** 检测到设备为高性能（60fps 稳定，无掉帧）
- **THEN** 启用所有 immersive 效果（完整 backdrop-filter、完整动画、点阵纹理）

#### Scenario: 中等性能设备（Tier 2）
- **WHEN** 检测到设备为中等性能（45-60fps，偶尔掉帧）
- **THEN** 降低模糊半径 30%、禁用点阵纹理、缩短动画时长、减少 box-shadow 复杂度

#### Scenario: 低性能设备（Tier 3）
- **WHEN** 检测到设备为低性能（<45fps，频繁掉帧）
- **THEN** 禁用所有 backdrop-filter、禁用 ambientShift 动画、使用简化的过渡效果（200ms）、移除所有装饰性动画

#### Scenario: 用户手动覆盖
- **WHEN** 用户在设置中选择"性能优先"选项
- **THEN** 强制使用 Tier 3 设置，忽略自动检测结果

### Requirement: CSS Variable Batch Update
系统 SHALL 优化 CSS 变量更新策略以减少重绘次数。

#### Scenario: 批量设置变量
- **WHEN** 调用 applyAccent 或主题切换方法
- **THEN** 将所有 style.setProperty 调用合并到单个微任务或 requestAnimationFrame 中执行，避免多次触发布局抖动

#### Scenario: 避免同步布局读取
- **WHEN** 更新 CSS 变量后
- **THEN** 不立即读取任何布局属性（offsetWidth、getBoundingClientRect 等），将读取延迟到下一帧

## MODIFIED Requirements

### Requirement: Theme Store Performance
修改后的 `useThemeStore` SHALL 在主题切换时采用异步批处理策略。

#### 场景：优化的主题切换流程
- **WHEN** 用户调用 setMode() 或 setVisualStyle()
- **THEN**:
  1. 记录性能起始时间戳
  2. 使用 requestAnimationFrame 批量执行 DOM 操作（setAttribute + style.setProperty）
  3. 延迟激活昂贵效果（backdrop-filter、复杂动画）
  4. 测量并记录性能指标
  5. 根据历史性能数据调整性能等级

### Requirement: Immersive Visual Fidelity Adjustment
修改后的 immersive 模式 SHALL 在保持视觉吸引力的同时优先保证流畅度。

#### 场景：平衡的视觉效果
- **WHEN** immersive 模式激活且设备为 Tier 2
- **THEN**:
  - backdrop-filter blur 半径降低至 18px（原 24px）
  - 移除 glass-inner-shadow（减少一层阴影）
  - glass-elevation 简化为单层阴影
  - ambientShift 动画时长延长至 120s（降低更新频率）
  - 点阵纹理透明度降低 50%

## REMOVED Requirements

无（此优化不移除任何现有功能，仅调整实现方式以提升性能）

## Implementation Notes

### 关键性能指标目标
- 主题切换首帧渲染时间 < 50ms（当前估计 150-300ms）
- 切换期间 FPS 掉帧 < 5 帧
- immersive 模式稳定运行时 FPS ≥ 55（当前可能在 30-45）
- 内存占用增长 < 20%（由于 GPU 合成层）

### 优化优先级排序
1. **P0（必须）**: 重构 .theme-transitioning 选择器 + backdrop-filter 延迟激活
2. **P1（重要）**: 降低模糊半径 + GPU 加速提示 + CSS 变量批量更新
3. **P2（推荐）**: 性能分级系统 + 动画优化 + 条件渲染
4. **P3（理想）**: 性能分析 API + 用户可设置的画质选项

### 兼容性考虑
- 所有优化 MUST 在不支持 backdrop-filter 的环境中正常降级
- 性能分级系统 MUST 有合理的默认值和回退机制
- GPU 加速 hints MUST 不影响不支持 will-change 的旧浏览器
