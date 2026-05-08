# Remote Tools 页面审查报告

> 审查人角色：拥有超10年前端与 Electron 程序测试经验的资深测试工程师
> 审查日期：2026-05-01
> 审查范围：功能完整性、UI 设计问题、潜在 Bug

---

## 一、功能完整性问题（15 项）

### F-01 · 新增面板始终添加到根级 Split，无法指定插入位置
- **严重度**：中
- **位置**：[useRemoteToolsStore.ts:378-416](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L378-L416)
- **描述**：`addPanel` 方法始终将新面板作为根级 Split 的子节点追加。当用户已创建复杂的嵌套布局时（如左侧垂直分割、右侧水平分割），新增面板无法插入到特定位置，只能追加到最外层，破坏用户的布局意图。
- **建议**：提供"添加到当前焦点面板旁"或右键菜单"在此处添加面板"的功能。

### F-02 · 无撤销/重做（Undo/Redo）机制
- **严重度**：高
- **位置**：[useRemoteToolsStore.ts](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts) 全局
- **描述**：所有布局变更（拖拽、调整大小、添加/删除面板）立即持久化到 localStorage，没有历史栈。用户误操作后无法撤销，只能通过"重置布局"恢复默认，丢失所有自定义布局。
- **建议**：实现操作历史栈（至少支持 Ctrl+Z 撤销最近 20 步操作）。

### F-03 · SSH/Browser 会话数据不持久化
- **严重度**：中
- **位置**：[useRemoteToolsStore.ts:273-294](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L273-L294)
- **描述**：只有布局树通过 localStorage 持久化。SSH 的连接配置、终端内容、命令历史，以及浏览器的 URL、导航历史等会话数据在页面刷新后全部丢失。用户刷新页面后需要重新配置所有连接。
- **建议**：至少持久化 SSH 连接配置和浏览器 URL 历史，终端内容可选择性保存。

### F-04 · 无面板标签页（Tab）概念
- **严重度**：低
- **位置**：全局架构
- **描述**：每个面板只能容纳一个 SSH 或 Browser 实例。无法在一个面板区域内通过标签页切换多个会话。当面板数量达到上限（8个）后，用户无法再创建新会话。
- **建议**：考虑在 PanelContainer 内增加 Tab 支持，允许一个面板内切换多个同类型会话。

### F-05 · 无键盘快捷键管理面板
- **严重度**：中
- **位置**：[RemoteToolsView.tsx](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx) 全局
- **描述**：面板的添加、关闭、最大化、布局重置等操作均无键盘快捷键支持。侧边栏导航提示 `⌘4` 可切换到 Remote Tools，但进入后所有操作只能通过鼠标完成。
- **建议**：添加快捷键如 Ctrl+Shift+T（新建SSH）、Ctrl+Shift+B（新建Browser）、Ctrl+W（关闭当前面板）等。

### F-06 · 拖拽操作无键盘可访问性
- **严重度**：高
- **位置**：[RemoteToolsView.tsx:48-98](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L48-L98) DraggablePanel 组件
- **描述**：DnD 实现完全依赖 PointerSensor，没有任何键盘替代方案。使用键盘或屏幕阅读器的用户无法重新排列面板布局。dragHandle 设置了 `tabIndex={-1}` 使其无法通过 Tab 键聚焦。
- **建议**：提供键盘操作模式（如通过方向键移动面板位置），或提供面板位置的属性面板作为替代操作方式。

