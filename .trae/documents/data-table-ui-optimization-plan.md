# 数据表 UI 优化计划

## 一、现状分析

### 1.1 项目主题设计体系

通过分析 RequestView、WorkflowView、RemoteToolsView 三个核心页面，提取出以下设计模式：

**核心设计特征：**
- **视觉风格**: 现代极简 + 玻璃拟态（immersive 模式下）
- **色彩体系**: CSS 变量驱动，支持 light/dark/immersive 三态切换
- **圆角规范**: `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 12px`
- **阴影层级**: `--shadow-sm/md/lg/xl` 四级阴影体系
- **动效语言**: `cubic-bezier(0.16, 1, 0.3, 1)` 为主，spring 效果为点缀
- **边框风格**: 1px 细边框，颜色使用 `--border-light` / `--border-color`
- **交互反馈**: hover 时 translateY(-1px) + 阴影/发光，active 时 scale(0.96)

**其他页面的优秀实践：**
- RequestView: URL 输入框底部 accent 线条动画、tab 指示器滑动动画、glass 卡片效果
- WorkflowView: 节点 palette 悬浮位移、saved workflows 展开动画、toolbar 按钮统一风格
- RemoteToolsView: 空状态卡片、panel 玻璃效果、resize handle 视觉反馈

### 1.2 数据表当前问题诊断

#### 问题 A: 过滤弹框样式割裂

**现状：**
- `ColumnFilterPopup` 使用 `createPortal` 渲染到 body，采用固定定位
- 弹框背景色写死为 `#ffffff`（亮色）和 `#2a2a2e`（暗色），**未使用 CSS 变量**
- 输入框 `.dt-col-filter-input` 背景色写死 `#f5f5f7` / `#1c1c1e`
- 按钮 `.dt-col-filter-cancel`、`.dt-col-filter-special-btn` 背景色全部写死
- 选中项 hover 背景写死 `#e8e8ec` / `#3a3a3e`
- 弹框阴影为硬编码 `0 8px 32px rgba(0,0,0,0.18)`

**问题影响：**
- 无法跟随主题切换（特别是 immersive 模式的 glass 效果完全缺失）
- 与其他页面的 dropdown/popup 风格不一致
- 暗色模式下视觉突兀

#### 问题 B: 表格列显示效果粗糙

**现状：**
- 表头 `.dt-table-header-row` 背景为纯色，无渐变/玻璃效果
- 表头文字 `text-transform: uppercase`，但字号仅 11px，过于拥挤
- 单元格 `.dt-table-cell` 统一使用 `white-space: nowrap`，长内容截断无 Tooltip
- 行 hover 效果仅改变背景色，无位移/阴影提升
- 选中行的左侧 accent 线条（3px）过于突兀，无过渡动画
- 排序图标使用 Unicode 字符（`\u2191`），无 Lucide 图标精致
- 密度切换仅改变 padding，行高变化生硬

**具体列渲染问题：**
- `title` 列使用 `EllipsisText` 组件截断，但无 hover tooltip 显示完整内容
- `result` badge 圆角为 10px（pill 形状），与其他页面的 badge（`--radius-sm`）不一致
- `duration` 列仅使用颜色区分热度，无视觉条/进度条辅助
- `id` 列使用 mono 字体，但无 copy 按钮
- `defectURI` 列链接样式与整体 button 风格不一致

#### 问题 C: 整体样式效果不协调

**Toolbar 区域：**
- 查询输入框 `.dt-input` 高度 28px，与其他页面 36-40px 的输入框不协调
- 搜索按钮使用渐变背景，但其他页面的 primary button 使用纯色 `--accent`
- 密度切换按钮组样式过于紧凑，无现代 segmented control 风格
- 历史记录下拉 `.dt-history-popup` 无 glass 效果

**Pagination 区域：**
- 分页按钮 `.dt-pagination-btn` 样式与 WorkflowView 的 `.toolbar-btn` 差异大
- 当前页按钮使用渐变背景，与其他页面 active 状态不一致
- "Go to" 跳转区域样式简陋，输入框无统一风格

**Filter Tags 区域：**
- tag 的左侧竖线装饰（`::before` width: 3px）过于生硬
- tag 发光效果 `box-shadow: 0 0 8px var(--dt-accent-glow)` 在亮色模式下过强
- 无 tag 拖拽排序功能

**Empty State：**
- 空状态 SVG 为硬编码 rect，无 Lucide 图标精致
- 无快捷操作按钮（如"加载示例数据"）

**Row Detail / Drawer：**
- Drawer 边框为纯色，无 glass 效果
- 详情内部分段标题样式与整体 card 风格不一致

## 二、优化方案

### 2.1 过滤弹框全面重构

**目标：** 与其他页面的 dropdown/popup 保持统一，支持 glass 效果。

**具体措施：**

