# Remote Tools（远程工具）页面实施计划

## 目标
在应用中新增一个 **Remote Tools** 页面，包含：
1. 左侧栏：SSH 终端（连接远程主机、输入命令、显示结果）
2. 右侧栏：网页浏览器（打开网址、查看页面）

所有相关文件单独放在 `src/components/remote-tools/` 文件夹下，不影响其他现有组件。

## 项目架构分析

- **框架**: React 18 + TypeScript + Vite
- **状态管理**: Zustand
- **路由**: 通过 `useUIStore` 中的 `view` 状态切换（'request' | 'workflow' | 'data-table'）
- **样式**: CSS 变量 + 自定义 CSS 文件，支持 light/dark/immersive 主题
- **图标**: lucide-react
- **桌面端**: Electron（主进程 `electron/main.ts`，预加载脚本 `electron/preload.ts`）

## 命名规范
- 视图标识：`'remote-tools'`（ViewType 扩展）
- 组件目录：`src/components/remote-tools/`
- 主视图：`RemoteToolsView.tsx`
- 子组件：`SshTerminal.tsx`、`WebBrowser.tsx`
- 样式文件：`remote-tools-view.css`
- Store：`useRemoteToolsStore.ts`

## 实施步骤

### Phase 1: 类型定义与状态管理

1. **更新 `src/types/index.ts`**
   - 在 `ViewType` 中新增 `'remote-tools'` 类型

2. **创建 `src/stores/useRemoteToolsStore.ts`**
   - 管理 SSH 连接配置（host, port, username, password/privateKey）
   - 管理终端会话状态（连接状态、命令历史、输出内容）
   - 管理浏览器状态（当前 URL、加载状态、历史记录）
   - 管理左右分栏比例

### Phase 2: Electron 主进程扩展（SSH 支持）

3. **安装依赖**
   - `ssh2` 用于 SSH 连接
   - 需要在 Electron 主进程中运行

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

### Phase 3: UI 组件开发（文件均在 `src/components/remote-tools/` 下）

7. **更新 `src/components/layout/sidebar/SidebarNav.tsx`**
   - 新增 Remote Tools 导航项（图标：Monitor）
   - 快捷键 ⌘4

8. **创建 `src/components/views/RemoteToolsView.tsx`**
   - 主视图容器，采用左右分栏布局（可拖拽调整比例）
   - 左侧：SSH 终端面板
   - 右侧：浏览器面板
   - 使用 `useRef` + 鼠标事件实现分栏拖拽（参考 RequestView 的 splitRatio 实现）

9. **创建 `src/components/remote-tools/SshTerminal.tsx`**
   - SSH 连接配置表单（host, port, username, auth method, password/key）
   - 终端显示区域（模拟终端样式）
   - 命令输入框（支持 Enter 发送）
   - 连接/断开按钮
   - 终端样式：深色背景、等宽字体

10. **创建 `src/components/remote-tools/WebBrowser.tsx`**
    - URL 输入栏
    - 使用 `<iframe>` 加载网页
    - 刷新/前进/后退/主页按钮
    - 加载状态指示
    - 安全提示

11. **创建 `src/components/remote-tools/remote-tools-view.css`**
    - 左右分栏布局样式
    - 终端面板样式
    - 浏览器面板样式
    - 拖拽手柄样式（与 request-view.css 保持一致）
    - 响应式适配

### Phase 4: 集成与路由

12. **更新 `src/App.tsx`**
    - 懒加载 `RemoteToolsView`
    - 在视图切换逻辑中加入 `'remote-tools'` 分支

13. **更新 `src/components/layout/Sidebar.tsx`**
    - 在 `view === 'remote-tools'` 时显示简洁的侧边栏内容（或保持空状态）

### Phase 5: 规范与优化

14. **代码规范检查**
    - 运行 `npm run lint`（即 `tsc --noEmit`）检查类型错误
    - 确保没有无用重复代码
    - 组件拆分合理
    - 遵循现有命名规范

15. **样式一致性**
    - 使用项目已有的 CSS 变量
    - 支持 data-theme="dark" 和 data-visual-style="immersive"
    - 动画使用项目标准 easing 和 duration

## 文件变更清单

### 修改文件
| 文件 | 变更内容 |
|------|---------|
| `src/types/index.ts` | ViewType 新增 'remote-tools' |
| `src/types/electron.d.ts` | 新增 SSH IPC API 类型 |
| `src/App.tsx` | 新增 RemoteToolsView 懒加载和渲染分支 |
| `src/components/layout/Sidebar.tsx` | 新增 remote-tools 视图下的侧边栏处理 |
| `src/components/layout/sidebar/SidebarNav.tsx` | 新增 Remote Tools 导航按钮 |
| `electron/preload.ts` | 暴露 SSH IPC API |
| `electron/main.ts` | 添加 SSH IPC 处理程序 |
| `package.json` | 新增 `ssh2` 依赖 |

### 新增文件（全部在独立目录下）
| 文件 | 说明 |
|------|------|
| `src/stores/useRemoteToolsStore.ts` | Remote Tools 状态管理 |
| `src/components/views/RemoteToolsView.tsx` | 主视图 |
| `src/components/remote-tools/SshTerminal.tsx` | SSH 终端组件 |
| `src/components/remote-tools/WebBrowser.tsx` | 浏览器组件 |
| `src/components/remote-tools/remote-tools-view.css` | 样式文件 |

## 技术要点

### SSH 实现方案
- 使用 `ssh2` 库在 Electron 主进程中建立连接
- 使用 `shell()` 方法获取交互式会话
- 通过 IPC 将 stdout/stderr 流转发到渲染进程
- 渲染进程通过 IPC 发送用户输入到主进程的 stdin

### 终端显示方案
- 使用 `<pre>` 元素显示输出
- 自动滚动到底部
- 支持 `Ctrl+C` 发送中断信号

### 浏览器实现方案
- 使用 `<iframe src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups">`
- 处理 `onLoad` 和 `onError` 事件
- URL 验证（添加 https:// 前缀如果缺失）

### 分栏拖拽
- 参考 `RequestView` 中的 `splitRatio` 实现
- 使用 `requestAnimationFrame` 优化性能
- 保存比例到 `localStorage`
- 双击重置为 50%

## 风险与注意事项

1. **SSH 依赖**: `ssh2` 是原生 Node.js 模块，需要确保 Electron 重建后能正确加载
2. **安全性**: SSH 密码/密钥仅在主进程内存中处理，不暴露到渲染进程
3. **iframe 限制**: 许多现代网站使用 X-Frame-Options 或 CSP 阻止 iframe 嵌入
4. **独立性**: 所有新增文件放在 `remote-tools/` 目录下，不修改现有组件的内部逻辑
