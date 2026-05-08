# Remote Tools 页面优化与布局重构计划

## 需求分析

### 需求 1：SSH Terminal 连接配置移至工具栏气泡框

**现状**: SSH 连接配置（Host、Port、Username、Auth、Password/Key）以可折叠面板形式嵌入在 SshTerminal 组件内部，占据终端显示空间。

**目标**: 将连接配置移到 PanelContainer 的工具栏中，点击设置按钮（齿轮图标）弹出 Popover 气泡框填写配置信息。

**细化方案**:

* 在 `PanelContainer` 的 `panel-header-actions` 区域添加设置按钮（仅 SSH 类型面板显示）

* 点击设置按钮弹出 Popover（复用项目已有的 `@/components/common/Popover` 组件）

* Popover 内容为 SSH 连接配置表单（Host、Port、User、Auth Type、Password/Key）

* 从 `SshTerminal` 组件中移除 `ssh-config-panel`（内嵌的配置面板）

* SshTerminal 组件只保留终端输出区域和命令输入栏

* 连接/断开按钮保留在 SshTerminal 的命令输入栏中

**涉及文件**:

1. `PanelContainer.tsx` — 添加设置按钮 + Popover + SSH 配置表单
2. `SshTerminal.tsx` — 移除内嵌配置面板，简化为纯终端
3. `remote-tools-view.css` — 添加 Popover 内配置表单样式，移除旧配置面板样式

***

### 需求 2：新增组件布局挤压问题

**现状**: 之前的修复将 `addPanel` 改为交替方向嵌套（row → column → row），但垂直排列同样会导致面板被挤压变扁，只是方向不同。

**根本问题**: 无论水平还是垂直，当面板数量增多时，在同一维度上不断分割必然导致空间不足。

**解决方案**: 改为 **Tab 标签页** 模式。当同一 split 容器中的子节点超过 2 个时，自动将它们合并为标签页组，而不是继续分割空间。用户可以通过标签页切换不同组件，每个组件获得完整的显示区域。

**细化方案**:

* 新增 `TabGroupNode` 节点类型，包含多个 PanelNode，同一时间只显示一个活跃面板

* 当 `addPanel` 添加新面板时，如果当前 split 已有 2 个子节点，则将它们合并为一个 TabGroupNode

* TabGroupNode 渲染为标签栏 + 当前活跃面板内容

* 用户可点击标签切换面板，标签栏显示面板图标和标题

* 拖拽时，TabGroupNode 作为一个整体参与拖放

* 保留 split 布局能力：用户仍可通过拖拽将面板从 TabGroup 中拖出，创建新的 split

**涉及文件**:

1. `useRemoteToolsStore.ts` — 新增 TabGroupNode 类型、修改 addPanel 逻辑、新增 TabGroup 相关 actions
2. `RemoteToolsView.tsx` — 新增 TabGroup 渲染组件、修改 LayoutNodeRenderer
3. `PanelContainer.tsx` — 适配 Tab 模式下的面板标题显示
4. `remote-tools-view.css` — Tab 标签栏样式

***

### 需求 3：布局面板（Layout Panel）

**现状**: 所有组件直接在单一布局树中管理，没有"布局面板"概念。

**目标**: 用户可以创建多个独立的布局面板（Layout Panel），每个布局面板内部拥有独立的组件布局。布局面板之间通过标签页切换。

**细化方案**:

* 在 Remote Tools 工具栏添加"新建布局面板"按钮

* 布局面板列表以标签形式显示在工具栏下方

* 每个布局面板拥有独立的 LayoutConfig（root 节点、sessions 等）

* 切换布局面板时，保存当前面板状态，加载目标面板状态

* 布局面板可重命名、关闭

* 至少保留一个布局面板

**涉及文件**:

1. `useRemoteToolsStore.ts` — 新增 LayoutPanel 概念、多面板状态管理、切换/创建/删除 actions
2. `RemoteToolsView.tsx` — 布局面板标签栏 UI、切换逻辑
3. `remote-tools-view.css` — 布局面板标签栏样式

***

## 实施步骤

### 阶段 1：SSH 配置移至 Popover（需求 1）

