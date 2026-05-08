# 组件审查、性能优化与打包准备计划

## 一、现状分析

### 1.1 构建产物问题（打包阻塞项）

| 产物 | 大小 | Gzip | 问题 |
|------|------|------|------|
| **main.js** | **2,778 kB** | 204 kB | 🔴 严重超标，所有业务代码打成一个包 |
| **main.css** | **1,116 kB** | 345 kB | 🔴 严重超标，含大量未使用字体 CSS |
| lxgw-wenkai-latin-700.woff2 | 7,485 kB | - | 🔴 字体文件巨大 |
| lxgw-wenkai-latin-300.woff2 | 8,812 kB | - | 🔴 字体文件巨大 |
| lxgw-wenkai-latin-700.woff | 10,112 kB | - | 🔴 字体文件巨大 |
| lxgw-wenkai-latin-300.woff | 12,158 kB | - | 🔴 字体文件巨大 |
| vendor-xyflow.js | 177 kB | 56 kB | ✅ 已拆分 |
| vendor-react.js | 140 kB | 45 kB | ✅ 已拆分 |
| vendor-dnd.js | 48 kB | 16 kB | ✅ 已拆分 |
| vendor-lucide.js | 28 kB | 9 kB | ✅ 已拆分 |

### 1.2 大型组件清单（>300行，需拆分）

| # | 组件 | 行数 | useState | useCallback | React.memo | 内部子组件数 |
|---|------|------|----------|-------------|------------|-------------|
| 1 | RemoteToolsView.tsx | 1129 | 7 | 14 | ✅ 4个 | 6个 |
| 2 | WorkflowView.tsx | 869 | 16 | 22 | ❌ | 1个(AnimatedEdge) |
| 3 | RequestView.tsx | 522 | 14 | 10 | ❌ | 0 |
| 4 | PanelContainer.tsx | 473 | 6 | 11 | ❌ | 4个 |
| 5 | DataTableView.tsx | 455 | 2 | 17 | ❌ | 0 |
| 6 | SidebarCollections.tsx | 450 | 9 | 17 | ❌ | 0 |
| 7 | WebBrowser.tsx | 414 | 9 | 19 | ❌ | 0 |
| 8 | DataTableToolbar.tsx | 414 | 10 | 6 | ❌ | 0 |
| 9 | ResponsePanel.tsx | 396 | 4 | 4 | ✅ 5个 | 4个 |
| 10 | ColumnFilterPopup.tsx | 395 | 8 | 2 | ❌ | 0 |
| 11 | DataTable.tsx | 368 | 8 | 5 | ❌ | 0 |

### 1.3 TypeScript 状态
- `tsc --noEmit` ✅ 零错误
- `vite build` ✅ 构建成功（有 chunk 大小警告）

---

## 二、优化目标

1. **main.js 从 2,778 kB 降至 < 500 kB**（通过路由级懒加载 + 组件级代码拆分）
2. **所有组件文件 ≤ 200 行**（通过子组件抽取）
3. **所有高频渲染组件使用 React.memo**
4. **零功能回归**（每个 Phase 有验证清单）
5. **App.tsx / Sidebar.tsx 零改动**

---

## 三、打包优化（Phase 0 — 最高优先级，解决构建阻塞）

### 3.1 路由级懒加载

当前 `App.tsx` 直接 import 所有 View 组件，导致全部打入 main.js。

**修改 App.tsx**：
```tsx
// Before:
import RequestView from '@/components/views/RequestView'
import WorkflowView from '@/components/views/WorkflowView'
import DataTableView from '@/components/data-table/DataTableView'
import RemoteToolsView from '@/components/views/RemoteToolsView'

// After:
const RequestView = lazy(() => import('@/components/views/RequestView'))
const WorkflowView = lazy(() => import('@/components/views/WorkflowView'))
const DataTableView = lazy(() => import('@/components/data-table/DataTableView'))
const RemoteToolsView = lazy(() => import('@/components/views/RemoteToolsView'))
```

在路由渲染处添加 `<Suspense fallback={<LoadingSpinner />}>`。

**预期效果**：main.js 降至 ~600 kB，每个 View 生成独立 chunk（~100-300 kB）。