### F-07 · 无错误边界（Error Boundary）
- **严重度**：高
- **位置**：[App.tsx](file:///d:/std/postman-app/src/App.tsx)
- **描述**：RemoteToolsView 及其子组件没有 Error Boundary 包裹。如果 SshTerminal 或 WebBrowser 抛出渲染错误，整个 Remote Tools 视图将白屏崩溃，没有降级 UI。
- **建议**：为每个面板添加 Error Boundary，出错时显示错误信息并提供重试按钮。

### F-08 · 关闭面板无确认提示
- **严重度**：中
- **位置**：[PanelContainer.tsx:64](file:///d:/std/postman-app/src/components/remote-tools/PanelContainer.tsx#L64)、[RemoteToolsView.tsx:249-256](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L249-L256)
- **描述**：关闭面板时直接执行 `onClose`，即使面板内有活跃的 SSH 连接也不会提示用户确认。用户可能误点关闭按钮导致正在运行的长时间任务中断。
- **建议**：当面板内有活跃 SSH 连接时，关闭前弹出确认对话框。

### F-09 · 无面板重命名功能入口
- **严重度**：低
- **位置**：[useRemoteToolsStore.ts:498-511](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L498-L511)
- **描述**：Store 中有 `setPanelTitle` 方法，但 UI 上没有任何入口让用户修改面板标题。所有 SSH 面板都叫 "SSH Terminal"，所有 Browser 面板都叫 "Web Browser"，当有多个同类型面板时无法区分。
- **建议**：双击面板标题进入编辑模式，或在面板标题上提供右键菜单。

### F-10 · 布局树无最大深度限制
- **严重度**：中
- **位置**：[useRemoteToolsStore.ts:163-229](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L163-L229) `movePanelInTree`
- **描述**：用户可以通过反复拖拽创建任意深度的嵌套布局。过深的嵌套会导致：1）面板尺寸极小无法使用；2）递归渲染性能下降；3）resize 操作难以精确控制。
- **建议**：限制最大嵌套深度（如 3-4 层），超出时给出提示。

### F-11 · 重置布局无确认提示
- **严重度**：中
- **位置**：[RemoteToolsView.tsx:469](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L469)
- **描述**：点击"重置布局"按钮直接执行 `resetLayout`，会断开所有 SSH 连接并恢复默认布局，无任何确认提示。
- **建议**：添加确认对话框，说明"将断开所有 SSH 连接并恢复默认布局"。

### F-12 · 浏览器导航状态不持久
- **严重度**：低
- **位置**：[WebBrowser.tsx:54-55](file:///d:/std/postman-app/src/components/remote-tools/WebBrowser.tsx#L54-L55)
- **描述**：`navStack` 和 `navIndex` 是组件本地状态，面板因布局变化重新挂载后，前进/后退历史丢失。缩放级别和移动模式同样会重置。
- **建议**：将导航状态移入 Store 持久化管理。

### F-13 · 无面板焦点管理
- **严重度**：低
- **位置**：全局
- **描述**：没有"当前活动面板"的概念。无法通过键盘快捷键在面板间切换焦点，也无法针对当前焦点面板执行操作（如关闭、最大化）。
- **建议**：跟踪焦点面板，支持 Ctrl+Tab 在面板间切换。

### F-14 · 外部链接无确认直接打开
- **严重度**：低
- **位置**：[WebBrowser.tsx:248](file:///d:/std/postman-app/src/components/remote-tools/WebBrowser.tsx#L248)
- **描述**：点击"在外部浏览器中打开"按钮直接调用 `window.open()`，无确认提示。可能被恶意利用打开大量窗口。
- **建议**：添加确认提示或至少限制打开频率。

### F-15 · 无面板类型切换功能
- **严重度**：低
- **位置**：全局
- **描述**：创建面板后无法更改其类型（SSH ↔ Browser）。如果用户误创建了错误类型的面板，只能关闭后重新创建。
- **建议**：提供面板类型切换选项。

---

## 二、UI 设计问题（12 项）

### U-01 · SSH 终端硬编码颜色，不支持主题切换
- **严重度**：高
- **位置**：[remote-tools-view.css:651-708](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L651-L708)
- **描述**：终端背景色 `#0d0d0d`、文字色 `#e8e8e8`、错误色 `#ff6b6b`、命令色 `#7ee787`、信息色 `#79c0ff` 全部硬编码。在浅色主题下，深色终端可能与整体风格不协调；在自定义主题下完全无法适配。
- **建议**：使用 CSS 变量替代硬编码颜色，如 `var(--terminal-bg)`、`var(--terminal-fg)` 等。

### U-02 · 最大化/全屏覆盖层 z-index 冲突
- **严重度**：高
- **位置**：[remote-tools-view.css:315-327](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L315-L327)（Panel 最大化）、[remote-tools-view.css:965-977](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L965-L977)（Browser 全屏）
- **描述**：Panel 最大化覆盖层和 Browser 全屏覆盖层都使用 `z-index: 9999`。如果用户先最大化一个 SSH 面板，然后在另一个 Browser 面板点击全屏，两个覆盖层会重叠，产生视觉混乱。
- **建议**：使用不同的 z-index 层级，或使用统一的 Overlay 管理器确保同一时间只有一个全屏覆盖层。

### U-03 · 响应式断点强制覆盖用户布局选择
- **严重度**：中
- **位置**：[remote-tools-view.css:1171-1199](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L1171-L1199)
- **描述**：`@media (max-width: 768px)` 使用 `flex-direction: column !important` 强制所有分割为垂直方向，覆盖了用户手动设置的布局方向。用户精心调整的水平布局在窄屏下被强制改变，且无法恢复。
- **建议**：改为建议性布局而非强制覆盖，或提供"适应窄屏"的切换选项。

### U-04 · 按钮缺少焦点样式（Focus Ring）
- **严重度**：高
- **位置**：[remote-tools-view.css:259-282](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L259-L282) `.panel-header-btn`、[remote-tools-view.css:534-558](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L534-L558) `.ssh-action-btn` 等
- **描述**：大量交互按钮（面板头部按钮、SSH 操作按钮、Browser 导航按钮）没有 `:focus-visible` 样式。使用键盘导航时无法看到当前焦点位置，严重影响可访问性。
- **建议**：为所有可交互元素添加 `:focus-visible` 样式，使用 `outline` 或 `box-shadow` 显示焦点环。

### U-05 · 面板最小尺寸约束不足
- **严重度**：中
- **位置**：[remote-tools-view.css:74-81](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L74-L81)
- **描述**：`.layout-split-child` 设置了 `min-width: 60px; min-height: 60px`，但 60px 远不足以显示面板头部（约 28px 高度）+ 有效内容。用户可以将面板拖到极小尺寸，导致内容完全不可见但面板仍然存在。
- **建议**：增大最小尺寸约束至至少 150px × 120px，或在接近最小尺寸时显示"面板过小"提示。

### U-06 · 拖拽预览与实际布局方向不一致
- **严重度**：中
- **位置**：[RemoteToolsView.tsx:134-136](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L134-L136)
- **描述**：`previewDirectionOverride` 只影响 `flexDirection` 样式，但 `ResizeHandle` 仍然使用 `node.direction`（第159行）而非 `effectiveDirection`。拖拽预览时 resize 手柄的光标方向可能与视觉布局方向不一致。
- **建议**：将 `effectiveDirection` 传递给 ResizeHandle，确保光标与视觉方向一致。

### U-07 · 空状态卡片缺少键盘焦点样式
- **严重度**：中
- **位置**：[remote-tools-view.css:181-203](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L181-L203) `.remote-tools-empty-card`
- **描述**：空状态卡片是 `<button>` 元素，有 hover 效果但缺少 `:focus-visible` 样式。键盘用户无法看到当前聚焦的是哪个卡片。
- **建议**：添加 `:focus-visible` 样式，与 hover 效果保持一致。

### U-08 · 面板计数徽章无交互提示
- **严重度**：低
- **位置**：[RemoteToolsView.tsx:451](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L451)
- **描述**：面板计数显示 `{allPanels.length}/8`，但达到上限 8 时没有视觉变化（如变红或添加提示）。用户可能不理解为什么添加按钮消失了。
- **建议**：当面板数接近上限时（如 6/8 以上），计数徽章变色提示；达到上限时显示 Tooltip 说明"已达面板上限"。

### U-09 · 拖拽指示器（Drop Indicator）在快速移动时可能闪烁
- **严重度**：低
- **位置**：[remote-tools-view.css:381-419](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L381-L419)
- **描述**：Drop Indicator 使用了 `transition: all 0.15s ease`，在快速拖拽时，指示器位置变化会有延迟，导致视觉上出现闪烁或跳跃。
- **建议**：移除或缩短 transition 时间（如 50ms），或仅对 opacity 添加过渡。

### U-10 · SSH 配置面板展开/收起无动画
- **严重度**：低
- **位置**：[SshTerminal.tsx:344](file:///d:/std/postman-app/src/components/remote-tools/SshTerminal.tsx#L344)
- **描述**：点击 Server 按钮切换 `showConfig` 时，配置面板直接出现/消失，没有平滑的展开/收起动画。CSS 中定义了 `slideDown` 动画但只在初始渲染时生效，收起时无动画。
- **建议**：使用 CSS transition 或动画库实现平滑的展开/收起效果。

### U-11 · 面板标题截断无 Tooltip
- **严重度**：低
- **位置**：[remote-tools-view.css:243-250](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L243-L250)
- **描述**：`.panel-title` 设置了 `text-overflow: ellipsis`，当标题过长被截断时，没有 Tooltip 显示完整标题。用户无法看到面板的完整名称。
- **建议**：当标题被截断时，hover 显示完整标题的 Tooltip。

### U-12 · 深色终端内容区域与浅色面板边框对比过强
- **严重度**：低
- **位置**：[remote-tools-view.css:647-657](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L647-L657) vs [remote-tools-view.css:216-222](file:///d:/std/postman-app/src/components/remote-tools/remote-tools-view.css#L216-L222)
- **描述**：终端内容区使用纯黑背景 `#0d0d0d`，而面板容器使用 `var(--bg-panel)`。在浅色主题下，黑色终端与浅色面板之间的视觉跳跃过于强烈。
- **建议**：使用更柔和的深色背景，或添加过渡边框/阴影。

---

## 三、潜在 Bug（18 项）

### B-01 · Resize 操作中组件卸载导致事件监听器泄漏
- **严重度**：高
- **位置**：[RemoteToolsView.tsx:258-293](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L258-L293)
- **描述**：`handleResizeStart` 在 `document` 上注册了 `mousemove` 和 `mouseup` 监听器，但如果组件在 resize 过程中卸载（如切换视图、关闭面板），这些监听器不会被移除，导致内存泄漏和潜在的空引用错误。`onUp` 回调中修改了 `document.body.style`，如果组件已卸载，这些样式修改不会被清理。
- **复现步骤**：1) 开始拖动 resize 手柄 2) 在拖动过程中按 ⌘4 切换到其他视图 3) 鼠标移动仍然触发 resize 逻辑
- **建议**：使用 `useRef` 跟踪 resize 状态，在组件卸载时清理监听器和 body 样式。

### B-02 · addPanel 返回值存在竞态条件
- **严重度**：高
- **位置**：[useRemoteToolsStore.ts:378-431](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L378-L431)
- **描述**：`panelId` 在 `set` 回调内部赋值，但 `return panelId` 在 `set` 外部执行。Zustand 的 `set` 可能是异步的，在快速连续调用 `addPanel` 时，返回的 `panelId` 可能不正确。虽然当前代码中返回值未被使用，但如果未来依赖此返回值会出问题。
- **建议**：在 `set` 之前生成 `panelId`，确保返回值与实际创建的面板 ID 一致。

### B-03 · movePanelInTree 中 activeNode 引用过时数据
- **严重度**：高
- **位置**：[useRemoteToolsStore.ts:163-229](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L163-L229)
- **描述**：`movePanelInTree` 先从原始树中获取 `activeNode`（第166行），然后从树中移除该节点（第175行），但后续使用的 `activeNode` 仍然是移除前的引用。如果 `removeNodeFromTree` 或 `cleanEmptySplits` 修改了节点对象（通过展开运算符创建新对象），`activeNode` 的 `size` 属性可能与树中的实际值不一致。
- **建议**：在移除节点前深拷贝 `activeNode`，或在移除后重新查找确认。

### B-04 · loadLayout 后会话数据与布局不一致
- **严重度**：高
- **位置**：[useRemoteToolsStore.ts:273-294](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L273-L294)、[useRemoteToolsStore.ts:361-373](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L361-L373)
- **描述**：应用启动时，`loadLayout` 从 localStorage 恢复布局树，然后为布局中的面板 ID 创建对应的 SSH/Browser 会话。但如果 Electron 主进程中的 SSH 会话已经不存在（如应用重启后），`sshGetState` 会返回空值，而 Store 中的会话状态仍为 `idle`，导致 UI 显示"空闲"但实际无法连接。
- **复现步骤**：1) 建立 SSH 连接 2) 刷新应用 3) 面板恢复但 SSH 会话已丢失，UI 仍显示可连接状态
- **建议**：启动时主动调用 `sshListSessions` 同步主进程中的活跃会话列表，清理无效的本地会话。

