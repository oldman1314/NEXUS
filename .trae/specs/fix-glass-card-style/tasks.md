# Tasks

- [x] Task 1: 核心变量修复 —— global.css 玻璃参数重构
  - [x] SubTask 1.1: 修复浅色模式 `[data-visual-style="immersive"]` 变量组
    - `--glass-bg`: rgba(255,255,255,0.62) → rgba(255,255,255,0.48)
    - `--glass-border`: rgba(255,255,255,0.35) → rgba(0,0,0,0.10)
    - `--glass-border-subtle`: rgba(255,255,255,0.25) → rgba(0,0,0,0.06)
    - `--glass-border-pronounced`: rgba(255,255,255,0.5) → rgba(0,0,0,0.15)
    - `--glass-border-gradient`: 改为深色调渐变
    - `--glass-elevation-1/2/3`: 阴影 opacity 提升 60~100%
    - `--glass-highlight`: 高光增强至 rgba(255,255,255,0.65)
    - `--glass-inner-shadow`: 调整底部暗边
    - `--bg-canvas` / `--bg-canvas-end`: 增大色差至 #e8eaed / #dce0e6
  - [x] SubTask 1.2: 修复深色模式 `[data-visual-style="immersive"][data-theme="dark"]` 变量组
    - `--glass-bg`: rgba(28,28,35,0.68) → rgba(28,28,35,0.58)
    - `--glass-border`: rgba(255,255,255,0.15) → rgba(255,255,255,0.20)
    - `--glass-border-subtle`: rgba(255,255,255,0.08) → rgba(255,255,255,0.12)
    - `--glass-border-pronounced`: rgba(255,255,255,0.2) → rgba(255,255,255,0.28)
    - `--glass-border-gradient`: 增强白色调
    - `--glass-elevation-1/2/3`: 适当提升扩散
    - `--glass-highlight`: 高光增强至 rgba(255,255,255,0.16)
    - `--bg-canvas` / `--bg-canvas-end`: 微调至 #10101c / #181838

- [x] Task 2: 请求/响应面板卡片样式优化（request-view.css）
  - [x] SubTask 2.1: 确保 `.request-panel` / `.response-panel` 的 immersive 样式正确应用新变量
  - [x] SubTask 2.2: 检查并修复 `.request-toolbar` 在 immersive 下的背景处理（应透明或玻璃化）
  - [x] SubTask 2.3: 检查 `.panel-tabs` immersive 背景透明化是否完整
  - [x] SubTask 2.4: 检查 `.response-header` / `.response-toolbar` 的背景一致性

- [x] Task 3: 侧边栏玻璃效果验证（sidebar-base.css）
  - [x] SubTask 3.1: 验证侧边栏使用正确的 glass 变量
  - [x] SubTask 3.2: 确保 sidebar::after 高光效果可见

- [x] Task 4: 弹窗/浮层玻璃效果验证
  - [x] SubTask 4.1: 验证 dialog.css 中 modal 的 immersive 样式
  - [x] SubTask 4.2: 验证 command-palette.css 的玻璃效果
  - [x] SubTask 4.3: 验证 context-menu.css 的玻璃效果

- [x] Task 5: 视觉回归测试
  - [x] SubTask 5.1: 浅色主题下检查所有卡片的玻璃效果、边框可见性、阴影层次（18/18 通过，修复 elevation-1 后全部通过）
  - [x] SubTask 5.2: 深色主题下检查所有卡片的玻璃效果、高光质感、色彩协调性
  - [x] SubTask 5.3: 验证 classic 模式无任何影响

# Task Dependencies
- [Task 2, Task 3, Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1, Task 2, Task 3, Task 4]