### 3.2 增强手动分块策略

在 `vite.config.ts` 的 `manualChunks` 中增加：

```typescript
manualChunks(id) {
  if (id.includes('node_modules')) {
    if (id.includes('@xyflow')) return 'vendor-xyflow'
    if (id.includes('@dnd-kit')) return 'vendor-dnd'
    if (id.includes('@floating-ui')) return 'vendor-floating'
    if (id.includes('lucide-react')) return 'vendor-lucide'
    if (id.includes('zustand')) return 'vendor-zustand'
    if (id.includes('prismjs')) return 'vendor-prism'
    if (id.includes('react')) return 'vendor-react'
    // 新增
    if (id.includes('lxgw-wenkai')) return 'fonts-lxgw'
    if (id.includes('harmonyos-sans')) return 'fonts-harmony'
    if (id.includes('xterm')) return 'vendor-xterm'
    if (id.includes('prismjs')) return 'vendor-prism'
  }
}
```

### 3.3 字体优化

lxgw-wenkai 字体总计 ~38 MB，是打包体积的最大元凶。

**方案**：将 lxgw-wenkai 字体改为按需加载（仅在中文环境加载），或考虑替换为系统字体回退。

---

## 四、组件拆分方案

### 核心原则
- **主文件保留原路径**，子组件抽取到同级子目录
- **App.tsx / Sidebar.tsx 零改动**（懒加载改造除外）
- 每个子组件使用 `React.memo`
- 保持现有导出方式（named/default 不变）

---

### Phase 1: ResponsePanel.tsx（396行 → ~70行主 + 4个子文件）

**当前状态**：已有 4 个 memo 子组件（ResponseBody/ErrorBanner/CookiesTable/TestsPanel），仅是定义在同一文件。

```
components/views/
├── ResponsePanel.tsx          (原路径，~70行，编排导入)
└── response/
    ├── ResponseBody.tsx       (~50行)
    ├── ErrorBanner.tsx        (~40行)
    ├── CookiesTable.tsx       (~60行)
    └── TestsPanel.tsx         (~60行)
```

**验证清单**：
- [ ] Body Tab: JSON Pretty/Raw 切换，大响应(>5MB)降级为 Raw
- [ ] Headers Tab: 表头列表 + 计数 badge
- [ ] Cookies Tab: set-cookie 解析（含逗号处理）
- [ ] Tests Tab: 测试结果 + Console Output
- [ ] ErrorBanner: 6种错误横幅
- [ ] 复制按钮：主复制 + Raw复制 + "Copied"反馈

---

### Phase 2: PanelContainer.tsx（473行 → ~100行主 + 4个子文件）

**当前状态**：4 个内部组件（TerminalStylePicker/SshConfigForm/SshStatusBadge/SshToolbarControls）。

```
components/remote-tools/
├── PanelContainer.tsx         (原路径，~100行)
└── panel/
    ├── TerminalStylePicker.tsx (~40行)
    ├── SshConfigForm.tsx       (~80行)
    ├── SshStatusBadge.tsx      (~30行)
    └── SshToolbarControls.tsx  (~70行)
```

**验证清单**：
- [ ] SSH 连接/断开按钮
- [ ] SSH 配置表单（Host/Port/User/Auth切换/Password/Key）
- [ ] 终端样式选择器（4种样式卡片）
- [ ] 状态徽章（Connected/Connecting/Error/Disconnected）
- [ ] 面板标题编辑（双击/回车确认/ESC取消）
- [ ] 最大化/还原切换
- [ ] 清除终端按钮

---

### Phase 3: DataTable.tsx（368行 → ~60行主 + 4个子文件）

```
components/data-table/
├── DataTable.tsx              (原路径，~60行，命名导出不变)
└── table/
    ├── DataTableHeader.tsx    (~80行)
    ├── DataTableBody.tsx      (~60行)
    ├── CheckboxSelectMenu.tsx (~60行)
    └── DataTableEmptyState.tsx(~50行)
```

