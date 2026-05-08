# Remote Tools 拖拽布局功能 — 完整性与可用性审查计划

## 审查范围

对 Remote Tools 面板拖拽布局系统进行全面审查，涵盖：
- `useRemoteToolsStore.ts` — 树形布局数据模型与操作
- `RemoteToolsView.tsx` — 拖拽交互与渲染
- `remote-tools-view.css` — 布局与交互样式
- `PanelContainer.tsx` — 面板容器组件

---

## 一、完整性审查 — 发现的问题

### 🔴 严重（影响核心功能）

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| C1 | `addPanel` 重置所有面板 size=1，破坏用户手动调整的比例 | Store:399 | 用户手动调整 A=70% B=30% 后，添加 C 会变成各 33%，丢失自定义比例 |
| C2 | `movePanelInTree` 不校验 overId 是否为 PanelNode | Store:163-226 | 如果 overId 指向 SplitNode，`findParentAndIndex` 会找到它但行为未定义，可能导致布局损坏 |
| C3 | `closestCorners` 碰撞检测在嵌套布局中失效 | View:412 | 当面板在不同层级的 split 中时（如 A 在 row split，B 在 column split 内），碰撞检测可能错误识别目标面板 |
| C4 | 删除最后一个面板后 root 变成空 SplitNode | Store:422-437 | `removePanel` → `cleanEmptySplits` 可能返回 `{ type: 'split', children: [] }`，导致渲染空白而非空状态页面 |
| C5 | `resizeNode` 中 `findParentAndIndex` 搜索旧树后引用可能失效 | Store:450-475 | `parentInfo.parent` 是旧树中的对象引用，但 `updateNodeInTree` 通过 id 匹配更新，功能正确但存在潜在一致性风险 |

### 🟡 中等（影响部分场景）

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| C6 | `addPanel` 只能添加到根 split 末尾 | Store:398-404 | 无法在特定位置插入面板，新增面板总是在最右边/最下边 |
| C7 | 单面板时拖拽无 over 目标 | View:410-418 | 只有1个面板时，拖拽是空操作，用户可能困惑为什么拖不动 |
| C8 | 死区阈值 0.2 过大 | View:166 | 中心 40% 区域是死区，小面板几乎无法触发方向分割 |
| C9 | 无布局重置功能 | — | 布局损坏后用户只能手动清 localStorage |
| C10 | `isValidLayoutNode` 不递归校验子节点 | Store:257-267 | 只校验根节点类型，不校验 children 内部结构，损坏的子节点可能通过校验 |

---

## 二、可用性审查 — 发现的问题

### 🔴 严重（影响用户体验）

| # | 问题 | 说明 |
|---|------|------|
| U1 | 拖拽时无布局方向实时预览 | 拖到面板边缘时，容器不会实时切换 flexDirection，用户看不到垂直/水平排列效果。之前用 `previewIsRow` 实现过，但重构为树形模型后丢失 |
| U2 | 面板大小调整无视觉反馈 | 拖动 resize handle 时没有实时比例显示，用户不知道当前比例 |
| U3 | 拖拽预览不显示其他面板上下文 | DragOverlay 只显示拖拽面板和目标面板，不显示其他面板的位置，用户无法预判最终布局 |

### 🟡 中等

| # | 问题 | 说明 |
|---|------|------|
| U4 | 无键盘辅助操作 | 无法通过键盘移动面板，不符合无障碍标准 |
| U5 | 面板最大化后仍可拖拽 | 最大化面板的 drag handle 仍然活跃，可能导致意外拖拽 |
| U6 | 无布局变更动画 | 面板添加/删除/重排时布局瞬间变化，无过渡动画 |
| U7 | 面板数量无指示 | 用户不知道当前有几个面板、上限是多少 |

### 🟢 低

| # | 问题 | 说明 |
|---|------|------|
| U8 | DragOverlay 固定 200px 宽 | 不随面板内容宽度自适应 |
| U9 | Drop indicator 4px 内缩 | 指示线与面板边缘有 4px 间隙，视觉上可能不连贯 |
| U10 | 无双击最大化/还原 | PanelContainer 不支持双击标题栏最大化 |

---

## 三、修复计划

按优先级排序，仅修复严重和中等问题，低优先级问题记录但不修复。

