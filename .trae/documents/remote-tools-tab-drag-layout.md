# Remote Tools Tab 拖动布局实现计划

## 一、需求分析

### 当前状态
- 现有拖拽系统基于 `@dnd-kit/core`，仅支持**独立面板(PanelNode)**之间的拖拽
- `TabGroupRenderer` 渲染了标签组，但**标签本身不可拖拽**
- `computeZone()` 只检测 top/bottom/left/right 四个边缘区域，中心区域为"死区"（无操作）
- `movePanelInTree()` 只处理面板到面板的移动（创建分割布局），不支持"合并到标签组"操作
- TabGroup 内的面板不使用 `DraggablePanel` 包裹，无法作为拖拽源

### 目标效果
实现类似 VS Code 的标签拖拽体验：
1. **标签可拖拽**：TabGroup 中的每个 tab 可独立拖拽
2. **拖到另一个 TabGroup 的标签栏** → 作为新 tab 插入
3. **拖到面板的边缘区域** → 创建分割布局（已有功能，需兼容）
4. **拖到 TabGroup 内容区中心** → 合并为 tab
5. **同组内 tab 重排序** → 拖拽 tab 在同组内调整顺序
6. **拖出 TabGroup 到空白区域** → 从标签组中拆出为独立面板
7. **智能布局检测** → 根据鼠标位置自动判断最佳放置方式
8. **视觉反馈** → 拖拽过程中显示清晰的放置指示器

---

## 二、技术方案

### 核心思路
扩展现有 `@dnd-kit` 拖拽系统，增加以下能力：
- Tab 作为新的拖拽源（draggable）
- TabGroup 作为新的放置目标（droppable），支持多种放置模式
- 新增 `DropZone` 类型：`'center'`（合并为 tab）
- 新增 Store 操作：`movePanelToTabGroup`、`reorderTabsInGroup`

### DropZone 扩展

```
现有: 'top' | 'bottom' | 'left' | 'right'
新增: 'center' (合并到标签组) | 'tab-before' | 'tab-after' (标签栏插入位置)
```

### 拖拽区域检测逻辑

当拖拽到 TabGroup 上方时：
1. **鼠标在标签栏区域** → 检测具体在哪个 tab 旁边，返回 `'tab-before'` 或 `'tab-after'`
2. **鼠标在内容区边缘** → 返回 `'top'/'bottom'/'left'/'right'`（创建分割）
3. **鼠标在内容区中心** → 返回 `'center'`（合并为 tab）

当拖拽到独立面板上方时：
1. **边缘区域** → 返回 `'top'/'bottom'/'left'/'right'`（创建分割，已有）
2. **中心区域** → 返回 `'center'`（将两个面板合并为 TabGroup）

---

## 三、分步实现计划

### 第 1 步：扩展 DropZone 类型和 Store 数据结构

**文件**: `src/stores/useRemoteToolsStore.ts`

1. 扩展 `DropZone` 类型：
   ```typescript
   export type DropZone = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'tab-before' | 'tab-after'
   ```

2. 新增 `DropZoneInfo` 扩展字段（用于 tab 插入位置）：
   ```typescript
   interface DropZoneInfo {
     overId: string
     zone: DropZone
     tabInsertIndex?: number  // tab-before/tab-after 时使用
   }
   ```

3. 新增 Store 方法：
   - `movePanelToTabGroup(activeId, tabGroupId, insertIndex)` — 将面板移入标签组
   - `reorderTabsInGroup(tabGroupId, fromIndex, toIndex)` — 标签组内重排序

**核验点**：
- [ ] DropZone 类型扩展后，现有代码无类型错误
- [ ] `movePanelToTabGroup` 正确处理：从原位置移除 → 插入到目标标签组 → 清理空节点
- [ ] `reorderTabsInGroup` 正确处理：同组内 tab 顺序调整
- [ ] 深度限制仍然有效（MAX_LAYOUT_DEPTH）
- [ ] 面板数量限制仍然有效（MAX_PANELS）
- [ ] Undo/Redo 对新操作生效

---

### 第 2 步：实现 `movePanelToTabGroup` 和 `reorderTabsInGroup`

**文件**: `src/stores/useRemoteToolsStore.ts`

#### `movePanelInTree` 扩展

在现有 `movePanelInTree` 函数基础上，增加对 `center`、`tab-before`、`tab-after` zone 的处理：

