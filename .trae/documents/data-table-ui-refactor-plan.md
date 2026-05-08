# Data Table UI 重构计划

## 一、现状分析

### 1.1 组件结构
- `DataTableView.tsx` — 顶层容器，整合 header、toolbar、table、pagination、drawer
- `DataTableHeader.tsx` — 查询栏（模式切换、Project ID / Test Run ID 输入、查询按钮、历史）
- `DataTableToolbar.tsx` — 工具栏（密度切换、刷新、列显隐、视图预设、导出）
- `DataTable.tsx` — 核心表格（表头、排序、筛选、列宽拖拽、骨架屏、空状态）
- `DataTableRow.tsx` — 行渲染（结果 badge、智能标签、高亮、右键菜单入口）
- `DataTablePagination.tsx` — 分页
- `RowDrawer.tsx` / `DataRowDetail.tsx` — 右侧抽屉详情
- `ColumnFilterPopup.tsx` / `ColumnVisibilityPopup.tsx` / `ViewPresetManager.tsx` / `ContextMenu.tsx` — 弹出层
- `data-table.css` — 全部样式（~890 行）

### 1.2 外部样式影响
- 全局 CSS 变量：`--bg-primary`, `--bg-secondary`, `--text-primary`, `--accent`, `--border-color`, `--shadow-lg` 等
- 主题系统：支持 `data-theme="dark"` 与 `data-visual-style="immersive"`（毛玻璃）
- 字体：`--font-sans`, `--font-mono`
- 全局动画：`fadeIn`, `slideUp`, `scaleIn` 等
- 全局按钮/输入框重置样式

### 1.3 当前主题风格特征
- **Apple / macOS 风格**：圆角（6–12px）、柔和阴影、细腻的 hover/active 状态
- **Immersive 模式**：backdrop-filter 毛玻璃、渐变高光、内阴影、ambient 背景动画
- **色彩**：蓝色 accent（#007AFF）、绿色 success、橙色 warning、红色 error
- **排版**：Inter / MiSans / PingFang SC，字号 11–13px 为主，字重 500–600
- **交互**：微动效（spring、ease-out-expo）、聚焦光环、按钮缩放反馈

---

## 二、重构目标

**完全打破现有视觉结构**，按照当前项目主题风格重新设计一套 UI，不基于现有样式做渐进优化。保留所有功能与交互逻辑，仅重构视觉呈现。

### 2.1 设计方向：「Neumorphism + Cyber-Data」融合

结合项目已有的 Immersive 毛玻璃能力与 data-table 的数据密集型特征，采用：
- **深色基底 + 霓虹点缀**：以深色/暗色为主背景，用 accent 色做数据高亮
- **卡片化层级**：表格不再是传统 `<table>` 线框，而是卡片列表 + 表头的组合
- **微光与渐变**：表头渐变、行 hover 微光、状态 badge 发光
- **沉浸式毛玻璃**：在 immersive 模式下全面启用 backdrop-filter
- **更紧凑的信息密度**：行内信息重组，减少垂直空间浪费
- **动态数据感**：骨架屏 shimmer、加载脉冲、数据刷新动画

---

## 三、重构步骤

### Step 1: 重写 `data-table.css`
- 删除全部现有 `.dt-*` 样式
- 新建设计系统 token（保留对全局 CSS 变量的引用，但增加 data-table 专属变量）
- 定义新的布局结构：`.dt-view` → `.dt-header` → `.dt-workspace` → `.dt-card-table`
- 实现卡片化表格样式（表头固定、行卡片、hover 微光、选中态发光边框）
- 重写所有弹出层（filter、visibility、preset、context menu）为毛玻璃卡片
- 重写 drawer 为全高毛玻璃侧滑面板
- 重写空状态、骨架屏、batch bar、pagination
- 保留并优化所有动画（进入、排序、选中、hover）

### Step 2: 调整 `DataTable.tsx`
- 将 `<table>` 结构改为 `div` 网格布局（表头固定 + 行卡片列表）
- 保留 colgroup 逻辑，改为 CSS Grid / Flex 列宽控制
- 保留所有交互（排序、筛选、列宽拖拽、checkbox、空状态、骨架屏）
- 调整 className 映射到新 CSS

### Step 3: 调整 `DataTableRow.tsx`
- 行渲染从 `<tr>` 改为 `<div className="dt-card-row">`
- 重组单元格布局：ID + Title 合并为主信息区，结果 badge 放大为左侧色带
- 智能标签（Slow / Defect）改为右上角微型发光徽标
- 保留文本高亮、右键菜单、点击 drawer 打开