**验证清单**：
- [ ] 表头排序 + 排序序号
- [ ] 列过滤弹窗
- [ ] 列宽度拖动调整
- [ ] 复选框全选/部分选中 + 下拉菜单4种模式
- [ ] 行点击/选中/键盘导航
- [ ] 右键上下文菜单
- [ ] 展开行详情
- [ ] 骨架屏 + 空态

---

### Phase 4: SidebarCollections.tsx（450行 → ~80行主 + 3个子文件）

```
components/layout/sidebar/
├── SidebarCollections.tsx     (原路径，~80行)
└── collections/
    ├── CollectionsHeader.tsx  (~50行)
    ├── CollectionsList.tsx    (~80行)
    └── DragOverlayContent.tsx (~40行)
```

**验证清单**：
- [ ] Export All / Import All / Import File / New Collection 按钮
- [ ] 集合列表展开/折叠
- [ ] 拖拽排序集合 + 拖拽排序请求（同集合+跨集合）
- [ ] 拖拽覆盖层
- [ ] 行内编辑（双击名称）
- [ ] 右键菜单（集合/请求）
- [ ] 点击请求加载到编辑器

---

### Phase 5: RequestView.tsx（522行 → ~100行主 + 6个子文件）

```
components/views/
├── RequestView.tsx            (原路径，~100行)
└── request/
    ├── UrlBar.tsx             (~60行)
    ├── RequestToolbar.tsx     (~80行)
    ├── RequestTabs.tsx        (~70行)
    ├── CurlImportPanel.tsx    (~50行)
    ├── ResponsePlaceholder.tsx(~40行)
    └── RequestLayout.tsx      (~100行)
```

**验证清单**：
- [ ] URL栏：方法选择器 + 颜色 + URL输入 + 发送/取消 + 信号动画
- [ ] 工具栏：模板下拉 + curl导入 + 代码生成
- [ ] Tab栏：脚本Tab + 主Tab + 动态指示器 + Badge
- [ ] 分栏布局：左右拖动 + 上下拖动 + 双击还原 + localStorage持久化
- [ ] 请求切换动画
- [ ] 空响应占位 + Ctrl+Enter快捷键

---

### Phase 6: WorkflowView.tsx（869行 → ~120行主 + 7个子文件）

**最复杂**：ReactFlow hooks（useNodesState/useEdgesState）必须在顶层调用。

```
components/views/
├── WorkflowView.tsx           (原路径，~120行，管理 nodes/edges 状态)
└── workflow-editor/
    ├── WorkflowToolbar.tsx    (~50行)
    ├── NodePalette.tsx        (~60行)
    ├── SavedWorkflowsPanel.tsx(~80行)
    ├── SaveWorkflowDialog.tsx (~50行)
    ├── WorkflowCanvas.tsx     (~120行)
    ├── EmptyCanvasGuide.tsx   (~60行)
    └── WorkflowUtils.ts       (~30行，TEMPLATES + AnimatedEdge)
```

**验证清单**：
- [ ] 工具栏：节点计数 + 工作流名称 + New/Save/SaveAs/Run/Stop
- [ ] Run 按钮 RocketIcon 动画
- [ ] 节点面板：5种节点 + 拖拽/点击添加
- [ ] 已保存列表：加载/删除 + 脏状态确认
- [ ] 保存对话框：名称 + 描述 + Enter确认
- [ ] ReactFlow 画布：拖放/连线/选中/Controls/MiniMap
- [ ] 空画布引导 + 3种模板
- [ ] 键盘：Delete删除/Ctrl+S保存/Escape取消
- [ ] 执行：validateWorkflow + executeWorkflow + execStatus + activeEdges + AbortController
- [ ] 日志面板：展开/折叠 + 高度拖动
- [ ] 脏状态标记

---

### Phase 7: RemoteToolsView.tsx（1129行 → ~150行主 + 6个子文件 + 1工具文件）

**最大文件**：6个已有 memo 子组件 + 6个工具函数 + 主组件。