### B-05 · SSH 事件监听器在 sessionId 变化时可能重复注册
- **严重度**：中
- **位置**：[SshTerminal.tsx:75-110](file:///d:/std/postman-app/src/components/remote-tools/SshTerminal.tsx#L75-L110)
- **描述**：`useEffect` 的依赖数组包含 `sessionId`、`addTerminalLine`、`setSshState`。如果 `addTerminalLine` 或 `setSshState` 因 Store 更新而获得新引用（虽然 Zustand 通常保持引用稳定），会导致事件监听器被移除后重新注册，期间可能丢失事件。
- **建议**：使用 `useRef` 存储 `addTerminalLine` 和 `setSshState` 的最新引用，避免将它们放入依赖数组。

### B-06 · 私钥输入框类型为 password，不适合输入文件路径
- **严重度**：中
- **位置**：[SshTerminal.tsx:313-319](file:///d:/std/postman-app/src/components/remote-tools/SshTerminal.tsx#L313-L319)
- **描述**：私钥字段 placeholder 提示"Private key path or content"，但 `type="password"` 隐藏了用户输入。如果用户输入的是文件路径，无法看到路径是否正确。如果是私钥内容，隐藏是合理的，但无法区分两种使用场景。
- **建议**：添加"显示/隐藏"切换按钮，或区分"文件路径"和"密钥内容"两种输入模式。

### B-07 · SSH 端口输入验证不充分
- **严重度**：中
- **位置**：[SshTerminal.tsx:274-277](file:///d:/std/postman-app/src/components/remote-tools/SshTerminal.tsx#L274-L277)
- **描述**：`parseInt(e.target.value) || 22` 的处理方式有问题：1) 输入 "0" 会被替换为 22；2) 输入负数不会被拦截；3) 输入超过 65535 的值不会被拦截；4) 用户输入无效值时没有视觉反馈。
- **建议**：添加端口范围验证（1-65535），无效输入时显示错误提示而非静默替换。

