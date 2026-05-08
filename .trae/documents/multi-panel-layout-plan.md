# Remote Tools 多面板 + 可拖拽布局方案

## 一、需求分析

### 当前状态
- 固定左右两栏：1个 SSH Terminal + 1个 Web Browser
- 单一 `SshManager` 实例，只能维持1个SSH连接
- IPC 事件无连接标识，无法区分多个SSH连接的数据
- 布局为简单的 `splitRatio` 比例分割

### 目标状态
- 支持多个 SSH Terminal 实例（每个连接不同主机）
- 支持多个 Web Browser 实例（每个打开不同URL）
- 自由拖拽排列面板，支持网格布局
- 面板可新增、关闭、最大化/还原
- 布局持久化

## 二、架构设计

### 2.1 布局引擎：基于 Panel 的网格布局

采用**扁平化面板列表 + 自动流式布局**方案（而非递归分割树），理由：
- 实现简单，不易出 bug
- 拖拽排序天然支持
- 性能好，无需深度递归

布局模型：
```
Panels: [
  { id, type: 'ssh'|'browser', title, size: flex值 }
]
Layout: {
  direction: 'row' | 'column',  // 主排列方向
  panels: Panel[]
}
```

面板按 `direction` 方向排列，每个面板占 `size` 比例。拖拽分割线调整相邻面板的 `size`。

### 2.2 多SSH连接：SshManager 改为连接池

当前 `SshManager` 是单例，需改为**连接池**模式：
- `Map<string, SshSession>` 管理多个连接
- 每个 `SshSession` 拥有独立的 Client、Stream、AnsiFilter
- 所有 IPC 事件增加 `sessionId` 参数，区分数据归属

### 2.3 数据模型重构

```typescript
// 面板类型
type PanelType = 'ssh' | 'browser'

interface Panel {
  id: string
  type: PanelType
  title: string
  size: number  // flex比例
}

// SSH 会话（独立状态）
interface SshSession {
  id: string
  config: SshConfig
  state: SshConnectionState
  terminalLines: TerminalLine[]
  commandHistory: string[]
}

// Browser 会话（独立状态）
interface BrowserSession {
  id: string
  url: string
  loading: boolean
  history: string[]
}

// 布局
interface LayoutConfig {
  direction: 'row' | 'column'
  panels: Panel[]
}
```

## 三、实施步骤

### 步骤1：重构 SshManager 为连接池
**文件**: `electron/ssh-manager.ts`

- 将 `SshManager` 重构为 `SshSession`（单连接）+ `SshSessionPool`（连接池）
- `SshSession` 封装：Client、Stream、AnsiFilter、状态、connectResolve
- `SshSessionPool` 提供：`create(id)`, `connect(id, config)`, `exec(id, command)`, `disconnect(id)`, `getSession(id)`, `listSessions()`
- 所有 `sendData/sendStderr/sendError/sendClose` 事件增加 `sessionId` 参数
  - 事件名变更：`ssh:data` → `ssh:data:{sessionId}`，或保持原事件名但 payload 带 `sessionId`

### 步骤2：更新 IPC 通道
**文件**: `electron/main.ts`, `electron/preload.ts`, `src/types/electron.d.ts`

- IPC handle 增加 `sessionId` 参数：
  - `ssh:connect` → `ssh:connect` (增加 sessionId)
  - `ssh:exec` → `ssh:exec` (增加 sessionId)
  - `ssh:disconnect` → `ssh:disconnect` (增加 sessionId)
  - `ssh:get-state` → `ssh:get-state` (增加 sessionId)
  - 新增 `ssh:list-sessions` → 返回所有活跃 session id 列表
- IPC 事件增加 `sessionId`：
  - `ssh:data` payload 变为 `{ sessionId, data }`
  - `ssh:stderr` payload 变为 `{ sessionId, data }`
  - `ssh:error` payload 变为 `{ sessionId, error }`
  - `ssh:close` payload 变为 `{ sessionId, code }`
- Preload API 更新：
  - `sshConnect(sessionId, config)`
  - `sshExec(sessionId, command)`
  - `sshDisconnect(sessionId)`
  - `sshGetState(sessionId)`
  - `sshListSessions()`
  - `onSshData(callback: ({ sessionId, data }) => void)`
  - `onSshStderr(callback: ({ sessionId, data }) => void)`
  - `onSshError(callback: ({ sessionId, error }) => void)`
  - `onSshClose(callback: ({ sessionId, code }) => void)`

### 步骤3：重构 Store
**文件**: `src/stores/useRemoteToolsStore.ts`

