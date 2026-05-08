# Data Table UI 审查报告：功能、设计、排版问题清单

> 审查范围：`d:\std\postman-app\src\components\data-table\` 全部组件
> 审查文件：`DataTableToolbar.tsx` / `DataTable.tsx` / `DataTableRow.tsx` / `DataTableView.tsx` / `data-table.css`(3100+行) / `ColumnFilterPopup.tsx` / `ContextMenu.tsx` / `FilterTags.tsx` / `DataTablePagination.tsx`

---

## 一、功能问题 (Functionality)

### 1.1 🔴 弹窗层级冲突与定位溢出
- **文件**: [DataTableToolbar.tsx:146-L189](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L146-L189)
- **问题**: `renderActionButtons()` 中，`showMoreMenu`（下拉菜单）、`showColumnVisibility`（列可见性弹窗）、`showViewPreset`（视图预设弹窗）三个弹窗**同时渲染在同一个 `dt-tb-more` div 内**。当用户点击 "Columns" 或 "Views" 时，菜单关闭后打开对应弹窗，但该弹窗的 `position: absolute` 是相对于 `dt-tb-more` 定位的。如果 `dt-tb-more` 宽度不够或被 `overflow: hidden` 裁剪，**列可见性弹窗(220-300px宽)和视图预设弹窗(320px宽)会被截断**。
- **影响**: 在窄屏或工具栏右侧空间不足时，弹窗显示不完整。

### 1.2 🔴 handleClickOutside 监听器泄漏风险
- **文件**: [DataTableToolbar.tsx:87-L98](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L87-L98)
- **问题**: 全局 `mousedown` 事件监听器的依赖数组为空 `[]`，闭包中引用的 `setShowMoreMenu` 和 `setShowHistory` 始终是初始值。由于 React state setter 函数具有稳定引用，这目前不会导致 bug，但 `moreMenuRef.current` 和 `historyRef.current` 的读取在每次 render 都是最新的，所以实际上能工作。不过这种模式**缺少对 ColumnVisibilityPopup 和 ViewPresetManager 内部点击外部关闭的协调**——两者各自有独立的 `handleClickOutside`，可能导致竞态条件。

### 1.3 🟡 selectedCount prop 未使用
- **文件**: [DataTableToolbar.tsx:35](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L35)
- **问题**: `selectedCount` 被传入 props 但在组件内**从未使用**。当有选中行时，工具栏没有显示任何选中状态提示（如 "Selected: 3 items"），用户无法感知批量操作上下文。

### 1.4 🟡 onClearFilters prop 未使用
- **文件**: [DataTableToolbar.tsx:48](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L48)
- **问题**: `onClearFilters` 被传入但在 Toolbar 中**未绑定到任何按钮**。工具栏中没有"清除筛选"的快捷入口。

### 1.5 🟡 Search 按钮禁用态的视觉反馈不足
- **文件**: [DataTableToolbar.tsx:234](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L234)
- **问题**: 当 `!projectId.trim() || !testRunId.trim()` 时 Search 按钮被 disabled，但没有给用户**明确的提示说明为什么不能搜索**（如 placeholder 文字变化或 tooltip）。

---

## 二、设计/视觉问题 (Design & Visual)

### 2.1 🔴 图标尺寸混乱（共5种不同尺寸）
| 组件 | 图标尺寸 | 文件位置 |
|------|----------|----------|
| mode/density 按钮 | `size={13}` | [DataTableToolbar.tsx:L105-L112](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L105-L112) |
| 操作按钮 | `size={14}` | [DataTableToolbar.tsx:L147-L169](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L147-L169) |
| 输入框图标 | `size={13}` | [DataTableToolbar.tsx:L206,L218](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L206) |
| 面包屑图标 | `size={12}` | [DataTableToolbar.tsx:L285,L288](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L285) |
| 表格单元格图标 | `size={11~12}` | [DataTableRow.tsx:L29-L35](file:///d:/std/postman-app/src/components/data-table/DataTableRow.tsx#L29-L35) |
| **问题**: 同一工具栏内存在 12/13/14px 三种图标尺寸，视觉上**大小不一致**，缺乏统一规范。

### 2.2 🔴 按钮高度不统一

| 按钮类型 | 高度 | CSS位置 |
|----------|------|---------|
| `.dt-mode-slider-btn` | 30px | [data-table.css:109](file:///d:/std/postman-app/src/components/data-table/data-table.css#L109) |
| `.dt-tb-btn` | 30px | [data-table.css:417](file:///d:/std/postman-app/src/components/data-table/data-table.css#L417) |
| `.dt-density-btn` | 26px | [data-table.css:525](file:///d:/std/postman-app/src/components/data-table/data-table.css#L525) |
| `.dt-search-btn` | 32px | [data-table.css:220](file:///d:/std/postman-app/src/components/data-table/data-table.css#L220) |
| `.dt-input` | 32px | [data-table.css:156](file:///d:/std/postman-app/src/components/data-table/data-table.css#L156) |

**问题**: 密度按钮(26px)比其他控制按钮矮 4px，Search按钮和输入框(32px)又高出 2px。在同一行中形成**高低错落的视觉效果**。

### 2.3 🔴 dt-toolbar-controls 分隔线视觉过重
- **文件**: [data-table.css:409-L410](file:///d:/std/postman-app/src/components/data-table/data-table.css#L409-L410)
- **问题**: `border-left: 1px solid var(--dt-border)` 使用了实线分隔数据输入区和控制区。但从截图来看，这条线让右侧控制区看起来像是**后拼接上去的**，破坏了整体感。且在小屏响应式下会完全消失（换行后移除），体验不一致。

### 2.4 🟡 mode-slider active 态背景过于突出
- **文件**: [data-table.css:137-L141](file:///d:/std/postman-app/src/components/data-table/data-table.css#L137-L141)
- **问题**: `background: var(--dt-accent-glow)` + `border-color: color-mix(in srgb, var(--dt-accent) 30%, transparent)` 使激活的模式按钮有明显的蓝色发光背景，而 density 按钮激活态只是文字变色(`color: var(--dt-accent); background: transparent`)。**两种同类切换控件的状态样式语言不一致**。

### 2.5 🟡 hover 动画 translateY(-1px) 过于花哨
- **文件**: [data-table.css:433-L434](file:///d:/std/postman-app/src/components/data-table/data-table.css#L433-L434), [data-table.css:127-L130](file:///d:/std/postman-app/src/components/data-table/data-table.css#L127-L130), [data-table.css:226-L227](file:///d:/std/postman-app/src/components/data-table/data-table.css#L226-L227)
- **问题**: `.dt-tb-btn:hover`、`.dt-mode-slider-btn:hover`、`.dt-search-btn:hover` 都使用了 `transform: translateY(-1px)` 上浮效果。在一个密集的工具栏中，多个按钮同时上浮会产生**跳动不安定的感觉**，尤其是相邻按钮高度不同时更明显。

### 2.6 🟡 error 状态颜色语义错误
- **文件**: [data-table.css:1050-L1053](file:///d:/std/postman-app/src/components/data-table/data-table.css#L1050-L1053)
- **问题**: `.dt-result-error` 使用了 `var(--warning)` (黄色) 而非 `var(--error)` (红色)。**error 结果 badge 显示为警告色**，颜色语义错误。

### 2.7 🟡 P2 priority 颜色对比度低
- **文件**: [data-table.css:1212-L1214](file:///d:/std/postman-app/src/components/data-table/data-table.css#L1212-L1214)
- **问题**: P2 优先级 badge 背景色用 `#eab308` 但前景色用 `#ca8a04`（深了一号），而 P0/P1/P3 都是同色系深色文字。**P2 的配色与其他优先级风格不统一**。

