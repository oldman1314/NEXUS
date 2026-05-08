# Tasks

- [x] Task 1: 修复进度条挤压抖动问题
  - [x] 将 `.request-progress-bar` 从 `position: relative` 改为 `position: absolute`
  - [x] 调整进度条容器样式，确保不占用文档流空间
  - [x] 修改 RequestView.tsx 中进度条渲染逻辑，使用 opacity 控制显示/隐藏

- [x] Task 2: 修复瞌睡时螺旋桨减速问题
  - [x] 检查 `.drone-svg--sleeping .drone-propeller` CSS 选择器优先级
  - [x] 确保瞌睡状态螺旋桨动画时长正确覆盖基础样式（从 0.6s → 4s）
  - [x] 验证 sleeping prop 正确传递到 DroneSVG 组件

- [x] Task 3: 修复无人机移动变小问题
  - [x] 修改 DroneBar.tsx 中 STATE_TARGETS 的 flying 状态 scale 从 0.85 改为 1
  - [x] 修改 hovering 状态 scale 从 0.85 改为 1
  - [x] 保持 launching 状态 scale: 1.05（起飞时的轻微放大效果可保留）

- [x] Task 4: 验证修复效果
  - [x] 运行 TypeScript 类型检查
  - [x] 验证进度条显示/隐藏无布局抖动
  - [x] 验证瞌睡时螺旋桨明显减速
  - [x] 验证无人机飞行时大小保持一致

# Task Dependencies
- [Task 1], [Task 2], [Task 3] 可并行执行
- [Task 4] 依赖 [Task 1], [Task 2], [Task 3]
