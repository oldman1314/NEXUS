# Data Table 页面审查报告

> 审查人角色：10年+前端/Electron测试工程师
> 审查范围：功能完整性、UI设计问题、潜在Bug
> 审查日期：2026-05-01

---

## 一、严重Bug (Critical)

### BUG-C01: 右键菜单功能全部失效
- **文件**: [DataTable.tsx](file:///d:/std/postman-app/src/components/data-table/DataTable.tsx#L229) / [ContextMenu.tsx](file:///d:/std/postman-app/src/components/data-table/ContextMenu.tsx)
- **问题**: `handleContextMenu` 是一个空函数 `(_e, _row) => {}`，右键菜单中定义了6个操作（View Details、Select Row、Copy ID、Copy Title、Expand Row、Open in External），但只有 `copy-id` 和 `copy-title` 在 `ContextMenu.tsx` 内部通过 `navigator.clipboard` 直接处理了，其余操作（view、select、expand、open-external）调用 `onAction` 后传入空函数，**完全无效**。
- **影响**: 用户右键点击行后，View Details、Select Row、Expand Row、Open in External 四个菜单项点击无任何反应。
- **建议**: 在 `DataTable.tsx` 中实现 `handleContextMenu`，根据 action 类型分发到对应逻辑（打开抽屉、切换选中、展开行等）。

### BUG-C02: XSS安全漏洞 — dangerouslySetInnerHTML 未充分消毒
- **文件**: [DataRowDetail.tsx](file:///d:/std/postman-app/src/components/data-table/DataRowDetail.tsx#L58-L62) / [data-table-api.ts](file:///d:/std/postman-app/src/utils/data-table-api.ts#L306-L314)
- **问题**: `sanitizeHtml` 函数仅移除了 `<script>`、`<iframe>`、`<style>` 和 `on*` 事件属性，但遗漏了多种XSS攻击向量：
  - `<img src=x onerror=alert(1)>` — `onerror` 虽然被正则匹配，但 `<img>` 标签本身未被移除
  - `<svg/onload=alert(1)>` — `onload` 可能被匹配但 `<svg>` 未被移除
  - `<a href="javascript:alert(1)">` — `javascript:` 被替换但 `<a>` 标签未处理
  - `<details open ontoggle=alert(1)>` — `ontoggle` 可能不在 `\bon\w+` 的匹配范围内
  - 编码绕过：`&#x6A;avascript:` 等 HTML 实体编码可绕过 `javascript:` 检测
- **影响**: 如果服务端数据被注入恶意HTML，可能导致XSS攻击。在Electron环境中风险更高。
- **建议**: 使用成熟的HTML消毒库（如 `DOMPurify`）替代自定义正则，或完全禁用HTML渲染，仅显示纯文本。

### BUG-C03: 列宽自动计算覆盖用户手动调整
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L162-L175)
- **问题**: `useEffect` 监听 `[data, columns, setColumnWidth]`，每当 `data` 或 `columns` 变化时就重新计算并覆盖所有列宽。`autoWidthsApplied` ref 虽然存在但从未被检查，形同虚设。用户手动拖拽调整列宽后，任何导致 `data` 变化的操作（如筛选、排序、刷新）都会重置列宽。
- **影响**: 用户手动调整列宽的操作会被随时覆盖，体验极差。
- **建议**: 仅在首次加载数据时自动计算列宽，之后不再覆盖。检查 `autoWidthsApplied.current` 并在手动调整列宽时将其设为 `true`。

### BUG-C04: 范围筛选器无法回显已有筛选值
- **文件**: [ColumnFilterPopup.tsx](file:///d:/std/postman-app/src/components/data-table/ColumnFilterPopup.tsx#L46-L55)
- **问题**: 当用户已设置范围筛选（如 duration 1-5），再次打开筛选弹窗时，`rangeMin` 和 `rangeMax` 状态未被初始化。`useEffect` 中只处理了 `selectedValues`（用于select类型），但 `rangeMin`/`rangeMax` 始终为空字符串。
- **影响**: 用户无法看到或编辑已设置的范围筛选值，必须清除后重新设置。
- **建议**: 在 `useEffect` 的 `isOpen` 分支中，当 `isRangeType` 为 true 时，从 `filterValue` 中提取 min/max 并设置到 `rangeMin`/`rangeMax`。

### BUG-C05: 全选行为与复选框状态不一致
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L219-L221) / [DataTable.tsx](file:///d:/std/postman-app/src/components/data-table/DataTable.tsx#L49-L50)
- **问题**: 
  - `handleSelectAll` 只操作当前页数据 `paginatedData`
  - 但 `allSelected` 和 `someSelected` 的计算基于 `data`（全部数据）
  - 如果用户在第1页全选后翻到第2页，表头复选框状态可能显示为"部分选中"（因为第2页未选中），但点击全选会取消第1页的选中并选中第2页
- **影响**: 全选/取消全选行为混乱，用户无法预测操作结果。
- **建议**: 统一全选逻辑——要么全选作用于所有数据，要么复选框状态仅基于当前页数据计算。

---

## 二、高优先级Bug (High)

### BUG-H01: RowDrawer 设置 body overflow 影响全局
- **文件**: [RowDrawer.tsx](file:///d:/std/postman-app/src/components/data-table/RowDrawer.tsx#L28-L34)
- **问题**: 打开抽屉时设置 `document.body.style.overflow = 'hidden'`，在Electron应用中这会影响整个窗口的滚动。如果组件因异常卸载（如React错误边界捕获），cleanup函数可能不执行，导致页面永久无法滚动。
- **建议**: 使用局部滚动锁定（如在 `.dt-view` 容器上设置 `overflow: hidden`）替代全局 body 操作。

### BUG-H02: 抽屉与表格键盘导航冲突
- **文件**: [RowDrawer.tsx](file:///d:/std/postman-app/src/components/data-table/RowDrawer.tsx#L38-L55) / [DataTable.tsx](file:///d:/std/postman-app/src/components/data-table/DataTable.tsx#L79-L86)
- **问题**: 两者都监听 `ArrowUp`/`ArrowDown` 键盘事件。当抽屉打开时，按上下箭头会同时触发抽屉内行导航和表格行导航。
- **影响**: 键盘操作行为不可预测。
- **建议**: 抽屉打开时禁用表格的键盘导航，或在抽屉的键盘处理中 `stopPropagation`。

### BUG-H03: 排序功能实际为单排序，UI暗示多排序
- **文件**: [useDataTableStore.ts](file:///d:/std/postman-app/src/stores/useDataTableStore.ts#L278-L289) / [DataTable.tsx](file:///d:/std/postman-app/src/components/data-table/DataTable.tsx#L98-L101)
- **问题**: `toggleSort` 在首次点击时替换整个 `sortState` 为单个排序项（`[{ key, direction: 'asc' }]`），但 UI 显示了排序序号（`sortOrder` 返回 `i + 1`），暗示支持多列排序。store 中有 `addSort` 方法但从未被UI调用。
- **影响**: 用户看到排序序号"1"但无法添加第二个排序条件，功能与UI不一致。
- **建议**: 要么实现多列排序（Shift+点击添加），要么移除排序序号显示。

### BUG-H04: ViewPresetManager 与 Store 双重存储预设
- **文件**: [ViewPresetManager.tsx](file:///d:/std/postman-app/src/components/data-table/ViewPresetManager.tsx#L20-L33) / [useDataTableStore.ts](file:///d:/std/postman-app/src/stores/useDataTableStore.ts#L348-L365)
- **问题**: `ViewPresetManager` 使用 `localStorage` key `datatable-view-presets` 独立存储预设，而 `useDataTableStore` 使用 `dt-persist` 存储预设。两者数据结构不同、存储位置不同，导致：
  - 在 `ViewPresetManager` 中保存的预设不会出现在 store 的 `viewPresets` 中
  - 在 store 中通过 `savePreset` 保存的预设不会出现在 `ViewPresetManager` 的列表中
  - 两份数据可能不同步
- **影响**: 预设管理功能完全混乱，用户保存的预设可能丢失或不一致。
- **建议**: 统一使用 store 的 `viewPresets`，移除 `ViewPresetManager` 中的独立 localStorage 存储。

### BUG-H05: 搜索功能无UI入口
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx) / [DataTableToolbar.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx)
- **问题**: Store 中有 `searchQuery` 和 `setSearchQuery`，`useFilteredData` 中也实现了基于 `searchQuery` 的全文搜索，`DataTableRow` 中有搜索高亮逻辑 `highlightSearchText`，但 **工具栏中没有搜索输入框**。用户无法输入搜索关键词。
- **影响**: 搜索功能完全不可用，相关代码均为死代码。
- **建议**: 在工具栏中添加搜索输入框。

### BUG-H06: 无法取消正在进行的请求
- **文件**: [useDataTableData.ts](file:///d:/std/postman-app/src/hooks/useDataTableData.ts#L57-L61)
- **问题**: `cancel` 函数已实现但从未暴露给UI。当数据加载缓慢时，用户无法取消请求，只能等待或刷新页面。
- **建议**: 在工具栏添加取消按钮，或在加载状态下让搜索按钮变为"取消"。

### BUG-H07: 历史记录时间戳伪造
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L307)
- **问题**: `history={queryHistory.map((h) => ({ projectId: h.projectId, testRunId: h.testRunId, timestamp: Date.now() }))}`，每条历史记录的 `timestamp` 都被替换为当前时间，而非原始查询时间。Store 中的 `queryHistory` 类型甚至没有 `timestamp` 字段。
- **影响**: 历史记录无法按时间排序，所有记录显示相同时间。
- **建议**: 在 store 的 `queryHistory` 类型中添加 `timestamp` 字段，在 `addQueryHistory` 时记录实际时间。

---

## 三、中等优先级Bug (Medium)

### BUG-M01: Excel导出不是真正的Excel格式
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L260-L262)
- **问题**: "Export Excel" 生成的是 Tab 分隔的文本文件，扩展名为 `.xls`。这不是真正的 Excel 格式，打开时 Excel 会弹出格式不匹配的警告。
- **建议**: 使用 `xlsx` 库生成真正的 `.xlsx` 文件，或改为导出 `.tsv` 并明确标注。

### BUG-M02: CSV导出未处理单元格内换行符
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L248-L255)
- **问题**: `sanitizeCsvCell` 处理了引号和公式注入，但未处理单元格内的换行符（`\n`）。包含换行的数据会破坏CSV结构。
- **建议**: 在 `sanitizeCsvCell` 中将换行符替换为空格或转义。

### BUG-M03: URL同步可能导致状态循环
- **文件**: [useUrlSync.ts](file:///d:/std/postman-app/src/hooks/useUrlSync.ts)
- **问题**: 每次 state 变化都写入 URL（`replaceState`），mount 时从 URL 读取并设置 state。如果浏览器前进/后退触发 `popstate`，没有对应的监听来同步状态，且当前实现可能在某些边界情况下造成状态-URL循环更新。
- **建议**: 添加 `popstate` 事件监听，并考虑使用 debounce 避免频繁 URL 更新。

### BUG-M04: EllipsisText 不响应容器尺寸变化
- **文件**: [EllipsisText.tsx](file:///d:/std/postman-app/src/components/data-table/EllipsisText.tsx#L29-L33)
- **问题**: `isTruncated` 仅在 `text` 或 `maxWidth` 变化时重新计算，不监听容器实际尺寸变化。当窗口resize或列宽调整后，tooltip的显示/隐藏状态可能不正确。
- **建议**: 使用 `ResizeObserver` 监听容器尺寸变化，动态更新 `isTruncated` 状态。

### BUG-M05: 列筛选弹窗位置计算依赖初始渲染尺寸
- **文件**: [ColumnFilterPopup.tsx](file:///d:/std/postman-app/src/components/data-table/ColumnFilterPopup.tsx#L57-L101)
- **问题**: `updatePosition` 在首次渲染时调用，此时弹窗可能还没有完整内容（如筛选列表为空），`popupRect.height` 使用了回退值 `320`。当筛选列表加载后弹窗高度变化，位置不会重新计算。
- **建议**: 在筛选列表数据变化后重新调用 `updatePosition`。

### BUG-M06: defectURI 链接可能不是有效URL
- **文件**: [DataTableRow.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableRow.tsx#L194-L201)
- **问题**: `defectURI` 直接作为 `<a href>` 使用，但如果值不是有效的URL（如相对路径、内部ID），点击后可能导致导航错误。
- **建议**: 验证 URL 有效性，或使用 `#` 替代无效 URL。

### BUG-M07: DataTableHeader.tsx 是死代码
- **文件**: [DataTableHeader.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableHeader.tsx)
- **问题**: 此组件未被任何文件引用，`DataTableView` 使用的是 `DataTableToolbar`。这是遗留代码，增加了维护负担。
- **建议**: 删除此文件。

### BUG-M08: 导出功能使用列label作为key访问数据
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L241-L244)
- **问题**: `visibleCols.forEach((col) => { obj[col.label] = row[col.key as keyof MergedTestCase] })` 创建了以 `label` 为key的对象，但后续 CSV/Excel 导出中又用 `row[c.label]` 访问，这是正确的。但如果 `label` 包含逗号或特殊字符，CSV 导出可能出错。
- **建议**: 对 CSV header 中的特殊字符进行转义。

### BUG-M09: 分页跳转按钮禁用逻辑不完整
- **文件**: [DataTablePagination.tsx](file:///d:/std/postman-app/src/components/data-table/DataTablePagination.tsx#L136)
- **问题**: 跳转按钮仅在 `!jumpPage` 时禁用，但未检查输入值是否在有效范围内（1-totalPages）。用户输入超出范围的数字后点击按钮，`handleJump` 会静默失败。
- **建议**: 当输入值不在有效范围内时也禁用按钮，或显示错误提示。

### BUG-M10: 页码超出总页数时的边界处理
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L177-L179)
- **问题**: `if (currentPage > totalPages) setCurrentPage(totalPages)` — 当 `totalPages` 为 0 时（无数据），会设置 `currentPage` 为 0，但分页逻辑假设页码从 1 开始。
- **建议**: 添加 `Math.max(1, totalPages)` 保护。

---

## 四、UI设计问题

### UI-01: Mode Slider 指示器宽度硬编码
- **文件**: [data-table.css](file:///d:/std/postman-app/src/components/data-table/data-table.css#L151-L161)
- **问题**: `.dt-mode-slider-indicator` 的 `width: 28px` 和 `transform: translateX(30px)` 是硬编码值，与实际按钮宽度不匹配。按钮内容包含图标+文字（如 "Simple"、"Detailed"），实际宽度远超28px。
- **影响**: 滑块指示器无法正确覆盖当前选中的按钮，视觉效果异常。
- **建议**: 使用 JavaScript 动态计算按钮宽度和位置，或使用 CSS 变量。

### UI-02: 空状态消息不准确
- **文件**: [DataTable.tsx](file:///d:/std/postman-app/src/components/data-table/DataTable.tsx#L144-L158)
- **问题**: 当 `data.length === 0` 时显示 "No results found" 和 "Try adjusting your filters or search query"，但此状态也可能是用户尚未执行搜索。两种场景应显示不同的消息。
- **建议**: 区分"未搜索"和"搜索无结果"两种状态，显示不同的空状态页面。

### UI-03: 右键菜单快捷键显示但未实现
- **文件**: [ContextMenu.tsx](file:///d:/std/postman-app/src/components/data-table/ContextMenu.tsx#L47-L55)
- **问题**: 菜单项显示了快捷键（Enter、Space、Ctrl+C、E），但这些快捷键并未实际注册。用户看到快捷键提示但按下无效。
- **建议**: 实现对应的键盘快捷键，或移除快捷键显示。

### UI-04: 工具栏按钮缺少 aria-label
- **文件**: [DataTableToolbar.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableToolbar.tsx)
- **问题**: 密度选择器按钮、导出菜单项等缺少 `aria-label` 属性，屏幕阅读器无法正确识别按钮功能。
- **建议**: 为所有图标按钮添加 `aria-label`。

### UI-05: 筛选标签区域可能溢出
- **文件**: [data-table.css](file:///d:/std/postman-app/src/components/data-table/data-table.css#L1805-L1813)
- **问题**: `.dt-filter-tags` 设置了 `flex-wrap: nowrap`，但内部 `.dt-filter-tags-list` 设置了 `flex-wrap: wrap`。当筛选标签过多时，外层容器不会换行，可能导致内容溢出。
- **建议**: 统一换行策略，或限制显示数量并添加"更多"展开。

### UI-06: 无加载取消的视觉反馈
- **问题**: 数据加载过程中，工具栏的搜索按钮变为禁用状态并显示旋转图标，但没有明确的"取消加载"选项。用户可能不知道需要等待多久。
- **建议**: 添加进度条或取消按钮，显示预估剩余时间。

### UI-07: 列可见性弹窗无搜索/筛选
- **文件**: [ColumnVisibilityPopup.tsx](file:///d:/std/postman-app/src/components/data-table/ColumnVisibilityPopup.tsx)
- **问题**: 当列数较多（detailed模式有19列）时，弹窗没有搜索功能，用户需要滚动查找目标列。
- **建议**: 添加搜索输入框，支持快速定位列。

### UI-08: 分页区域在小屏幕下布局拥挤
- **文件**: [data-table.css](file:///d:/std/postman-app/src/components/data-table/data-table.css#L3020-L3055)
- **问题**: 768px 以下分页区域变为纵向布局，但跳转输入框和页码按钮之间的间距不够，可能重叠。
- **建议**: 调整小屏幕下的间距和布局。

---

## 五、功能完整性问题

### FUNC-01: 批量操作栏未实现
- **问题**: CSS 中有完整的 `.dt-batch-bar` 样式（固定定位底部浮动栏），store 中有 `invertSelection`、`selectFiltered` 等方法，但 **没有组件渲染批量操作栏**。选中行后无批量操作入口。
- **建议**: 实现批量操作栏组件，提供批量导出、批量标记等功能。

### FUNC-02: 行展开功能被禁用
- **问题**: Store 中有 `expandedRows`、`toggleRowExpanded`、`expandSelected`、`collapseAll`，但 `DataTable` 传入 `expandedId={null}` 和 `onToggleExpand={() => {}}`，行内展开功能完全禁用。`DataRowDetail` 组件存在但仅在行展开时渲染。
- **建议**: 启用行展开功能，或移除相关死代码。

### FUNC-03: 列拖拽排序未实现
- **问题**: Store 中有 `reorderColumn` 方法，但没有拖拽排序的UI实现。
- **建议**: 实现列头拖拽排序，或移除 `reorderColumn`。

### FUNC-04: 无删除预设确认
- **文件**: [ViewPresetManager.tsx](file:///d:/std/postman-app/src/components/data-table/ViewPresetManager.tsx#L69-L76)
- **问题**: 删除预设直接执行，无确认对话框。误删后无法恢复。
- **建议**: 添加确认对话框。

### FUNC-05: 无重置确认
- **问题**: 工具栏的 Reset 按钮直接清空所有数据、筛选、排序，无确认提示。
- **建议**: 添加确认对话框或 undo 功能。

### FUNC-06: 列筛选弹窗中"Select All"选择的是搜索后的值
- **文件**: [ColumnFilterPopup.tsx](file:///d:/std/postman-app/src/components/data-table/ColumnFilterPopup.tsx#L224-L226)
- **问题**: `handleSelectAll` 选择的是 `filteredValues`（搜索后的值），而非全部值。用户可能期望"全选"是选择所有值。
- **建议**: 明确"全选"的语义，或添加"选择所有（包括未显示）"选项。

### FUNC-07: 密度切换无持久化反馈
- **问题**: 密度切换后虽然通过 store 持久化到 localStorage，但切换时没有视觉反馈（如 toast 提示）。
- **建议**: 添加短暂的视觉反馈。

### FUNC-08: 无数据刷新间隔设置
- **问题**: 没有自动刷新或定时刷新功能，用户必须手动点击 Refresh。
- **建议**: 添加可选的自动刷新间隔设置。

---

## 六、性能问题

### PERF-01: 列筛选值计算基于全量数据
- **文件**: [DataTable.tsx](file:///d:/std/postman-app/src/components/data-table/DataTable.tsx#L103-L122)
- **问题**: `colValues` 的 `useMemo` 遍历全量 `data` 计算每列的唯一值和计数，但筛选弹窗应该基于未筛选的数据显示可选项。当数据量大（1000+行）时，每次渲染都重新计算。
- **建议**: 将唯一值计算移到 store 或独立 hook 中，使用 `useRef` 缓存。

### PERF-02: 搜索高亮正则每次渲染重新创建
- **文件**: [DataTableRow.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableRow.tsx#L15-L22)
- **问题**: `highlightSearchText` 在每次渲染时创建新的正则表达式，且 `regex.test(part)` 在 `map` 中被多次调用会改变 `lastIndex`（因为使用了 `g` 标志），可能导致高亮不正确。
- **建议**: 使用 `string.replaceAll` 或在 `map` 外预计算匹配位置。

### PERF-03: DataTableRow 的 useMemo 依赖项过多
- **文件**: [DataTableRow.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableRow.tsx#L268)
- **问题**: `useMemo` 的依赖项包含 `row`（整个行对象），由于 `DataTableView` 中 `paginatedData as any[]` 的类型转换，每次渲染可能创建新的对象引用，导致 `useMemo` 失效。
- **建议**: 使用 `row.id` 替代 `row` 作为依赖项，或使用 `useMemo` 稳定化数据引用。

### PERF-04: 列宽自动计算使用逐字符测量
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L52-L58)
- **问题**: `measureTextWidth` 逐字符判断是否为CJK字符并累加宽度，对于大数据集（80行采样 × 19列）性能较差。
- **建议**: 使用 `Canvas.measureText` API 或预计算缓存。

---

## 七、Electron 特有问题

### ELEC-01: navigator.clipboard 在某些 Electron 配置下可能不可用
- **文件**: [DataTableRow.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableRow.tsx#L131) / [ContextMenu.tsx](file:///d:/std/postman-app/src/components/data-table/ContextMenu.tsx#L58-L62)
- **问题**: `navigator.clipboard.writeText()` 需要安全上下文和用户授权。在某些 Electron 配置下可能抛出异常，但代码未做 try-catch。
- **建议**: 添加 try-catch 和降级方案（如 `document.execCommand('copy')`）。

### ELEC-02: 导出文件未使用 Electron 的 dialog API
- **文件**: [DataTableView.tsx](file:///d:/std/postman-app/src/components/data-table/DataTableView.tsx#L264-L268)
- **问题**: 导出文件通过创建 `<a>` 标签模拟下载，文件名自动生成。在 Electron 中应使用 `dialog.showSaveDialog` 让用户选择保存位置和文件名。
- **建议**: 通过 IPC 调用 Electron 的 save dialog。

---

## 八、汇总统计

| 类别 | 数量 |
|------|------|
| 严重Bug (Critical) | 5 |
| 高优先级Bug (High) | 7 |
| 中等优先级Bug (Medium) | 10 |
| UI设计问题 | 8 |
| 功能完整性问题 | 8 |
| 性能问题 | 4 |
| Electron特有问题 | 2 |
| **总计** | **44** |

---

## 九、优先修复建议

### 立即修复 (P0)
1. BUG-C02: XSS安全漏洞 — 引入 DOMPurify
2. BUG-C01: 右键菜单功能失效 — 实现 handleContextMenu
3. BUG-C03: 列宽自动计算覆盖手动调整 — 添加首次标记
4. BUG-C05: 全选行为不一致 — 统一逻辑

### 尽快修复 (P1)
5. BUG-H05: 添加搜索输入框
6. BUG-H04: 统一预设存储
7. BUG-H02: 键盘导航冲突
8. BUG-H01: body overflow 全局影响
9. BUG-H03: 排序功能与UI不一致

### 计划修复 (P2)
10. BUG-C04: 范围筛选器回显
11. BUG-M01: Excel导出格式
12. FUNC-01: 批量操作栏
13. FUNC-02: 行展开功能
14. UI-01: Mode Slider 指示器
