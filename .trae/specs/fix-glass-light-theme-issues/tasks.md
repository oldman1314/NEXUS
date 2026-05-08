# Tasks

- [x] Task 1: 补充 immersive 模式 hover/active 变量覆盖（global.css）
  - [x] SubTask 1.1: 在浅色 `[data-visual-style="immersive"]` 中添加/修改：
    - `--bg-hover: rgba(255, 255, 255, 0.15)`（hover 状态半透明，替代深色实色）
    - `--bg-active: rgba(0, 122, 255, 0.15)`（active 状态半透明蓝色）
    - `--border-color: rgba(0, 0, 0, 0.10)`（协调边框色）
  - [x] SubTask 1.2: 在深色 `[data-visual-style="immersive"][data-theme="dark"]` 中添加/修改：
    - `--bg-hover: rgba(255, 255, 255, 0.10)`
    - `--bg-active: rgba(10, 132, 255, 0.20)`
    - `--border-color: rgba(255, 255, 255, 0.14)`

- [x] Task 2: 侧边栏子元素 hover/active 玻璃化（sidebar 系列 CSS）
  - [x] SubTask 2.1: sidebar-collections.css —— hover/active 通过 global.css 变量覆盖自动修复
  - [x] SubTask 2.2: sidebar-nav.css —— hover/active 通过 global.css 变量覆盖自动修复
  - [x] SubTask 2.3: sidebar-history.css —— hover 通过 global.css 变量覆盖自动修复
  - [x] SubTask 2.4: sidebar-footer.css —— hover 通过 global.css 变量覆盖自动修复
  - [x] SubTask 2.5: sidebar-base.css —— icon-btn hover 通过 global.css 变量覆盖自动修复

- [x] Task 3: 响应面板内层完全透明化（request-view.css + body-tab.css + script-tab.css）
  - [x] SubTask 3.1: body-tab.css —— `.body-editor-wrapper` 透明 + glass 边框
  - [x] SubTask 3.2: body-tab.css —— `.body-line-numbers` 透明 + glass 边框
  - [x] SubTask 3.3: body-tab.css —— `.body-toolbar-btn` glass 边框
  - [x] SubTask 3.4: script-tab.css —— `.script-editor-wrapper` 透明 + glass 边框
  - [x] SubTask 3.5: script-tab.css —— `.line-numbers` 透明 + glass 边框
  - [x] SubTask 3.6: script-tab.css —— `.script-console` / `.console-header` glass 边框
  - [x] SubTask 3.7: request-view.css —— `.script-textarea` 透明 + glass 边框
  - [x] SubTask 3.8: request-view.css —— params/headers 表格 th/td glass 边框
  - [x] SubTask 3.9: request-view.css —— `.key-value-input` / `.description-input` 透明 + glass 边框
  - [x] SubTask 3.10: request-view.css —— `.curl-import-dropdown` glass 效果
  - [x] SubTask 3.11: request-view.css —— `.file-input-label` / `.type-toggle` 透明 + glass 边框
  - [x] SubTask 3.12: request-view.css —— `.response-timeout-badge` glass 背景

- [x] Task 4: 视觉回归验证
  - [x] SubTask 4.1: 浅色主题下侧边栏 hover/active 状态保持玻璃质感（--bg-hover 0.15 白色半透明）
  - [x] SubTask 4.2: 浅色主题下响应面板内层无实色块（body-editor/script-textarea/表格/输入框全部透明）
  - [x] SubTask 4.3: 深色主题下效果正常（--bg-hover 0.10 / --bg-active 0.20）
  - [x] SubTask 4.4: Classic 模式不受影响（:root 变量未修改）

# Task Dependencies
- [Task 2, Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1, Task 2, Task 3]