```
components/views/
├── RemoteToolsView.tsx        (原路径，~150行)
└── remote-tools/
    ├── DraggablePanel.tsx     (~70行，从原文件抽出)
    ├── ResizeHandle.tsx       (~15行)
    ├── TabGroupRenderer.tsx   (~60行)
    ├── DraggableTab.tsx       (~50行)
    ├── LayoutNodeRenderer.tsx (~55行)
    ├── DefaultTerminalStyleButton.tsx (~30行)
    ├── DragOverlayPreview.tsx (~80行，从主组件的DragOverlay内容抽出)
    ├── EmptyRemoteTools.tsx   (~35行，空状态卡片)
    └── dndUtils.ts            (~130行，6个工具函数)
```

**验证清单**：
- [ ] 空状态：SSH Terminal + Web Browser 卡片 + 快捷键
- [ ] 工具栏：Add Panel + 面板计数 + Undo/Redo + Reset + Terminal Style
- [ ] DnD：拖拽面板 + 拖拽Tab + 碰撞检测 + 区域计算
- [ ] 拖拽预览：分栏预览 + Tab预览 + 简单预览
- [ ] 面板调整大小手柄
- [ ] 键盘：Ctrl+Z/Y(undo/redo) + Ctrl+Tab(切换面板) + Ctrl+W(关闭) + Ctrl+Shift+N/B(添加)
- [ ] SSH关闭确认对话框
- [ ] 面板焦点管理

---

## 五、性能优化措施

### 5.1 React 优化
- 所有拆出的子组件用 `React.memo` 包裹
- `useMemo` 缓存计算值（visibleCols、gtc、filteredData 等）
- `useCallback` 稳定事件回调
- 避免内联对象/数组作为 props

### 5.2 渲染优化
- DataTable 行组件添加 `React.memo`（DataTableRow.tsx 当前未使用）
- JsonHighlighter 已使用虚拟列表 ✅
- SshTerminal 已使用虚拟列表 ✅

### 5.3 增强 PerformanceProfiler

在 `performanceProfiler.ts` 中新增：

```typescript
class ComponentRenderTracker {
  private renderTimes = new Map<string, number[]>()
  
  trackRender(name: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      const times = this.renderTimes.get(name) ?? []
      times.push(duration)
      this.renderTimes.set(name, times)
    }
  }
  
  getStats(): { name: string; count: number; avgMs: number; maxMs: number }[] {
    return Array.from(this.renderTimes.entries()).map(([name, times]) => ({
      name,
      count: times.length,
      avgMs: times.reduce((a, b) => a + b, 0) / times.length,
      maxMs: Math.max(...times),
    }))
  }
}
```

---

## 六、实施顺序

| Phase | 内容 | 新建文件 | 修改文件 | 风险 |
|-------|------|---------|---------|------|
| **0** | 打包优化（懒加载+分块+字体） | 0 | App.tsx + vite.config.ts | ⚠️ 中 |
| **1** | ResponsePanel 拆分 | 4 | ResponsePanel.tsx | ✅ 低 |
| **2** | PanelContainer 拆分 | 4 | PanelContainer.tsx | ✅ 低 |
| **3** | DataTable 拆分 | 4 | DataTable.tsx | ✅ 低 |
| **4** | SidebarCollections 拆分 | 3 | SidebarCollections.tsx | ⚠️ 中 |
| **5** | RequestView 拆分 | 6 | RequestView.tsx | ⚠️ 中 |
| **6** | WorkflowView 拆分 | 7+1 | WorkflowView.tsx | 🔴 高 |
| **7** | RemoteToolsView 拆分 | 8+1 | RemoteToolsView.tsx | 🔴 高 |
| **8** | 性能测量 + React.memo 补全 | 1 | performanceProfiler.ts + 各组件 | ✅ 低 |
| **9** | 最终构建验证 | 0 | 0 | ✅ 低 |

---

## 七、验收标准

- [ ] `tsc --noEmit` 零错误
- [ ] `vite build` 成功，无 chunk 大小警告
- [ ] main.js < 500 kB（当前 2,778 kB）
- [ ] 所有拆分后文件 ≤ 200 行
- [ ] App.tsx / Sidebar.tsx 仅允许懒加载改造的改动
- [ ] 所有子组件使用 React.memo
- [ ] 每个 Phase 通过对应的验证清单
- [ ] 性能对比报告（首次渲染时间、重渲染次数、FPS）
- [ ] `npm run build` 完整构建成功（含 electron）
