# Tasks

- [x] Task 1: 重构 theme-transitioning 过渡机制（P0 - 关键性能优化）
  - [x] SubTask 1.1: 分析并列出实际需要过渡的元素类型和属性（替代通配符选择器）
  - [x] SubTask 1.2: 在 `global.css` 中重构 `.theme-transitioning` 选择器，使用具体的选择器列表（如 `.theme-transitioning .sidebar, .theme-transitioning .request-panel, ...`）替代 `*`
  - [x] SubTask 1.3: 实现过渡属性白名单机制，仅对确实变化的属性应用 transition
  - [x] SubTask 1.4: 测试验证：确保主题切换视觉效果保持一致，同时性能提升明显

- [x] Task 2: 实现 backdrop-filter 延迟激活策略（P0 - 关键性能优化）
  - [x] SubTask 2.1: 在 `useThemeStore.ts` 的 `setVisualStyle` 方法中添加延迟激活逻辑
  - [x] SubTask 2.2: 创建 CSS 类 `.backdrop-filter-pending` 用于延迟激活状态
  - [x] SubTask 2.3: 在相关 CSS 文件中为所有 backdrop-filter 元素添加条件激活规则
  - [x] SubTask 2.4: 使用 setTimeout/requestAnimationFrame 在切换动画完成后 200ms 激活 backdrop-filter
  - [x] SubTask 2.5: 测试验证：切换时流畅度提升，激活后玻璃效果正常显示

- [x] Task 3: 降低默认模糊半径和简化阴影（P1 - 重要优化）
  - [x] SubTask 3.1: 在 `global.css` 的 immersive 变量定义中降低 --glass-blur-sm/md/lg 值（降低 25%）
  - [x] SubTask 3.2: 简化 glass-elevation 阴影（从双层改为单层）
  - [x] SubTask 3.3: 条件性移除或简化 glass-inner-shadow
  - [x] SubTask 3.4: 测试验证：视觉保真度在可接受范围内，性能明显改善

- [x] Task 4: 添加 GPU 加速提示（P1 - 重要优化）
  - [x] SubTask 4.1: 为所有使用 backdrop-filter 的元素添加 `will-change: backdrop-filter`
  - [x] SubTask 4.2: 为持续运行动画的元素添加对应的 will-change 提示（ambientShift、logoBreathe 等）
  - [x] SubTask 4.3: 为参与主题切换的主要容器元素添加 `will-change: background-color, color, border-color, box-shadow`
  - [x] SubTask 4.4: 对关键合成层元素使用 `transform: translateZ(0)` 强制 GPU 加速
  - [x] SubTask 4.5: 测试验证：无负面副作用，GPU 内存占用合理

- [x] Task 5: 优化 CSS 变量更新策略（P1 - 重要优化）
  - [x] SubTask 5.1: 在 `useThemeStore.ts` 中重构 `applyAccent` 方法，使用 requestAnimationFrame 批量执行 style.setProperty
  - [x] SubTask 5.2: 确保所有 DOM 写操作（setAttribute、setProperty）在同一帧内完成
  - [x] SubTask 5.3: 添加防抖/节流机制防止快速连续切换时的性能问题
  - [x] SubTask 5.4: 测试验证：减少布局抖动，切换响应更快

- [x] Task 6: 优化持续动画性能（P2 - 推荐优化）
  - [x] SubTask 6.1: 优化 ambientShift 动画：降低更新频率（延长至 120s 或使用 steps()）
  - [x] SubTask 6.2: 实现点阵纹理的条件渲染逻辑（通过 CSS 变量控制透明度）
  - [x] SubTask 6.3: 优化 logoBreathe 动画：考虑改用 opacity-only 动画或降低 drop-shadow 复杂度
  - [x] SubTask 6.4: 测试验证：动画流畅度提升，CPU/GPU 占用降低

- [x] Task 7: 实现性能分级系统（P2 - 推荐优化）
  - [x] SubTask 7.1: 创建 `usePerformanceTier` hook 或工具函数，用于检测设备性能等级
  - [x] SubTask 7.2: 实现 FPS 监测机制（基于 requestAnimationFrame 时间戳差值）
  - [x] SubTask 7.3: 定义三级性能配置（Tier 1/2/3）及其对应的 CSS 变量覆盖值
  - [x] SubTask 7.4: 在 `global.css` 中添加 `[data-performance-tier="2"]` 和 `[data-performance-tier="3"]` 选择器覆盖
  - [x] SubTask 7.5: 在 `useThemeStore.ts` 中集成性能等级检测和应用逻辑
  - [x] SubTask 7.6: 测试验证：自动分级准确，不同等级下性能表现符合预期

- [x] Task 8: 实现性能分析 API（P3 - 理想功能）
  - [x] SubTask 8.1: 创建 `PerformanceProfiler` 工具类，用于测量主题切换耗时
  - [x] SubTask 8.2: 在 setMode/setVisualStyle 方法中集成性能测量点
  - [x] SubTask 8.3: 实现开发模式下的控制台输出（耗时、FPS 掉帧数等）
  - [x] SubTask 8.4: 添加性能阈值告警（>100ms 时警告）
  - [x] SubTask 8.5: 测试验证：数据准确，有助于后续优化决策

# Task Dependencies
- [Task 2] depends on [Task 1] （backdrop-filter 延迟依赖过渡机制重构完成）
- [Task 3] can be done in parallel with [Task 1, Task 2]
- [Task 4] can be done in parallel with [Task 1, Task 2, Task 3]
- [Task 5] depends on [Task 1] （CSS 变量优化应在过渡机制重构后进行）
- [Task 6] can be done in parallel with [Task 3, Task 4]
- [Task 7] depends on [Task 3, Task 4, Task 6] （性能分级需要先完成基础优化）
- [Task 8] can be done last (独立功能，依赖其他任务提供的测量点)

## 并行执行建议
**Phase 1 (并行)**: Task 1 + Task 3 + Task 4
**Phase 2 (串行)**: Task 2 (依赖 Task 1) + Task 5 (依赖 Task 1)
**Phase 3 (并行)**: Task 6
**Phase 4 (串行)**: Task 7 (依赖 Phase 1-3)
**Phase 5 (独立)**: Task 8

预计总工作量：中等复杂度（8 个主要任务，其中多个可并行执行）