### Step 4: 调整 `DataTableHeader.tsx`
- 查询栏改为顶部一体化卡片（毛玻璃背景）
- 模式切换改为滑动胶囊指示器
- 输入框改为无边框底线下划线风格（immersive 下透明背景）
- 查询按钮改为渐变发光主按钮
- 面包屑 sealed 态改为标签 chip 样式

### Step 5: 调整 `DataTableToolbar.tsx`
- 工具栏改为悬浮毛玻璃条（sticky 在表格上方）
- 密度切换改为图标按钮组 + active 发光
- 导出/更多菜单改为下拉毛玻璃面板

### Step 6: 调整 `DataTablePagination.tsx`
- 分页改为极简风格（页码胶囊 + 箭头按钮）
- active 页码带发光效果

### Step 7: 调整 `RowDrawer.tsx` + `DataRowDetail.tsx`
- Drawer 改为全高毛玻璃面板（带顶部渐变高光）
- 详情内容改为卡片区块（执行信息、步骤结果、评论、链接）
- 增加区块进入动画（stagger）

### Step 8: 调整弹出层组件
- `ColumnFilterPopup`：毛玻璃下拉面板，筛选选项带 hover 微光
- `ColumnVisibilityPopup`：拖拽感列开关列表
- `ViewPresetManager`：预设卡片网格
- `ContextMenu`：毛玻璃右键菜单，带分隔线与快捷键提示

### Step 9: 兼容性检查
- 确保 `data-theme="dark"` 与 `data-visual-style="immersive"` 下表现正确
- 确保响应式（<768px, <480px）有合理降级
- 确保 `prefers-reduced-motion` 下动画关闭

---

## 四、文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `data-table.css` | 完全重写 | 新视觉系统 |
| `DataTable.tsx` | 修改 | 结构改为 div 网格 |
| `DataTableRow.tsx` | 修改 | 行卡片化 |
| `DataTableHeader.tsx` | 修改 | 新查询栏风格 |
| `DataTableToolbar.tsx` | 修改 | 悬浮工具条 |
| `DataTablePagination.tsx` | 修改 | 新分页风格 |
| `RowDrawer.tsx` | 修改 | 毛玻璃抽屉 |
| `DataRowDetail.tsx` | 修改 | 卡片区块详情 |
| `ColumnFilterPopup.tsx` | 修改 | 毛玻璃面板 |
| `ColumnVisibilityPopup.tsx` | 修改 | 列开关列表 |
| `ViewPresetManager.tsx` | 修改 | 预设卡片 |
| `ContextMenu.tsx` | 修改 | 毛玻璃菜单 |
| `DataTableView.tsx` | 轻微修改 | 容器 className 调整 |
| `EllipsisText.tsx` | 不修改 | 无视觉变更 |

---

## 五、设计 Token 草案（供 CSS 使用）

```css
.dt-view {
  --dt-bg: var(--bg-primary);
  --dt-surface: var(--bg-secondary);
  --dt-elevated: var(--bg-panel);
  --dt-border: var(--border-light);
  --dt-border-strong: var(--border-color);
  --dt-text: var(--text-primary);
  --dt-text-muted: var(--text-secondary);
  --dt-text-dim: var(--text-tertiary);
  --dt-accent: var(--accent);
  --dt-accent-glow: var(--accent-glow);
  --dt-radius: var(--radius-lg);
  --dt-radius-sm: var(--radius-sm);
  --dt-shadow: var(--shadow-md);
  --dt-shadow-lg: var(--shadow-lg);
  --dt-glass: var(--glass-bg);
  --dt-glass-border: var(--glass-border);
  --dt-transition: 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 六、风险与注意事项

1. **表格语义化**：从 `<table>` 改为 `<div>` 会损失部分 a11y，需手动添加 `role="grid"` 等 ARIA 属性（当前已有，需保留）
2. **列宽拖拽**：colgroup + table 的列宽逻辑与 CSS Grid 不同，需用 grid-template-columns + resize observer 或保持 table 但改变视觉风格
3. **性能**：大量行时 div 网格性能可能略低于 table，但现代浏览器差距极小；可接受
4. **Immersive 模式**：需测试 backdrop-filter 在大量 DOM 元素下的性能

---

## 七、验收标准

- [ ] 所有现有功能正常工作（查询、排序、筛选、分页、列宽拖拽、列显隐、视图预设、导出、批量操作、抽屉详情、右键菜单、键盘导航）
- [ ] 深色主题与 Immersive 模式视觉一致
- [ ] 响应式布局在 768px 以下正常
- [ ] 动画流畅，无闪烁或卡顿
- [ ] 无 CSS 类名冲突或全局样式污染
