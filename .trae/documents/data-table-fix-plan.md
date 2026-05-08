# 数据表功能与UI问题修复计划

## 问题分析

### 问题一：Simple 模式显示了 Detailed 模式的列和数据

**现状**：
- `useDataTableStore.ts` 中 `SIMPLE_COLUMNS` 定义了 7 列（id/title/result/testPriority/testContent/testEnvironment/executed）
- `DETAILED_EXTRA_COLUMNS` 定义了 11 列额外列
- `setMode('simple')` 调用 `getColumnsForMode('simple')` 正确返回 7 列
- **但 `DataTableRow.tsx` 的 title 列副标题中硬编码了 `row.executedBy`（执行人）和 Smart Tags（Slow/Defect），这些字段在 Simple 模式下数据为空/不存在**
- `ExecutedCell` 组件显示 "Yes"/"No" 而非中文 "是"/"否"（`getCellValue` 返回 "是"/"否"，但 `ExecutedCell` 判断 `value === 'Yes'`，永远不匹配）
- Simple 模式下 `avgDuration` 为 0（因为 `duration` 字段不存在），Smart Tags 不会显示，但逻辑上不应计算

**根因**：
1. Simple 模式仅调用 `fetchCaseList` API，返回的 `TestCaseItem` 只有 7 个字段，`MergedTestCase` 的额外字段（duration/executedBy/defectURI 等）全部为 undefined
2. 列配置正确只有 7 列，但行渲染中的 title 副标题区域无条件显示 `executedBy` 等字段
3. `ExecutedCell` 的判断逻辑与 `getCellValue` 的返回值不匹配

### 问题二：Detailed 模式下行展开/折叠与抽屉功能重复

**现状**：
- 单击行 → `onToggleExpand(row.id)` → 展开行内详情（`DataRowDetail`）
- 双击行 → `onRowDrawer(row)` → 打开右侧抽屉（`RowDrawer` → 也使用 `DataRowDetail`）
- 右键菜单 → "展开详情/收起详情" → 同样调用 `toggleRowExpanded`
- 键盘 Enter → `toggleRowExpanded(id)` → 展开行内详情
- 抽屉和行内展开使用的是**完全相同的 `DataRowDetail` 组件**，内容 100% 重复

**问题**：
1. 两个交互路径展示完全相同的内容，用户体验冗余
2. 单击展开行内详情会撑开表格，影响浏览效率
3. 双击打开抽屉的交互不够直观（用户不一定知道要双击）

### 问题三：其他功能/UI 问题

经过全面审查，发现以下额外问题：

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 3.1 | `ExecutedCell` 显示逻辑错误 | `DataTableRow.tsx:74` | `value === 'Yes'` 但 `getCellValue` 返回 `'是'/'否'`，导致永远显示 "no" 样式 |
| 3.2 | Simple 模式下 title 副标题显示无意义 | `DataTableRow.tsx:214-219` | `row.executedBy` 在 Simple 模式下为 undefined，显示 "未分配执行人"；`row.testEnvironment` 虽然有值但与独立列重复 |
| 3.3 | 空状态页面英文混用 | `DataTableView.tsx` | 标题/按钮/提示中英文混杂，如 "Explore Test Data" / "Load Sample Data" / "Simple mode fetches case list..." |
| 3.4 | 批量操作栏英文 | `DataTableView.tsx:90-111` | "selected" / "Copy pytest" / "Copy IDs" / "Clear" / "Too long" |
| 3.5 | 工具栏英文 | `DataTableToolbar.tsx` | "Clear" / "Refresh" / "Invert" / "Select Page" / "selected" / "Export CSV/JSON" |
| 3.6 | 右键菜单中英混杂 | `ContextMenu.tsx` | "展开详情" / "收起详情"（中文） vs "复制 ID" / "复制行数据"（中文），但 ResultBadge 值为中文（通过/失败） |
| 3.7 | 行详情全英文 | `DataRowDetail.tsx` | "Execution Info" / "Executed At" / "Duration" / "Executed By" / "Result" / "Defect" / "Step Results" / "Comments" / "Related Links" / "Case Design Info" / "Prerequisites" / "Automation" / "Feature Cluster" / "Feature Name" / "Test Steps" / "Description" / "Expected Result" |
| 3.8 | 抽屉面板英文 | `RowDrawer.tsx` | 无明显英文问题，但标题区域直接显示 id + title，无标签 |
| 3.9 | 分页器英文 | `DataTablePagination.tsx` | 需检查 |
| 3.10 | 键盘快捷键提示英文 | `DataTableView.tsx:244-284` | "Navigate Rows" / "Expand / Collapse" / "Select Row" / "Close Drawer" |
| 3.11 | 表格空状态提示中英混杂 | `DataTable.tsx:246-258` | "筛选结果为空" / "暂无测试数据"（中文） vs "当前页暂无数据" / "请调整筛选条件以查看数据"（中文），整体一致但风格不统一 |
| 3.12 | Simple 模式下 Smart Tags 逻辑不应执行 | `DataTableRow.tsx:98-112` | `useSmartTags` 在 Simple 模式下仍计算，虽然不会显示但浪费计算 |
| 3.13 | sealed 状态下模式按钮文字缩写不直观 | `DataTableHeader.tsx:194-202` | "S" / "D" 缩写含义不明 |

---

## 修复方案

### 修复一：Simple 模式只显示 caselist 接口数据对应的列

**改动文件**：
1. **`DataTableRow.tsx`** — title 列副标题区域根据模式条件渲染：
   - Simple 模式：副标题只显示 `testPriority`（优先级）和 `testEnvironment`（环境），不显示 `executedBy`
   - Detailed 模式：副标题显示 `testEnvironment` + `executedBy` + `testPriority` + Smart Tags

