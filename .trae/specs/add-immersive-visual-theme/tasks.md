# Tasks

- [x] Task 1: 基础设施 —— 类型 + Store + 全局 CSS 变量
  - [x] SubTask 1.1: 在 `src/types/index.ts` 中新增 `VisualStyle` 类型（`'classic' | 'immersive'`）
  - [x] SubTask 1.2: 扩展 `src/stores/useThemeStore.ts`，新增 `visualStyle` 状态、`setVisualStyle` 方法，在 `<html>` 上设置 `data-visual-style` 属性，扩展 `applyAccent` 计算 `--accent-start`/`--accent-end`/`--accent-glow`，持久化到 `theme-storage`，水合时恢复
  - [x] SubTask 1.3: 在 `src/styles/global.css` 中新增 immersive 专属 CSS 变量（`:root` 默认值 + `[data-visual-style="immersive"]` 覆盖 + `[data-visual-style="immersive"][data-theme="dark"]` 覆盖）

- [x] Task 2: 侧边栏视觉风格切换 UI
  - [x] SubTask 2.1: 在 `src/components/layout/Sidebar.tsx` 底部主题区域添加 Sparkles 图标按钮 + Popover，显示 Classic/Immersive 两个选项（带预览色块和描述文字）
  - [x] SubTask 2.2: 在 `src/components/layout/sidebar.css` 中添加切换按钮样式

- [x] Task 3: 模块一 —— 空间深度与玻璃质感 CSS
  - [x] SubTask 3.1: `src/styles/app.css` —— 主内容区使用 `--bg-canvas` 背景
  - [x] SubTask 3.2: `src/components/layout/sidebar.css` —— 侧边栏玻璃效果（`backdrop-filter: blur` + 半透明背景 + 发光边框）
  - [x] SubTask 3.3: `src/components/views/request-view.css` —— 请求/响应面板卡片化（圆角 + 阴影 + 边框 + margin）
  - [x] SubTask 3.4: `src/components/common/command-palette.css` —— 命令面板玻璃效果
  - [x] SubTask 3.5: `src/components/common/context-menu.css` —— 右键菜单玻璃效果
  - [x] SubTask 3.6: `src/components/dialogs/dialog.css` —— 弹窗玻璃效果

- [x] Task 4: 模块二 —— 氛围背景与动态纹理 CSS
  - [x] SubTask 4.1: `src/styles/animations.css` —— 新增 `ambientShift`、`ambientGlow` 关键帧
  - [x] SubTask 4.2: `src/styles/app.css` —— 主内容区渐变背景 + 点阵网格纹理 + ambientShift 动画
  - [x] SubTask 4.3: `src/components/views/request-view.css` —— 响应状态氛围光（成功绿光/失败红光）

- [x] Task 5: 模块三 —— 色彩情绪化升级 CSS
  - [x] SubTask 5.1: `src/components/views/request-view.css` —— URL 栏方法色条加宽 + 微光 + 请求面板顶部方法色渐变条
  - [x] SubTask 5.2: `src/components/layout/sidebar.css` —— 请求项 hover 方法色指示条滑入
  - [x] SubTask 5.3: `src/components/views/request-view.css` —— 状态码色彩映射（响应面板顶部色条）
  - [x] SubTask 5.4: `src/components/views/request-view.css` —— 强调色渐变按钮（发送按钮等）
  - [x] SubTask 5.5: `src/components/views/request-view.css` —— 暗色霓虹光效（Tab/按钮/输入框外发光）

- [x] Task 6: 模块四 —— 排版与信息密度
  - [x] SubTask 6.1: `src/components/views/request-view.css` —— 响应状态码大号数字样式（28px/700/tabular-nums）
  - [x] SubTask 6.2: `src/components/views/RequestView.tsx` —— 响应面板状态码大号显示 + data-status 属性
  - [x] SubTask 6.3: `src/components/layout/Sidebar.tsx` —— Collection 项下方显示请求数量

- [x] Task 7: 模块五 —— 微交互与动效
  - [x] SubTask 7.1: `src/styles/animations.css` —— 新增 Tab 指示器滑动、输入框聚焦展开等关键帧
  - [x] SubTask 7.2: `src/components/views/request-view.css` —— Tab 滑动指示器样式
  - [x] SubTask 7.3: `src/components/views/RequestView.tsx` —— Tab 滑动指示器逻辑（计算位置和宽度）
  - [x] SubTask 7.4: `src/components/views/request-view.css` —— 输入框聚焦展开动效
  - [x] SubTask 7.5: `src/components/views/RequestView.tsx` —— 空状态引导组件（无请求/无响应时显示引导插画和文字）
  - [x] SubTask 7.6: `src/components/history/history-panel.css` —— 历史面板空状态样式
  - [x] SubTask 7.7: `src/components/tabs/kv-editor.css` —— KV 编辑器空状态样式

- [x] Task 8: 模块六 —— 签名视觉时刻
  - [x] SubTask 8.1: `src/styles/animations.css` —— 新增 `logoBreathe`、`sendPulse` 关键帧
  - [x] SubTask 8.2: `src/components/layout/title-bar.css` —— Logo 呼吸光效 + 标题渐变色
  - [x] SubTask 8.3: `src/components/views/request-view.css` —— 发送按钮仪式感（渐变背景 + 光晕 + hover 放大 + 点击光波）
  - [x] SubTask 8.4: `src/components/views/workflow-view.css` —— 画布背景渐变 + 节点玻璃质感 + 执行发光
  - [x] SubTask 8.5: `src/components/common/command-palette.css` —— 玻璃效果 + 彩虹渐变线

- [x] Task 9: 无障碍与渐进增强
  - [x] SubTask 9.1: 确保所有 immersive 动画在 `prefers-reduced-motion: reduce` 下压缩时长
  - [x] SubTask 9.2: 确保不支持 `backdrop-filter` 时回退到纯色背景

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1]
- [Task 6] depends on [Task 1]
- [Task 7] depends on [Task 1]
- [Task 8] depends on [Task 1]
- [Task 9] depends on [Task 3, Task 4, Task 5, Task 7, Task 8]
- [Task 3, Task 4, Task 5, Task 6, Task 7, Task 8] 可并行执行