1. **背景与边框**
   - 移除所有写死颜色，改用 CSS 变量：`var(--bg-panel)`, `var(--border-color)`, `var(--shadow-lg)`
   - 增加 immersive 模式适配：
     ```css
     [data-visual-style="immersive"] .dt-col-filter-popup {
       background: var(--glass-bg);
       backdrop-filter: blur(var(--glass-blur-md)) var(--glass-saturate);
       border: 1px solid var(--glass-border);
       box-shadow: var(--glass-inner-shadow), var(--glass-elevation-2);
     }
     ```

2. **输入框统一**
   - `.dt-col-filter-input` 改为使用 `.dt-input` 或统一输入框样式
   - 背景色改用 `var(--bg-input)`，边框色 `var(--border-color)`
   - focus 状态使用 `var(--input-focus-ring)`

3. **按钮统一**
   - Cancel 按钮改为 `.btn-secondary` 风格：背景 `var(--bg-secondary)`，边框 `var(--border-color)`
   - Apply 按钮改为 `.btn-primary` 风格：背景 `var(--accent)`，hover `var(--accent-hover)`
   - 特殊筛选按钮（Select All/None）改为 subtle 风格

4. **列表项优化**
   - 选中 checkbox 改用与表格一致的自定义 checkbox 样式
   - hover 背景改用 `var(--bg-hover)`
   - 增加项之间的分隔线或增大 gap

5. **动画增强**
   - 弹框打开增加 `dt-scaleIn` 动画
   - 列表项 stagger 进入动画
   - 筛选值数量 badge 增加 scaleIn 动画

6. **布局改进**
   - 搜索框固定在顶部，列表可滚动区域明确分隔
   - 底部操作栏增加顶部边框分隔
   - 增加"全选"/"清空"快捷操作，放在搜索框下方

### 2.2 表格列显示效果优化

**目标：** 提升信息密度、可读性和视觉层次。

**具体措施：**

1. **表头重构**
   - 背景增加 subtle 渐变或 glass 效果（immersive 模式）
   - 文字取消 `text-transform: uppercase`，改用正常大小写 + `font-weight: 600`
   - 字号提升到 `var(--text-sm)` (12px)
   - 排序图标改用 Lucide `ArrowUp`, `ArrowDown` 或 `ChevronsUpDown`
   - 多排序时显示数字 badge，样式与 RequestView 的 `tab-badge` 统一
   - 表头底部边框改为 1px `var(--border-color)`，去掉 2px 粗边框

2. **行效果优化**
   - hover 时增加 `transform: translateY(-1px)` + `box-shadow: var(--shadow-sm)`
   - 选中行左侧 accent 线条改为渐变透明：`linear-gradient(180deg, var(--dt-accent), transparent)`
   - 选中行增加 subtle 背景色变化，而非强色块
   - 行与行之间增加 1-2px 间隙（gap 或 margin），形成 card 感
   - 增加 zebra striping（可选，由 density 控制）

3. **单元格内容优化**

   | 列 | 当前问题 | 优化方案 |
   |---|---------|---------|
   | title | 截断无 tooltip | 增加 Tooltip 显示完整内容；悬浮时显示 copy 按钮 |
   | result | badge 风格不一致 | 统一为 `--radius-sm` 圆角；增加图标+文字间距；immersive 模式下增加 glow |
   | duration | 仅颜色区分 | 增加微型水平条（bar）辅助可视化；颜色使用 heat map |
   | id | 无交互 | 悬浮显示 copy 按钮；点击复制 |
   | executed | Yes/No badge 简陋 | 改用 check/x 图标 + 文字；或 switch toggle 风格 |
   | defectURI | 链接样式突兀 | 改用与 `.action-btn` 一致的 subtle 按钮风格 |

4. **密度切换增强**
   - comfortable: 行高 56px，字体 13px，完整显示 sub-info
   - standard: 行高 44px，字体 12px
   - compact: 行高 32px，字体 11px，隐藏 sub-info

5. **列宽自适应优化**
   - 当前 `calcProportionalWidths` 逻辑保留，但增加最小/最大宽度约束
   - 增加双击 resize handle 自动适配内容宽度的功能
   - 列宽调整时增加拖拽指示线（而非直接改变宽度）

### 2.3 整体样式协调优化

**Toolbar 区域：**

1. **输入框统一**
   - `.dt-input` 高度提升到 32px（与 `.method-select` 接近）
   - 圆角改为 `--radius-md` (8px)
   - 边框色统一为 `var(--border-color)`
   - focus 时底部增加 accent 线条动画（参考 RequestView `.url-bar::after`）

2. **按钮统一**
   - 搜索按钮改为纯色 `var(--accent)`，移除渐变（与其他页面 primary button 统一）
   - hover 时 `box-shadow: 0 4px 12px var(--accent-glow)`
   - 图标按钮统一为 32x32px，圆角 `--radius-md`

3. **密度切换器**
   - 改为现代 segmented control 风格：
     - 背景 `var(--bg-secondary)`，圆角 `--radius-md`
     - 选中项背景 `var(--bg-primary)` + `box-shadow: var(--shadow-sm)`
     - 增加切换时的滑动指示器动画