2. **`DataTableRow.tsx`** — 修复 `ExecutedCell` 判断逻辑：`value === '是'` 而非 `value === 'Yes'`

3. **`DataTable.tsx`** — `avgDuration` 仅在 Detailed 模式下计算，Simple 模式传 0

### 修复二：Detailed 模式取消行展开/折叠，改为单击打开抽屉

**改动文件**：
1. **`DataTableRow.tsx`**：
   - 移除 `isExpanded` / `onToggleExpand` props
   - 移除展开箭头列（`ChevronRight` 图标的 td）
   - 单击行 → 直接打开抽屉（`onRowDrawer`）
   - 移除行内详情渲染（`isExpanded && <DataRowDetail>`）

2. **`DataTable.tsx`**：
   - 移除 `expandedRows` / `toggleRowExpanded` 引用
   - 移除 `handleToggleExpand` 回调
   - 移除 colgroup 中的展开列 `<col style={{ width: '30px' }} />`
   - 移除 thead 中展开列的 `<th>`
   - 不再传递 `isExpanded` / `onToggleExpand` 给 `DataTableRow`

3. **`ContextMenu.tsx`**：
   - 移除"展开详情/收起详情"菜单项
   - 移除 `toggleRowExpanded` / `expandedRows` 引用
   - 添加"打开详情"菜单项（调用 `onRowDrawer`）

4. **`DataTableView.tsx`**：
   - 移除 `toggleRowExpanded` 引用
   - 键盘 Enter → 打开抽屉而非展开行
   - 移除空状态中 "Expand / Collapse" 快捷键提示

5. **`useDataTableStore.ts`**：
   - 保留 `expandedRows` / `toggleRowExpanded` 等状态（不删除，避免破坏持久化兼容性），但实际不再使用

6. **`data-table.css`**：
   - 移除 `.dt-table-cell-expand` 和 `.dt-expand-icon` 相关样式
   - 移除 `.dt-table-row.expanded` 和 `.dt-table-row-detail` 相关样式

### 修复三：其他 UI 问题修复

**3.1 ExecutedCell 修复**（已包含在修复一中）

**3.2-3.10 中英文统一**：将所有英文 UI 文本统一为中文

| 组件 | 改动 |
|------|------|
| `DataTableView.tsx` | "Explore Test Data" → "探索测试数据"；"Load Sample Data" → "加载示例数据"；"selected" → "已选"；"Copy pytest" → "复制 pytest"；"Copy IDs" → "复制 ID"；"Clear" → "清除"；"Too long" → "过长"；"Keyboard Shortcuts" → "键盘快捷键"；"Navigate Rows" → "导航行"；"Expand / Collapse" → "展开/收起"→删除；"Select Row" → "选择行"；"Close Drawer" → "关闭抽屉"；"Simple mode fetches..." → "简易模式获取用例列表，详细模式获取完整执行详情" |
| `DataTableToolbar.tsx` | "Clear" → "清除"；"Refresh" → "刷新"；"Invert" → "反选"；"Select Page" → "选当前页"；"selected" → "已选"；"Export CSV" → "导出 CSV"；"Export JSON" → "导出 JSON" |
| `DataRowDetail.tsx` | "Execution Info" → "执行信息"；"Executed At" → "执行时间"；"Duration" → "耗时"；"Executed By" → "执行人"；"Result" → "结果"；"Defect" → "缺陷"；"View Defect" → "查看缺陷"；"Step Results" → "步骤结果"；"Comments" → "评论"；"Related Links" → "相关链接"；"Case Design Info" → "用例设计信息"；"Prerequisites" → "前置条件"；"Automation" → "自动化"；"Feature Cluster" → "功能集群"；"Feature Name" → "功能名称"；"Test Steps" → "测试步骤"；"Description" → "描述"；"Expected Result" → "预期结果"；"Failed to fetch case details..." → "用例详情获取失败，部分信息可能不完整" |
| `ContextMenu.tsx` | "展开详情/收起详情" → 改为"查看详情"；"复制 ID" 保持；"复制行数据" 保持；"仅查看此结果" 保持；"清除结果过滤" 保持 |
| `DataTableHeader.tsx` | sealed 状态下 "S"/"D" → "Simple"/"Detailed"（或保持完整文字） |
| `DataTablePagination.tsx` | 检查并中文化 |
| `DataTable.tsx` | "筛选结果为空" 等保持中文 |

**3.12 Smart Tags 优化**：在 `DataTableRow` 中，Simple 模式下跳过 `useSmartTags` 调用

**3.13 模式按钮缩写**：sealed 状态下保持完整文字 "Simple"/"Detailed"

---

## 实施步骤

### Step 1: 修复 ExecutedCell 和 title 副标题的条件渲染
- 文件：`DataTableRow.tsx`
- 修复 `ExecutedCell` 的判断值
- title 副标题根据 mode 条件渲染

### Step 2: 移除行展开/折叠功能，改为单击打开抽屉
- 文件：`DataTableRow.tsx`, `DataTable.tsx`, `ContextMenu.tsx`, `DataTableView.tsx`
- 移除展开箭头列、行内详情、展开相关状态
- 单击行 → 打开抽屉
- 右键菜单更新

### Step 3: 中英文统一
- 文件：`DataTableView.tsx`, `DataTableToolbar.tsx`, `DataRowDetail.tsx`, `ContextMenu.tsx`, `DataTableHeader.tsx`, `DataTablePagination.tsx`
- 所有英文 UI 文本改为中文

### Step 4: CSS 清理
- 文件：`data-table.css`
- 移除展开列和行内详情相关样式

### Step 5: 验证构建
- 运行 `npx tsc --noEmit` 和 `npm run build`