- **`center` zone**：将 activePanel 和 overPanel 合并为一个新的 TabGroupNode
  - 如果 overNode 已经是 TabGroup 的子面板，则将 activePanel 加入该 TabGroup
  - 如果 overNode 是独立面板，创建新 TabGroup 包含两者

- **`tab-before` / `tab-after` zone**：将 activePanel 插入到目标 TabGroup 的指定位置
  - 找到 overNode 所属的 TabGroup
  - 在 overNode 之前/之后插入 activePanel

#### `reorderTabsInGroup` 实现

- 找到 TabGroup 节点
- 交换 children 数组中 fromIndex 和 toIndex 的位置
- 更新 activeTabId（如果活动 tab 被移动则跟踪）

**核验点**：
- [ ] 面板从 TabGroup 拖出后，原 TabGroup 如果只剩 1 个子面板，自动降级为普通面板
- [ ] 面板从 TabGroup 拖出后，原 TabGroup 如果没有子面板，自动移除
- [ ] 合并两个独立面板为 TabGroup 时，activeTabId 正确设置
- [ ] 插入 tab 到指定位置时，insertIndex 计算正确
- [ ] 同组重排序时，activeTabId 跟踪正确
- [ ] 所有操作后布局树仍然合法（无空 split/tabgroup）
- [ ] 持久化正常工作

---

### 第 3 步：让 Tab 可拖拽

**文件**: `src/components/views/RemoteToolsView.tsx`

修改 `TabGroupRenderer` 组件：

1. 每个 tab 按钮添加 `useDraggable` hook：
   ```tsx
   const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
     id: child.id,
     data: { type: 'tab', panel: child, tabGroupId: node.id },
   })
   ```

2. 拖拽中的 tab 显示为半透明状态

3. Tab 的拖拽激活约束：距离 5px（比面板拖拽的 8px 更小，因为 tab 更小更灵敏）

**核验点**：
- [ ] Tab 可以被拖拽启动
- [ ] 拖拽中 tab 显示半透明
- [ ] 拖拽不影响 tab 的点击切换功能
- [ ] Tab 关闭按钮仍然可用
- [ ] 拖拽启动后，DragOverlay 显示正确的预览

---

### 第 4 步：让 TabGroup 成为放置目标

**文件**: `src/components/views/RemoteToolsView.tsx`

修改 `TabGroupRenderer` 组件：

1. TabGroup 容器添加 `useDroppable` hook：
   ```tsx
   const { setNodeRef } = useDroppable({
     id: `tabgroup-${node.id}`,
     data: { type: 'tabgroup', node },
   })
   ```

2. TabGroup 内的每个 tab 也作为 droppable（用于 tab-before/tab-after 检测）

**核验点**：
- [ ] TabGroup 容器可以被检测为放置目标
- [ ] 碰撞检测正确识别 TabGroup
- [ ] 不影响现有面板的拖放功能

---

### 第 5 步：增强区域检测逻辑

**文件**: `src/components/views/RemoteToolsView.tsx`

1. 修改 `computeZone` 函数，增加对 TabGroup 的特殊处理：

   ```typescript
   function computeZoneForTabGroup(
     pointerPos: { x: number; y: number },
     tabGroupEl: HTMLElement,
     tabGroupNode: TabGroupNode
   ): DropZoneInfo | null
   ```

   - 获取标签栏 DOM 元素（`.layout-tabgroup-tabs`）
   - 判断鼠标是否在标签栏区域内
   - 如果在标签栏：计算鼠标在哪个 tab 旁边，返回 `tab-before` 或 `tab-after`
   - 如果在内容区：使用原有的边缘/中心检测逻辑

2. 修改 `customCollisionDetection`，使其能识别 TabGroup 类型的 droppable

3. 修改 `updateDropZoneFromEvent`，集成新的区域检测逻辑

**核验点**：
- [ ] 鼠标在标签栏时，正确检测 tab-before/tab-after
- [ ] 鼠标在内容区边缘时，正确检测 top/bottom/left/right
- [ ] 鼠标在内容区中心时，正确检测 center
- [ ] 拖拽到独立面板中心时，正确检测 center（合并为 tabgroup）
- [ ] 区域切换时无闪烁
- [ ] 死区阈值合理

---

### 第 6 步：实现视觉反馈

**文件**: `src/components/views/RemoteToolsView.tsx` + `src/components/remote-tools/remote-tools-view.css`