### B-08 · iframe sandbox 安全配置过于宽松
- **严重度**：高
- **位置**：[WebBrowser.tsx:286](file:///d:/std/postman-app/src/components/remote-tools/WebBrowser.tsx#L286)
- **描述**：`sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` 中，`allow-scripts` + `allow-same-origin` 的组合实质上使 sandbox 失效。恶意网页可以通过脚本访问父页面的 DOM（同源策略下），造成 XSS 攻击风险。
- **建议**：移除 `allow-same-origin`，或使用 `allow-popups-without-user-activation` 替代 `allow-popups`，并评估是否真的需要 `allow-same-origin`。

### B-09 · 浏览器无加载超时处理
- **严重度**：中
- **位置**：[WebBrowser.tsx:124-131](file:///d:/std/postman-app/src/components/remote-tools/WebBrowser.tsx#L124-L131)
- **描述**：`handleIframeLoad` 和 `handleIframeError` 是仅有的两个能结束 loading 状态的回调。但如果 iframe 加载的页面既不触发 `load` 也不触发 `error`（如服务器无响应、DNS 解析超时），loading 指示器会无限旋转。
- **建议**：添加加载超时机制（如 30 秒），超时后自动停止 loading 并提示用户。

### B-10 · normalizeUrl 不验证 URL 格式
- **严重度**：中
- **位置**：[WebBrowser.tsx:22-27](file:///d:/std/postman-app/src/components/remote-tools/WebBrowser.tsx#L22-L27)
- **描述**：`normalizeUrl` 只检查是否以 `http://` 或 `https://` 开头，不验证 URL 格式。输入如 `https://` 或 `https:///` 或包含特殊字符的 URL 会被直接传给 iframe，可能导致意外行为。
- **建议**：使用 `URL` 构造函数验证 URL 格式，无效 URL 给出提示。

### B-11 · 浮点精度累积导致面板尺寸异常
- **严重度**：中
- **位置**：[useRemoteToolsStore.ts:99-103](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L99-L103) `normalizeSizes`、[useRemoteToolsStore.ts:471-496](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L471-L496) `resizeNode`
- **描述**：`normalizeSizes` 通过除以总和来归一化尺寸，`resizeNode` 通过加减 delta 来调整尺寸。多次 resize 操作后，浮点精度误差可能累积，导致面板尺寸总和不等于 1，表现为布局出现微小间隙或溢出。
- **建议**：每次 resize 后重新归一化，或在渲染时使用 `flex-grow` 而非精确的像素值。

### B-12 · generateId 存在碰撞风险
- **严重度**：低
- **位置**：[useRemoteToolsStore.ts:66-68](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L66-L68)
- **描述**：ID 生成使用 `Date.now()` + 5位随机字符。在同一毫秒内快速连续添加面板时（如通过脚本或快速双击），`Date.now()` 相同，5位随机字符的碰撞概率约为 1/60,466,176，虽然概率低但在极端情况下可能发生。
- **建议**：使用 `crypto.randomUUID()` 或增加随机字符长度。

### B-13 · cleanEmptySplits 可能产生无效的根节点
- **严重度**：中
- **位置**：[useRemoteToolsStore.ts:131-152](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L131-L152)
- **描述**：当 `cleanEmptySplits` 折叠只有一个子节点的 Split 时，它返回子节点并继承父节点的 `size`。但如果根节点被折叠为 Panel，而后续代码期望根节点是 Split（如 `addPanel` 中检查 `state.layout.root.type === 'panel'`），逻辑虽然能处理但路径不同。更严重的是，如果 `cleanEmptySplits` 在某些边界情况下返回了 `children` 为空的 Split（第148行），可能导致渲染异常。
- **建议**：在 `cleanEmptySplits` 后添加断言，确保根节点不为空 Split。

### B-14 · 拖拽到自身面板的边缘区域可能触发无效操作
- **严重度**：中
- **位置**：[RemoteToolsView.tsx:359-373](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L359-L373)
- **描述**：`handleDragEnd` 中检查 `active.id !== savedDropZone.overId`，但如果用户拖拽面板到自身的边缘区域，`computeZone` 可能返回一个有效的 zone（如 top/bottom），但 `activeId === overId`，此时不会执行移动。然而在 `handleDragOver` 和 `handleDragMove` 中，`active.id === over.id` 时会清除 dropZoneInfo，所以实际上不会到达 `handleDragEnd` 的移动逻辑。但如果碰撞检测返回了自身（虽然 `closestCenterToPointer` 排除了 `active.id`），可能出现意外行为。
- **建议**：在 `computeZone` 或碰撞检测中明确排除自身面板。

### B-15 · SSH 密码以明文存储在 Zustand Store 中
- **严重度**：高
- **位置**：[useRemoteToolsStore.ts:3-11](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L3-L11) `SshConfig` 接口
- **描述**：SSH 密码和私钥以明文存储在 Zustand Store 的 `sshSessions` 中。通过 React DevTools 或内存调试工具可以直接读取。虽然布局不持久化会话数据，但在应用运行期间密码始终在内存中。
- **建议**：1) 连接建立后清除内存中的密码；2) 使用 Electron 的 safeStorage API 加密敏感数据；3) 至少在连接成功后从 Store 中移除密码字段。