完全重写，核心结构：
```typescript
interface RemoteToolsState {
  // 布局
  layout: LayoutConfig
  setLayout: (layout: LayoutConfig) => void

  // 面板管理
  addPanel: (type: PanelType) => string  // 返回新面板id
  removePanel: (id: string) => void
  updatePanelSize: (id: string, size: number) => void
  setPanelTitle: (id: string, title: string) => void

  // SSH 会话
  sshSessions: Record<string, SshSession>
  initSshSession: (panelId: string) => void
  updateSshConfig: (sessionId: string, config: Partial<SshConfig>) => void
  setSshState: (sessionId: string, state: SshConnectionState) => void
  addTerminalLine: (sessionId: string, line: Omit<TerminalLine, 'id'>) => void
  clearTerminal: (sessionId: string) => void
  addCommandHistory: (sessionId: string, command: string) => void

  // Browser 会话
  browserSessions: Record<string, BrowserSession>
  initBrowserSession: (panelId: string) => void
  setBrowserUrl: (sessionId: string, url: string) => void
  setBrowserLoading: (sessionId: string, loading: boolean) => void
  addBrowserHistory: (sessionId: string, url: string) => void
}
```

持久化策略：
- `layout` 持久化（面板列表和比例）
- `sshSessions` 仅持久化 config（不持久化密码/密钥/终端内容/连接状态）
- `browserSessions` 仅持久化 url 和 history

### 步骤4：重构 SshTerminal 组件
**文件**: `src/components/remote-tools/SshTerminal.tsx`

- 接收 `sessionId` prop
- 所有 store 操作通过 `sessionId` 索引
- IPC 事件监听通过 `sessionId` 过滤
- 组件标题显示 `host` 或自定义标题
- 关闭面板时自动断开对应 SSH 连接

### 步骤5：重构 WebBrowser 组件
**文件**: `src/components/remote-tools/WebBrowser.tsx`

- 接收 `sessionId` prop
- 所有 store 操作通过 `sessionId` 索引
- 组件标题显示当前 URL 域名

### 步骤6：重构 RemoteToolsView 布局容器
**文件**: `src/components/views/RemoteToolsView.tsx`

- 工具栏增加 "Add SSH" 和 "Add Browser" 按钮
- 根据布局配置动态渲染面板列表
- 面板间插入可拖拽分割线
- 每个面板增加标题栏（显示标题 + 关闭按钮 + 最大化按钮）
- 拖拽分割线调整相邻面板的 size
- 空状态显示引导信息

### 步骤7：新增 PanelContainer 组件
**文件**: `src/components/remote-tools/PanelContainer.tsx`

通用面板容器，提供：
- 标题栏（图标 + 标题 + 最大化/关闭按钮）
- 面板内容区域（slot）
- 最大化/还原切换
- 拖拽排序（可选，后续迭代）

### 步骤8：CSS 样式更新
**文件**: `src/components/remote-tools/remote-tools-view.css`

- 新增面板标题栏样式
- 新增工具栏添加按钮样式
- 新增面板最大化 overlay 样式
- 优化多面板分割线样式
- 保持响应式和 immersive 模式兼容

### 步骤9：集成验证
- 运行 lint 和 build
- 验证多 SSH 连接同时工作
- 验证面板新增/关闭/调整大小
- 验证布局持久化
- 验证切换页面后连接保持
- 验证 ANSI 过滤在多连接下正常工作

## 四、关键设计决策

### 4.1 为什么选择扁平面板列表而非递归分割树？
- 递归分割树（如 VSCode 的 grid）实现复杂，需要处理大量边界情况
- 扁平列表 + 流式布局足以满足需求，实现简单可靠
- 后续如需更复杂布局可平滑升级

### 4.2 面板数量限制
- 最大面板数：8（避免性能问题和布局过于拥挤）
- 最小面板数：0（允许关闭所有面板，显示空状态引导）

### 4.3 Session 与 Panel 的关系
- Panel 是 UI 层概念，Session 是数据层概念
- 创建 Panel 时自动创建对应 Session
- 删除 Panel 时自动清理对应 Session（SSH 自动断开）
- Panel ID = Session ID，1:1 绑定

### 4.4 默认布局
- 首次打开：1个 SSH + 1个 Browser，各占 50%
- 无面板时：显示引导卡片（"Add SSH Terminal" / "Add Web Browser"）

## 五、文件变更清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `electron/ssh-manager.ts` | 重写 | SshSession + SshSessionPool |
| `electron/main.ts` | 修改 | IPC handlers 增加 sessionId |
| `electron/preload.ts` | 修改 | API 增加 sessionId |
| `src/types/electron.d.ts` | 修改 | 类型定义更新 |
| `src/stores/useRemoteToolsStore.ts` | 重写 | 多面板多会话状态管理 |
| `src/components/remote-tools/SshTerminal.tsx` | 重写 | 接收 sessionId prop |
| `src/components/remote-tools/WebBrowser.tsx` | 重写 | 接收 sessionId prop |
| `src/components/remote-tools/PanelContainer.tsx` | 新增 | 通用面板容器 |
| `src/components/views/RemoteToolsView.tsx` | 重写 | 动态布局渲染 |
| `src/components/remote-tools/remote-tools-view.css` | 修改 | 新增面板/布局样式 |