1. **修改** **`PanelContainer.tsx`**:

   * 新增 `onToggleConfig` 和 `showConfig` props（从 SshTerminal 提升状态）

   * 在 header-actions 中添加设置按钮（Settings 图标），仅 SSH 类型显示

   * 用 Popover 包裹设置按钮，Popover 内容为 SSH 配置表单

   * SSH 配置表单需要接收 `sessionId`，从 store 读取/更新 config

2. **修改** **`SshTerminal.tsx`**:

   * 移除 `ssh-config-panel` 及相关状态（`showConfig`）

   * 移除配置面板的 JSX 和 CSS 引用

   * 保留终端输出区域和命令输入栏

   * 移除命令输入栏中的"Toggle Config"按钮（Server 图标）

3. **修改** **`remote-tools-view.css`**:

   * 添加 `.ssh-config-popover` 样式（Popover 内的配置表单）

   * 移除 `.ssh-config-panel`、`.ssh-config-panel-hidden`、`.ssh-config-row`、`.ssh-config-field` 等旧样式

### 阶段 2：Tab 标签页模式（需求 2）

1. **修改** **`useRemoteToolsStore.ts`** **类型定义**:

   * 新增 `TabGroupNode` 类型：`{ id, type: 'tabgroup', activeTabId, children: PanelNode[], size }`

   * 更新 `LayoutNode` 联合类型：`PanelNode | SplitNode | TabGroupNode`

   * 新增 actions：`setActiveTab(tabGroupId, panelId)`、`addPanelToTabGroup(tabGroupId, panel)`

2. **修改** **`addPanel`** **逻辑**:

   * 当 root 是 panel 时：创建 row split（保持不变）

   * 当 root 是 split 且 children 数量 >= 2 时：将所有 children 合并为一个 TabGroupNode

   * 当 root 是 tabgroup 时：直接添加新 tab

3. **修改** **`RemoteToolsView.tsx`**:

   * 新增 `TabGroupRenderer` 组件，渲染标签栏 + 活跃面板

   * 修改 `LayoutNodeRenderer` 处理 tabgroup 节点类型

   * TabGroup 整体参与拖放（作为单个 droppable）

4. **修改** **`remote-tools-view.css`**:

   * 添加 `.layout-tabgroup`、`.layout-tabgroup-tabs`、`.layout-tabgroup-tab` 等样式

5. **适配辅助函数**:

   * `getAllPanelNodes` 需要递归进入 tabgroup 的 children

   * `findParentAndIndex` 需要处理 tabgroup 节点

   * `removeNodeFromTree` 需要处理 tabgroup

   * `cleanEmptySplits` 需要处理 tabgroup（空 tabgroup 清理、单 tab 解包）

   * `isValidLayoutNode` 需要验证 tabgroup 结构

   * `movePanelInTree` 需要处理 tabgroup 的拖入/拖出

### 阶段 3：布局面板（需求 3）

1. **修改** **`useRemoteToolsStore.ts`**:

   * 新增 `LayoutPanel` 接口：`{ id, name, layout: LayoutConfig, sshSessions, browserSessions }`

   * 将顶层状态改为 `panels: LayoutPanel[]` 和 `activePanelId: string`

   * 新增 actions：`addLayoutPanel`、`removeLayoutPanel`、`switchLayoutPanel`、`renameLayoutPanel`

   * 现有 actions（addPanel、removePanel 等）作用于当前活跃布局面板

2. **修改** **`RemoteToolsView.tsx`**:

   * 在工具栏下方添加布局面板标签栏

   * 切换布局面板时更新视图

   * 工具栏添加"新建布局面板"按钮

3. **修改** **`remote-tools-view.css`**:

   * 添加布局面板标签栏样式

4. **适配持久化**:

   * `saveLayout` / `loadLayout` 需要保存/加载所有布局面板

   * localStorage key 可保持不变，但数据结构需扩展

***

## 技术要点

* Popover 组件复用 `@/components/common/Popover`（基于 `@floating-ui/react`）

* TabGroupNode 是新的 LayoutNode 类型，需要完整适配所有树操作函数

* 布局面板切换需要保存/恢复完整的面板状态（layout + sessions）

* 拖放系统需要适配 TabGroup（TabGroup 作为整体可拖放，内部 tab 可拖出）

* 所有修改需要保持 undo/redo 功能正常工作

