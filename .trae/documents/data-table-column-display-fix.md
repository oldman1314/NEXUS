# 数据表格列数据显示不完整修复计划

## 一、问题诊断

### 1.1 列数据映射正确性分析

**简单模式列定义**（SIMPLE_COLUMNS）：
| key | label | 数据源字段 | 状态 |
|-----|-------|-----------|------|
| checkbox | '' | - | OK |
| id | ID | TestCaseItem.id | OK |
| title | 标题 | TestCaseItem.title | OK |
| result | 结果 | TestCaseItem.result | OK |
| testPriority | 优先级 | TestCaseItem.testPriority | OK |
| testContent | 测试内容 | TestCaseItem.testContent | OK |
| testEnvironment | 测试环境 | TestCaseItem.testEnvironment | OK |
| executed | 是否执行 | TestCaseItem.executed | OK |

**详细模式新增列**（DETAILED_EXTRA_COLUMNS）：
| key | label | 数据源字段 | 状态 |
|-----|-------|-----------|------|
| duration | 耗时(秒) | TestRecord.duration | OK (已修复) |
| executedTime | 执行时间 | TestRecord.executed | OK (已修复) |
| executedBy | 执行人 | 从 executedByURI 提取 | OK (已修复) |
| stepResultCount | 执行步骤数 | TestRecord.testStepResults | OK (已修复) |
| defectURI | 缺陷 | TestRecord.defectURI | OK (已修复) |
| assignee | 负责人 | TestCaseDetail.assignee | OK (已修复) |
| caseStatus | 用例状态 | TestCaseDetail.status | OK (已修复) |
| automation | 自动化状态 | customFields | OK (已修复) |
| featureCluster | 功能集群 | customFields | OK (已修复) |
| featureName | 功能名称 | customFields | OK (已修复) |
| testStepCount | 设计步骤数 | TestCaseDetail.testSteps | OK (已修复) |

**结论**：数据字段映射**已正确**，Mock 数据完整。问题不在数据层，而在**渲染层和宽度层**。

### 1.2 列宽问题根因分析

**列宽计算流程**（DataTableView.tsx → calcProportionalWidths）：

1. 采样前 80 行数据
2. 对每个可见列，计算表头宽度（`measureTextWidth(col.label) + HEADER_EXTRA(56px)`）和数据 p95 宽度
3. 权重 = `max(headerWidth, p95Width, 80px)`
4. 按比例分配到容器宽度

**问题点 A：表头文字宽度计算不足**

- `measureTextWidth` 对 CJK 字符使用 14px/字符，但表头 label 为中文（如"自动化状态"4字=56px，加上 HEADER_EXTRA=112px）
- 实际渲染的 label 是 `var(--text-sm) 12px` 字体，每个中文字约 12px 宽，4 字 = 48px
- `HEADER_EXTRA` 为 56px，但实际需要的额外空间包括 padding(16px×2) + sort icon(22px) + filter icon(22px) + 间距 ≈ 80px
- 导致表头 label 被截断

**问题点 B：固定宽度列过多导致宽度竞争**

简单模式下可见列总固定宽度：
- checkbox: 44
- id: 100
- title: 300
- result: 90
- testPriority: 90
- testContent: 160
- testEnvironment: 110
- executed: 90
- **总计**：984px

详细模式下新增可见列：
- duration: 90
- executedTime: 160
- executedBy: 120
- assignee: 120
- automation: 140
- featureCluster: 100
- featureName: 120
- **总计**：850px

**详细模式总宽度需求**：984 + 850 = **1834px**

如果表格容器宽度 < 1834px，按比例分配后某些列会被压缩到最小宽度，导致列名显示不全。

**问题点 C：CSS `min-width` 与计算逻辑不一致**

- CSS 层面对 `dt-table-cell` 设置了 `min-width: 0` 导致内容可以被压缩到 0
- 但表头 `dt-table-header-label` 也设置了 `min-width: 0` + `overflow: hidden`
- 导致即使计算出的宽度足够，表头文字也可能被压缩截断

