# Tasks

- [x] Task 1: 确认布局对齐的精确数值关系
  - [x] SubTask 1.1: 确认 sidebar 在 classic 模式下的总占用宽度（width + border-right，box-sizing: border-box 下 width=240px 已含 border）
  - [x] SubTask 1.2: 确认 sidebar 在 immersive 模式下的总占用宽度（width + border + margin: 6px，总占用 = 6+240+6 = 252px）
  - [x] SubTask 1.3: 确认 main-content 左边界位置 = sidebar 的 offsetLeft + offsetWidth + margin-right
  - [x] SubTask 1.4: 确认 request-toolbar 的 padding-left (16px) 不影响 main-content 左边界

- [x] Task 2: 修改 app-menu.css 使 AppMenu 宽度与 sidebar 总占用宽度一致
  - [x] SubTask 2.1: Classic 模式：`.tb-app-menu { width: var(--sidebar-width); }` (240px)
  - [x] SubTask 2.2: Immersive 模式：`margin-left: 6px; width: calc(var(--sidebar-width) + 6px);` (总占用 = 6+246 = 252px)
  - [x] SubTask 2.3: 折叠状态 Classic：`width: 48px`
  - [x] SubTask 2.4: 折叠状态 Immersive：`margin-left: 6px; width: calc(48px + 6px);` (总占用 = 6+54 = 60px)

- [x] Task 3: 修改 context-area.css 确保 GET badge 紧贴 AppMenu 右边缘
  - [x] SubTask 3.1: 确保 `padding-left: 0`（已确认）
  - [x] SubTask 3.2: 删除 immersive 模式下不需要的 padding-right 补偿

- [x] Task 4: 验证对齐效果
  - [x] SubTask 4.1: 代码审查确认数值正确
  - [x] SubTask 4.2: Classic 模式：AppMenu 240px = sidebar 240px ✅
  - [x] SubTask 4.3: Immersive 模式：AppMenu 252px = sidebar 252px ✅
  - [x] SubTask 4.4: TypeScript 编译通过（CSS 修改不影响 TS）

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2 and Task 3
