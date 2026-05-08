# Workspace 终端与浏览器页面实施计划

## 目标
在 workspace 中新增一个页面，包含：
1. 左侧栏：SSH 终端（连接远程主机、输入命令、显示结果）
2. 右侧栏：网页浏览器（打开网址、查看页面）

## 项目架构分析

- **框架**: React 18 + TypeScript + Vite
- **状态管理**: Zustand
- **路由**: 通过 `useUIStore` 中的 `view` 状态切换（'request' | 'workflow' | 'data-table'）
- **样式**: CSS 变量 + 自定义 CSS 文件，支持 light/dark/immersive 主题
- **图标**: lucide-react
- **桌面端**: Electron（主进程 `electron/main.ts`，预加载脚本 `electron/preload.ts`）

## 实施步骤

### Phase 1: 类型定义与状态管理

1. **更新 `src/types/index.ts`**
   - 在 `ViewType` 中新增 `'workspace'` 类型

2. **创建 `src/stores/useWorkspaceStore.ts`**
   - 管理 SSH 连接配置（host, port, username, password/privateKey）
   - 管理终端会话状态（连接状态、命令历史、输出内容）
   - 管理浏览器状态（当前 URL、加载状态、历史记录）
   - 管理左右分栏比例

### Phase 2: Electron 主进程扩展（SSH 支持）

3. **安装依赖**
   - `node-ssh` 或 `ssh2` 用于 SSH 连接
   - 需要在 Electron 主进程中运行（因为浏览器环境无法直接建立 TCP 连接）

4. **更新 `electron/preload.ts`**
   - 暴露 SSH 相关 IPC API：
     - `sshConnect(config)` - 建立 SSH 连接
     - `sshExec(command)` - 执行命令
     - `sshDisconnect()` - 断开连接
     - `onSshData(callback)` - 接收终端输出流
     - `onSshError(callback)` - 接收错误
     - `onSshClose(callback)` - 连接关闭通知

5. **更新 `electron/main.ts`**
   - 添加 `ssh2` 相关 IPC 处理程序
   - 维护 SSH 连接实例生命周期
   - 支持伪终端（PTY）模式以获得真实终端体验

6. **更新 `src/types/electron.d.ts`**
   - 添加 SSH 相关的类型声明到 `ElectronAPI`

### Phase 3: UI 组件开发

7. **更新 `src/components/layout/sidebar/SidebarNav.tsx`**
   - 新增 Workspace 导航项（图标：Monitor / Globe / Terminal）
   - 快捷键 ⌘4

8. **创建 `src/components/views/WorkspaceView.tsx`**
   - 主视图容器，采用左右分栏布局（可拖拽调整比例）
   - 左侧：SSH 终端面板
   - 右侧：浏览器面板
   - 使用 `useRef` + 鼠标事件实现分栏拖拽（参考 RequestView 的 splitRatio 实现）

9. **创建 `src/components/workspace/TerminalPanel.tsx`**
   - SSH 连接配置表单（host, port, username, auth method, password/key）
   - 终端显示区域（模拟终端样式，使用 `<pre>` 或自定义 div）
   - 命令输入框（支持 Enter 发送）
   - 连接/断开按钮
   - 终端样式：深色背景、等宽字体、彩色输出（可选简单 ANSI 颜色解析）

10. **创建 `src/components/workspace/BrowserPanel.tsx`**
    - URL 输入栏
    - 使用 `<iframe>` 加载网页（sandbox 属性）
    - 刷新/前进/后退/主页按钮
    - 加载状态指示
    - 安全提示（iframe 内无法访问部分网站时的友好提示）

11. **创建 `src/components/workspace/workspace-view.css`**
    - 左右分栏布局样式
    - 终端面板样式（暗色主题、滚动条、字体）
    - 浏览器面板样式（工具栏、iframe 容器）
    - 拖拽手柄样式（与 request-view.css 保持一致）
    - 响应式适配