### 1.3 空值/缺失数据的渲染问题

虽然数据映射已修复，但渲染时仍有以下问题：
- 简单模式下，如果 `testPriority`/`testContent`/`testEnvironment` 等字段在 mock 数据中存在，但被 `executed` 列的 0/1 值影响导致渲染异常
- 某些列的 fallback 显示为空白而非 `-`

## 二、修复方案

### 2.1 修复列宽计算逻辑

**目标**：让所有列名完整显示，内容不被过度压缩。

**措施**：

1. **增加 HEADER_EXTRA 常量**：从 56px → 90px（容纳 padding + sort icon + filter icon + 间距）
2. **增加最小列宽约束**：从 `max(containerWidth * 0.06, 60)` → `max(containerWidth * 0.06, 80)`
3. **优化权重计算**：将表头文字宽度计算乘以 1.2 的放大系数，确保表头 label 不被截断
4. **为特定列增加硬编码最小宽度**：
   - result: 80px → 100px
   - testPriority: 70px → 90px
   - testEnvironment: 90px → 110px
   - executed: 70px → 100px
   - duration: 70px → 100px
   - executedTime: 120px → 160px
   - executedBy: 80px → 120px
   - automation: 100px → 140px

### 2.2 修复表头样式

**目标**：表头 label 不被截断，始终显示完整。

**措施**：

1. **移除表头 label 的 min-width: 0**：让 label 自然撑开，不被 flex 压缩
2. **增加表头单元格的 `white-space: nowrap`**：确保文字不换行
3. **调整表头单元格 padding**：从当前值减小到 8px 左右，留出更多空间
4. **字体大小调整**：从 `var(--text-sm)` 改为固定 `11px`（在紧凑表头中更合适）

### 2.3 修复单元格渲染

**目标**：所有列内容正确显示，空值显示 `-` 而非空白。

**措施**：

1. 在 `DataTableRow` 的 `useMemo` 依赖中，确保所有列 key 都有显式处理分支
2. 为每个列的渲染逻辑增加兜底：如果没有内容，返回 `<span style={{ color: 'var(--dt-text-dim)' }}>-</span>`
3. 检查 `getCellValue`（useFilteredData.ts）中的字段名映射是否与实际数据一致
4. 确保 `executed` 列对 `0` 值正确显示 "No"（而不是空白）

### 2.4 修复密度模式下的行高与列宽配合

**措施**：

1. compact 模式下，行高从 32px → 28px，字体从 11px → 10px
2. 增加密度 CSS 变量：`--dt-cell-fs` 根据 density 变化
3. 确保 CSS 类 `.dt-card-row` 在不同 density 下的 padding 正确

### 2.5 增加列可见性快速切换

**措施**（可选增强）：

1. 在 toolbar 中增加"显示/隐藏所有列"快捷操作
2. 默认只打开 8-10 个关键列，其他列默认隐藏
3. 用户可以通过列管理弹出菜单按需开启

## 三、实施步骤

### Step 1: 修复列宽计算逻辑（核心）
- 修改 `DataTableView.tsx` 中的 `HEADER_EXTRA` → 90
- 修改最小列宽约束 → 80px
- 权重计算增加 1.2 系数

### Step 2: 调整列配置默认宽度
- 修改 `useDataTableStore.ts` 中各列的 `width` 和 `minWidth`
- 确保简单模式总宽度 ≤ 900px
- 确保详细模式总宽度 ≤ 1800px

### Step 3: 修复表头样式
- 修改 `data-table.css` 中 `.dt-table-header-label` 的 `min-width`
- 调整 padding 和 font-size

### Step 4: 完善 DataTableRow 渲染
- 为每个列 key 添加显式处理 + 兜底 `-`
- 验证 executed 列对 0 值的显示

### Step 5: 测试验证
- 简单模式下验证 8 列数据完整显示
- 详细模式下验证 19 列数据完整显示
- 切换 density 验证行高适配
- 验证三种主题模式