### B-16 · 自定义碰撞检测在嵌套布局中可能选择错误目标
- **严重度**：中
- **位置**：[RemoteToolsView.tsx:169-206](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L169-L206)
- **描述**：`closestCenterToPointer` 选择距离指针中心最近的 droppable，但在嵌套布局中，外层面板和内层面板可能重叠。算法优先选择距离最近的，但不考虑面板的层级关系。用户可能想拖拽到外层面板，但算法选择了内层嵌套的面板。
- **建议**：在碰撞检测中考虑 DOM 层级关系，优先选择最上层（z-index 最高或 DOM 最深）的面板。

### B-17 · removePanel 后 cleanEmptySplits 可能改变非预期面板的尺寸
- **严重度**：中
- **位置**：[useRemoteToolsStore.ts:105-152](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L105-L152)
- **描述**：当删除一个面板后，`cleanEmptySplits` 会折叠只有一个子节点的 Split，并调用 `normalizeSizes` 重新分配尺寸。这意味着删除一个面板可能导致其他不相关的面板尺寸被重新调整，用户手动调整的比例丢失。
- **建议**：折叠 Split 时保留子节点的原始 size 比例，仅在必要时归一化。

### B-18 · 浏览器全屏模式关闭按钮可能被 iframe 遮挡
- **严重度**：低
- **位置**：[WebBrowser.tsx:311-316](file:///d:/std/postman-app/src/components/remote-tools/WebBrowser.tsx#L311-L316)
- **描述**：全屏模式的关闭按钮使用 `position: absolute; top: 8px; right: 8px; z-index: 10`，但如果 iframe 内容的 z-index 高于关闭按钮，或者 iframe 捕获了鼠标事件，用户可能无法点击关闭按钮退出全屏。
- **建议**：将关闭按钮的 z-index 提高，或使用 `pointer-events` 确保 iframe 不遮挡按钮区域。

---

## 四、问题统计

| 分类 | 高严重度 | 中严重度 | 低严重度 | 合计 |
|------|---------|---------|---------|------|
| 功能完整性 | 2 | 6 | 4 | 12+3=15 |
| UI 设计 | 3 | 4 | 5 | 12 |
| 潜在 Bug | 5 | 9 | 2 | 16+2=18 |
| **合计** | **10** | **19** | **11** | **45** |

---

## 五、优先修复建议（Top 10）

按影响面和风险排序：

1. **B-01** · Resize 事件监听器泄漏 — 可能导致内存泄漏和运行时错误
2. **B-08** · iframe sandbox 安全风险 — 可能导致 XSS 攻击
3. **B-15** · SSH 密码明文存储 — 安全风险
4. **B-04** · 布局恢复后会话不一致 — 刷新后功能异常
5. **F-07** · 无 Error Boundary — 组件崩溃导致白屏
6. **F-02** · 无撤销机制 — 误操作无法恢复
7. **U-01** · 终端硬编码颜色 — 主题不兼容
8. **U-04** · 按钮缺少焦点样式 — 可访问性不合规
9. **F-06** · 拖拽无键盘替代 — 可访问性不合规
10. **U-02** · z-index 冲突 — 多覆盖层重叠
