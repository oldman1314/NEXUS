# Tasks

- [x] Task 1: 覆盖 immersive 模式下的背景变量（global.css）
  - [x] SubTask 1.1: 在浅色 `[data-visual-style="immersive"]` 中添加：
    - `--bg-sidebar: rgba(255, 255, 255, 0.06)`（半透明，与 glass-bg 协调但更轻）
    - `--bg-input: rgba(255, 255, 255, 0.55)`（输入框半透明，保持可读性）
    - `--bg-tertiary: rgba(255, 255, 255, 0.12)`（辅助区域微透明）
    - `--border-light: rgba(0, 0, 0, 0.08)`（边框与玻璃风格协调）
  - [x] SubTask 1.2: 在深色 `[data-visual-style="immersive"][data-theme="dark"]` 中添加：
    - `--bg-sidebar: rgba(255, 255, 255, 0.04)`
    - `--bg-input: rgba(255, 255, 255, 0.08)`
    - `--bg-tertiary: rgba(255, 255, 255, 0.06)`
    - `--border-light: rgba(255, 255, 255, 0.10)`

- [x] Task 2: 验证侧边栏玻璃效果完整性
  - [x] SubTask 2.1: 确认 fallback 路径中 `.sidebar` 的 `var(--bg-sidebar)` 现在是半透明的
  - [x] SubTask 2.2: 确认 sidebar 内部子元素（section-header、sidebar-footer）的样式正确

- [x] Task 3: 验证响应面板内层玻璃化
  - [x] SubTask 3.1: 确认 body-editor-wrapper 使用 `var(--bg-input)` 现在是半透明的
  - [x] SubTask 3.2: 确认 body-line-numbers 使用 `var(--bg-tertiary)` 现在是半透明的
  - [x] SubTask 3.3: 确认所有 params/headers 输入框的背景都是半透明的

- [x] Task 4: 视觉回归验证
  - [x] SubTask 4.1: 验证浅色模式下侧边栏有明显的玻璃质感
  - [x] SubTask 4.2: 验证深色模式下侧边栏有明显的玻璃质感
  - [x] SubTask 4.3: 验证响应面板内层不再是实色 classic 风格
  - [x] SubTask 4.4: 验证 classic 模式不受影响

# Task Dependencies
- [Task 2, Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1, Task 2, Task 3]