### Phase 4: 集成与路由

12. **更新 `src/App.tsx`**
    - 懒加载 `WorkspaceView`
    - 在视图切换逻辑中加入 `'workspace'` 分支

13. **更新 `src/components/layout/Sidebar.tsx`**
    - 在 `view === 'workspace'` 时显示 Workspace 侧边栏内容（或保持简洁，不显示额外内容）

### Phase 5: 规范与优化

14. **代码规范检查**
    - 运行 `npm run lint`（即 `tsc --noEmit`）检查类型错误
    - 确保没有无用重复代码
    - 组件拆分合理，避免单个文件过大
    - 遵循现有命名规范（kebab-case 文件名、PascalCase 组件名）

15. **样式一致性**
    - 使用项目已有的 CSS 变量（`--bg-primary`, `--text-primary`, `--accent` 等）
    - 支持 data-theme="dark" 和 data-visual-style="immersive"
    - 动画使用 `var(--duration-fast)` 和 `var(--ease-out-quart)`

## 文件变更清单

### 修改文件
| 文件 | 变更内容 |
|------|---------|
| `src/types/index.ts` | ViewType 新增 'workspace' |
| `src/types/electron.d.ts` | 新增 SSH IPC API 类型 |
| `src/stores/useUIStore.ts` | 无需修改（view 类型自动兼容） |
| `src/App.tsx` | 新增 WorkspaceView 懒加载和渲染分支 |
| `src/components/layout/Sidebar.tsx` | 新增 workspace 视图下的侧边栏处理 |
| `src/components/layout/sidebar/SidebarNav.tsx` | 新增 Workspace 导航按钮 |
| `electron/preload.ts` | 暴露 SSH IPC API |
| `electron/main.ts` | 添加 SSH IPC 处理程序 |
| `package.json` | 新增 `ssh2` 依赖 |

### 新增文件
| 文件 | 说明 |
|------|------|
| `src/stores/useWorkspaceStore.ts` | Workspace 状态管理 |
| `src/components/views/WorkspaceView.tsx` | 主视图 |
| `src/components/workspace/TerminalPanel.tsx` | SSH 终端组件 |
| `src/components/workspace/BrowserPanel.tsx` | 浏览器组件 |
| `src/components/workspace/workspace-view.css` | 样式文件 |

## 技术要点

### SSH 实现方案
- 使用 `ssh2` 库在 Electron 主进程中建立连接
- 使用 `pty`（伪终端）模式通过 `ssh2` 的 `shell()` 方法获取交互式会话
- 通过 IPC 将 stdout/stderr 流转发到渲染进程
- 渲染进程通过 IPC 发送用户输入到主进程的 stdin

### 终端显示方案
- 使用 `<pre>` 元素或 div 列表显示输出
- 简单 ANSI 颜色码解析（可选，初期可用纯文本）
- 自动滚动到底部（`scrollTop = scrollHeight`）
- 支持 `Ctrl+C` 发送中断信号

### 浏览器实现方案
- 使用 `<iframe src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups">`
- 处理 `onLoad` 和 `onError` 事件
- URL 验证（添加 https:// 前缀如果缺失）
- 部分网站可能拒绝 iframe 嵌入，需显示友好提示

### 分栏拖拽
- 参考 `RequestView` 中的 `splitRatio` 实现
- 使用 `requestAnimationFrame` 优化性能
- 保存比例到 `localStorage`
- 双击重置为 50%

## 风险与注意事项

1. **SSH 依赖**: `ssh2` 是原生 Node.js 模块，需要确保 Electron 重建后能正确加载
2. **安全性**: SSH 密码/密钥仅在主进程内存中处理，不暴露到渲染进程
3. **iframe 限制**: 许多现代网站使用 X-Frame-Options 或 CSP 阻止 iframe 嵌入，这是浏览器安全机制，无法绕过
4. **PTY 兼容性**: Windows 上 PTY 支持可能需要额外处理