4. **历史记录下拉**
   - 增加 glass 效果（immersive 模式）
   - 项 hover 时增加 `transform: translateX(2px)`（与 template-item 一致）

**Pagination 区域：**

1. **按钮统一**
   - 分页按钮样式与 `.toolbar-btn` 统一
   - 当前页按钮使用 `var(--accent)` 背景，移除渐变
   - 禁用状态透明度改为 0.4

2. **信息展示**
   - "X-Y of Z" 信息增加 `font-variant-numeric: tabular-nums`
   - page size select 样式与 `.method-select` 统一

3. **跳转区域**
   - 输入框样式与 `.dt-input` 统一
   - 跳转按钮改为 icon-only（ChevronRight）

**Filter Tags 区域：**

1. **Tag 样式优化**
   - 移除左侧竖线装饰，改用 subtle 背景色区分
   - 背景色改为 `var(--accent-light)`，文字 `var(--accent)`
   - 圆角统一为 `--radius-sm`
   - 移除发光效果，改为 subtle border

2. **交互增强**
   - tag 增加 hover 状态：`background: var(--accent)`, `color: var(--text-inverse)`
   - 关闭按钮始终显示（而非 hover 显示），增加点击区域

**Empty State：**

1. **视觉升级**
   - 替换硬编码 SVG 为 Lucide `Table` 或 `Database` 图标
   - 增加空状态插画动画（float 或 pulse）
   - 标题和提示文字样式与 RemoteToolsView 空状态统一

2. **快捷操作**
   - 增加"Load Mock Data"按钮，样式与 `.empty-guide-action` 统一

**Row Detail / Drawer：**

1. **Glass 效果**
   - Drawer 背景增加 immersive 模式 glass 效果
   - 边框改为 `var(--glass-border)`

2. **内容展示**
   - 详情分段使用 card 风格：背景 `var(--bg-secondary)`，圆角 `--radius-lg`
   - 字段标签使用 `var(--text-tertiary)` + `font-weight: 600`
   - 增加字段复制按钮

### 2.4 新增交互与动画

1. **表格行进入动画**
   - 当前已有 `dt-rowEmerge`，但增加 stagger delay 计算优化
   - 大数据量时（>100 行）自动禁用进入动画

2. **表头吸顶效果**
   - 当前已有 `position: sticky`，但增加滚动时的阴影变化
   - 滚动时表头底部阴影加深：`box-shadow: 0 2px 8px rgba(0,0,0,0.06)`

3. **列拖拽调整优化**
   - 拖拽时显示垂直指示线，而非直接改变列宽
   - 释放时平滑过渡到新宽度

4. **筛选状态指示**
   - 表头筛选按钮在有筛选条件时显示 dot indicator
   - 与 RequestView 的 `tab-badge.dot` 风格统一

## 三、实施步骤

### Phase 1: 基础变量统一（低风险）
1. 将 `data-table.css` 中所有写死颜色替换为 CSS 变量
2. 统一输入框、按钮、下拉框的基础样式
3. 增加 immersive 模式适配规则

### Phase 2: 组件样式重构（中风险）
1. 重构 `ColumnFilterPopup` 弹框样式
2. 重构表头、行、单元格样式
3. 重构 Pagination、FilterTags 样式
4. 重构 Empty State、Drawer 样式

### Phase 3: 交互增强（中风险）
1. 增加 Tooltip 到截断内容
2. 优化行 hover/选中动画
3. 增加表头滚动阴影效果
4. 优化列宽拖拽体验

### Phase 4: 细节打磨（低风险）
1. 统一 badge、icon、按钮尺寸
2. 调整字体大小、行高、间距
3. 测试三种主题模式下的视觉效果
4. 测试响应式布局

## 四、设计规范速查

### 颜色使用规范
| 元素 | 变量 |
|-----|------|
| 主背景 | `--bg-primary` |
| 次级背景 | `--bg-secondary` |
| 面板背景 | `--bg-panel` |
| 输入框背景 | `--bg-input` |
| 悬停背景 | `--bg-hover` |
| 主文字 | `--text-primary` |
| 次级文字 | `--text-secondary` |
| 辅助文字 | `--text-tertiary` |
| 主强调色 | `--accent` |
| 成功色 | `--success` |
| 警告色 | `--warning` |
| 错误色 | `--error` |

### 尺寸规范
| 元素 | 尺寸 |
|-----|------|
| 小按钮/图标按钮 | 32x32px |
| 主按钮高度 | 32px |
| 输入框高度 | 32px |
| 圆角（小） | `--radius-sm: 6px` |
| 圆角（中） | `--radius-md: 8px` |
| 圆角（大） | `--radius-lg: 12px` |
| 表格行高（comfortable） | 56px |
| 表格行高（standard） | 44px |
| 表格行高（compact） | 32px |

### 动效规范
| 场景 | 时长 | 缓动函数 |
|-----|------|---------|
| hover 过渡 | 140ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 弹框打开 | 240ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 内容切换 | 200ms | `ease-out` |
| spring 效果 | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