#### 6a. Tab 插入指示器
- 在 tab 之间显示竖线指示器，表示 tab 将插入的位置
- CSS 类：`.drop-indicator-tab-before` / `.drop-indicator-tab-after`

#### 6b. Center 合并指示器
- 在 TabGroup/面板内容区显示半透明高亮覆盖层
- CSS 类：`.drop-indicator-center`

#### 6c. DragOverlay 增强
- 拖拽到 tab 插入位置时 → 显示 tab 预览（小标签样式）
- 拖拽到 center 时 → 显示"合并为标签组"预览
- 保留现有的分割预览

**核验点**：
- [ ] Tab 插入指示器位置准确（在两个 tab 之间）
- [ ] Center 指示器不遮挡内容区交互
- [ ] DragOverlay 预览清晰表达操作意图
- [ ] 指示器切换流畅无闪烁
- [ ] 不同 zone 的指示器样式区分明显

---

### 第 7 步：实现拖拽结束处理

**文件**: `src/components/views/RemoteToolsView.tsx`

修改 `handleDragEnd`：

1. 根据 `dropZoneInfo.zone` 分发到不同处理逻辑：
   - `'top'/'bottom'/'left'/'right'` → 调用现有 `movePanelToZone`
   - `'center'` → 调用 `movePanelToTabGroup`
   - `'tab-before'/'tab-after'` → 调用 `movePanelToTabGroup`（带 insertIndex）

2. 特殊情况处理：
   - 拖拽到自身所在的 TabGroup → 调用 `reorderTabsInGroup`
   - 拖拽到空白区域 → 取消操作（或未来可支持"浮动窗口"）

**核验点**：
- [ ] 各 zone 类型正确路由到对应处理函数
- [ ] 同组内重排序正确处理
- [ ] 跨组移动正确处理（从 TabGroup A 拖到 TabGroup B）
- [ ] 从 TabGroup 拖出到独立位置正确处理
- [ ] 独立面板拖到另一独立面板 center 正确创建 TabGroup
- [ ] 拖拽取消时状态正确清理
- [ ] 操作后 focusedPanelId 状态正确

---

### 第 8 步：集成测试与边界情况处理

全面测试以下场景：

#### 基本场景
- [ ] Tab 在同组内拖拽重排序
- [ ] Tab 从一个 TabGroup 拖到另一个 TabGroup
- [ ] 独立面板拖到 TabGroup 标签栏 → 成为新 tab
- [ ] 独立面板拖到 TabGroup 内容区 → 成为新 tab
- [ ] Tab 拖到独立面板边缘 → 创建分割
- [ ] 两个独立面板拖到中心 → 合并为 TabGroup
- [ ] Tab 从 TabGroup 拖出到边缘 → 成为独立分割面板

#### 边界情况
- [ ] TabGroup 只剩 1 个 tab 时拖出 → TabGroup 降级为普通面板
- [ ] TabGroup 最后一个 tab 被拖走 → 清理空 TabGroup
- [ ] 拖拽到自身位置 → 无操作
- [ ] 达到最大面板数(8)时禁止添加
- [ ] 达到最大深度(4)时禁止创建更深的分割
- [ ] 快速拖拽/取消不导致状态异常
- [ ] Undo/Redo 对所有新操作生效
- [ ] 布局持久化后重新加载，状态正确

#### 视觉反馈
- [ ] 所有拖拽场景的指示器显示正确
- [ ] 指示器切换流畅
- [ ] DragOverlay 预览内容准确

---

## 四、文件修改清单

| 文件 | 修改内容 |
|---|---|
| `src/stores/useRemoteToolsStore.ts` | 扩展 DropZone 类型、新增 movePanelToTabGroup/reorderTabsInGroup、修改 movePanelInTree |
| `src/components/views/RemoteToolsView.tsx` | Tab 可拖拽、TabGroup 可放置、增强区域检测、视觉反馈、拖拽结束处理 |
| `src/components/remote-tools/remote-tools-view.css` | 新增 tab 插入指示器样式、center 指示器样式、tab 拖拽状态样式 |

---

## 五、实施原则

1. **步步为营**：每完成一步都进行充分核验，确认无误后再进行下一步
2. **向后兼容**：所有现有功能（面板拖拽、分割、resize、undo/redo）不能受影响
3. **最小改动**：尽量复用现有代码和模式，不过度重构
4. **类型安全**：所有新增代码都有完整的 TypeScript 类型定义
5. **性能优先**：拖拽过程中的区域检测和视觉反馈不能导致明显卡顿