### 步骤 1：修复 C4 — 删除最后一个面板后 root 变空 SplitNode

**文件**: `useRemoteToolsStore.ts`
**方案**: 在 `removePanel` 中，`cleanEmptySplits` 后检查 root 是否为空 split，如果是则返回空 split（View 层已有 `allPanels.length === 0` 的空状态渲染）

### 步骤 2：修复 C1 — addPanel 保留用户手动调整的比例

**文件**: `useRemoteToolsStore.ts`
**方案**: 新增面板时，从现有面板各取 1/N 的空间给新面板（N 为新面板总数），而非重置所有为 1。例如 2 个面板 [0.7, 0.3] 添加第 3 个：各取 1/3 → [0.7×2/3, 0.3×2/3, 1/3] = [0.467, 0.2, 0.333]

### 步骤 3：修复 C2 — movePanelInTree 校验 overId 类型

**文件**: `useRemoteToolsStore.ts`
**方案**: 在 `movePanelInTree` 开头校验 `overId` 对应的节点必须是 PanelNode，如果是 SplitNode 则 return root

### 步骤 4：修复 C3 — 碰撞检测适配嵌套布局

**文件**: `RemoteToolsView.tsx`
**方案**: 将 `closestCorners` 替换为自定义碰撞检测函数，优先选择距离鼠标最近的面板（而非最近的容器角点），确保嵌套布局中内层面板优先被选中

### 步骤 5：修复 C8 — 死区阈值动态调整

**文件**: `RemoteToolsView.tsx`
**方案**: 将死区阈值从固定 0.2 改为 `Math.min(0.2, 30 / Math.min(overRect.width, overRect.height))`，小面板时缩小死区

### 步骤 6：修复 C10 — isValidLayoutNode 递归校验

**文件**: `useRemoteToolsStore.ts`
**方案**: 对 SplitNode 递归校验每个 child，确保整棵树结构完整

### 步骤 7：修复 U1 — 拖拽时实时布局方向预览

**文件**: `RemoteToolsView.tsx`
**方案**: 恢复 `previewIsRow` 机制——当检测到 Drop Zone 时，临时修改目标面板所在 split 的 direction，实现实时预览

### 步骤 8：修复 U5 — 最大化面板禁用拖拽

**文件**: `PanelContainer.tsx`, `RemoteToolsView.tsx`
**方案**: 最大化时不传递 `dragHandleProps`，或传递 `disabled: true` 给 `useDraggable`

### 步骤 9：修复 C7 + U7 — 单面板拖拽提示 + 面板计数

**文件**: `RemoteToolsView.tsx`
**方案**: 单面板拖拽时 DragOverlay 显示提示"拖到另一个面板边缘以创建分割布局"；工具栏显示面板计数 "3/8"

### 步骤 10：修复 C9 — 添加布局重置按钮

**文件**: `RemoteToolsView.tsx`, `useRemoteToolsStore.ts`
**方案**: Store 添加 `resetLayout` action，View 工具栏添加重置按钮

---

## 四、不修复的问题（记录）

| # | 原因 |
|---|------|
| C5 | 功能正确，仅存在理论上的引用一致性风险，实际不会触发 |
| C6 | 添加到根 split 是合理默认行为，后续可扩展 |
| U2 | 需要额外的 UI 组件，当前优先级不足 |
| U3 | DragOverlay 空间有限，显示过多信息会混乱 |
| U4 | 键盘 DnD 实现复杂度高，优先级不足 |
| U6 | 布局变更动画需要 FLIP 技术，实现复杂 |
| U8-U10 | 影响极小 |

---

## 五、验证标准

1. **TypeScript 编译通过** — `npx tsc --noEmit` 无新增错误
2. **功能验证** — 以下场景全部通过：
   - 添加 1-8 个面板，尺寸均分
   - 删除面板后布局正确清理
   - 删除最后一个面板显示空状态
   - 拖拽到边缘创建垂直/水平分割
   - 拖拽到死区无操作
   - 嵌套布局中拖拽正确识别目标
   - 面板大小调整保留比例
   - 最大化面板不可拖拽
   - 布局重置功能正常
3. **第三方评审** — 从功能性、一致性、可用性、易用性四维度评审通过