### 2.8 🟡 环境 badge 颜色前后色值不一致
- **文件**: [data-table.css:1222-L1245](file:///d:/std/postman-app/src/components/data-table/data-table.css#L1222-L1245)
- **问题**: 
  - hadSim: bg `#3b82f6` → text `#3b82f6` (同色)
  - HiL: bg `#8b5cf6` → text `#8b5cf6` (同色)
  - SiL: bg `#06b6d4` → text `#0891b2` (不同)
  - UAT: bg `#10b981` → text `#059669` (不同)
  - PRE: bg `#f59e0b` → text `#d97706` (不同)
  
  **前两个 badge 背景和文字同色会导致不可见**（因为 background 只混了 10%透明度），后三个则用了不同的深色。

---

## 三、布局/排版问题 (Layout)

### 3.1 🔴 dt-query-fields 缺少 max-width 约束
- **文件**: [data-table.css:176-L182](file:///d:/std/postman-app/src/components/data-table/data-table.css#L176-L182)
- **问题**: `.dt-query-fields` 设置了 `flex: 1; min-width: 0;` 但内部的 `.dt-input-with-icon` 只有 `min-width: 120px`。**在中等屏幕宽度下，两个输入框可能过度扩张，挤压右侧控制区**。应该给 `dt-query-fields` 设置一个合理的 `max-width`（如 `480px` 或 `flex: 1 1 400px`）。

### 3.2 🔴 单行布局在极窄屏下无优雅降级
- **文件**: [DataTableToolbar.tsx:201-L302](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L201-L302), [data-table.css:2943-L2970](file:///d:/std/postman-app/src/components/data-table/data-table.css#L2943-L2970)
- **问题**: 当前响应式断点仅在 768px 处处理了 `flex-wrap`，但：
  - **400px-768px 区间**：输入框 + 搜索 + 控制区挤在一行，输入框被压缩到几乎不可用
  - **没有针对 480px 以下**的工具栏特殊处理
  - `dt-toolbar-controls` 换行后虽然 `justify-content: flex-end`，但失去了与左侧输入区的视觉关联

### 3.3 🔴 dt-card-row 使用 grid 布局但 min-width 可能导致水平滚动
- **文件**: [data-table.css:777-L789](file:///d:/std/postman-app/src/components/data-table/data-table.css#L777-L789)
- **问题**: `.dt-card-row` 设置了 `min-width: fit-content`。当所有列宽之和超过容器宽度时（这在动态计算宽度时常见），**行不会收缩而是产生水平滚动条**。虽然外层容器有 `overflow-hidden`，但这意味着内容被截断而非自适应。

### 3.4 🟡 工具栏 padding 不对称
- **文件**: [data-table.css:396-L401](file:///d:/std/postman-app/src/components/data-table/data-table.css#L396-L401)
- **问题**: `.dt-toolbar-main-row` 的 `padding: 8px 16px`，而 `.dt-pagination` 的 `padding: 14px 20px`，`.dt-filter-tags` 的 `padding: 6px 20px`。**垂直方向上各区域的 padding 不一致**（8px vs 14px vs 6px），造成内部区域高度参差。

### 3.5 🟡 dt-input-with-icon 的 min-width: 120px 在窄屏下过大
- **文件**: [data-table.css:184-L188](file:///d:/std/postman-app/src/components/data-table/data-table.css#L184-L188)
- **问题**: 每个 `dt-input-with-icon` 有 `min-width: 120px`，两个加起来至少 240px，加上搜索按钮(~80px)、gap、padding，**仅输入区就需要 ~360px**。在 500px 宽的容器中，控制区只剩约 100px，密度/模式/操作按钮会被严重压缩。

### 3.6 🟡 dt-table-cell 固定 white-space: nowrap 导致长文本截断无回退
- **文件**: [data-table.css:872-L873](file:///d:/std/postman-app/src/components/data-table/data-table.css#L872-L873)
- **问题**: 所有单元格设置了 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`。虽然 EllipsisText 组件有 title 属性可以悬浮查看完整文本，但**某些列（如 title）在 compact 模式下 maxWidth 仅 260px**，非常长的标题可能丢失重要信息。

### 3.7 🟡 dt-col-filter-popup / dt-view-preset-popup z-index 层级混乱
- **文件**: 
  - filter popup: `z-index: var(--dt-z-popup)` (=1000) — [data-table.css:1498](file:///d:/std/postman-app/src/components/data-table/data-table.css#L1498)
  - more menu: `z-index: 1000` — [data-table.css:556](file:///d:/std/postman-app/src/components/data-table/data-table.css#L556)
  - view preset popup: `z-index: 1000` — [data-table.css:2312](file:///d:/std/postman-app/src/components/data-table/data-table.css#L2312)
  - context menu: `z-index: 1000` — [data-table.css:1898](file:///d:/std/postman-app/src/components/data-table/data-table.css#L1898)
  - drawer overlay: `z-index: 100` — [data-table.css:2151](file:///d:/std/postman-app/src/components/data-table/data-table.css#L2151)
- **问题**: 所有弹出层都使用相同的 z-index 1000。当多个弹窗同时出现时（虽然当前逻辑不太可能），**层叠顺序不确定**。建议建立清晰的层级体系（如 dropdown=1000, popup=1010, modal=1100）。

---

## 四、可访问性 (Accessibility)

### 4.1 🟡 缺少 ARIA 标签
- **文件**: [DataTableToolbar.tsx:116-L128](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L116-L128)
- **问题**: 模式切换按钮只有 `title` 属性（tooltip），**没有 `aria-label`**。对于纯图标按钮（已移除文字），屏幕阅读器无法识别其功能。

### 4.2 🟡 键盘焦点管理缺失
- **文件**: [DataTableToolbar.tsx:146-L172](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L146-L172)
- **问题**: Actions 下拉菜单展开后，**焦点仍停留在触发按钮上**，没有自动将焦点移动到第一个菜单项。用户需要手动 Tab 才能进入菜单，不符合 ARIA 菜单模式最佳实践。

### 4.3 🟡 dt-history-item 缺少语义标记
- **文件**: [DataTableToolbar.tsx:252-L271](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx#L252-L271)
- **问题**: 历史记录列表项没有 `role="option"` 或 `aria-selected`，对于使用屏幕阅读器的用户来说，这不是一个标准的 listbox/select 组件。

---

## 五、代码质量 (Code Quality)

### 5.1 🟢 未使用的 CSS 类（可清理）
以下类在重构后已无 TSX 引用：
- ~~`.dt-query-divider`~~ — L91-97（未在任何组件中使用）
- ~~`.dt-tb-divider`~~ — L460-466（已在上一轮重构中从 TSX 移除）

### 5.2 🟢 重复的 focus 样式模式
以下组件的 focus 样式几乎完全相同，可以抽取公共类：
- `.dt-col-filter-input:focus` — L1562-1565
- `.dt-view-preset-input:focus` — L2402-2405
- `.pagination-jump-input:focus` — L2653-2656
- `.dt-input:focus` — L158-162

共同模式: `border-color: var(--dt-accent); box-shadow: 0 0 0 2px var(--dt-accent-glow);`

### 5.3 🟢 DataView 中类型断言过多
- **文件**: [DataTableView.tsx:355-L370](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L355-L370)
- **问题**: 多处使用 `as any` 类型断言（`density as any`, `mode as any`, `paginatedData as any[]` 等）。这说明 `types.ts` 中的类型定义与实际使用之间存在**类型不匹配**，应该修复类型定义而非使用断言绕过。

---

## 六、修复优先级建议

| 优先级 | 问题编号 | 问题描述 | 预计工作量 |
|--------|----------|----------|------------|
| **P0-立即** | 2.1 | 图标尺寸统一为 13px | 小 |
| **P0-立即** | 2.2 | 按钮高度统一为 30px | 小 |
| **P0-立即** | 2.6 | error badge 改用 --error 色 | 小 |
| **P1-短期** | 1.1 | 弹窗改为 Portal 渲染避免裁剪 | 中 |
| **P1-短期** | 3.1 | dt-query-fields 加 max-width 约束 | 小 |
| **P1-短期** | 2.3 | 优化 controls 分隔线样式（改用 gap 替代 border） | 小 |
| **P1-短期** | 2.4 | 统一 mode/density 切换控件的 active 态样式 | 小 |
| **P2-中期** | 3.2 | 完善多断点响应式适配 | 中 |
| **P2-中期** | 1.3 | 选中计数展示 | 小 |
| **P2-中期** | 2.8 | 环境 badge 颜色修正 | 小 |
| **P3-长期** | 4.1-4.3 | 可访问性完善 | 中 |
| **P3-长期** | 5.3 | 类型定义修复 | 大 |
