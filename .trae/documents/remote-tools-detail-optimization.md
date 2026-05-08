# Remote Tools 细节优化修复计划

## 问题清单

### 问题 A：Popover 透明背景
- `.popover` 容器没有 `background`/`border`/`box-shadow`
- `.ssh-config-popover` 缺少 `background`/`border`/`border-radius`/`box-shadow`
- `.panel-add-menu` 缺少 `background`/`border`/`border-radius`/`box-shadow`
- immersive 模式下 `.popover` 缺少毛玻璃样式

### 问题 B：拖拽布局严重抖动
根因链：
1. `handleDragOver` 不做去重 → 每次鼠标移动都触发 `setDropZoneInfo` → 整棵树重渲染
2. `previewDirectionOverride` 在拖拽时切换 `flexDirection` → 子元素布局完全重排
3. `normalizeSizes` 每次调用都创建新对象且浮点精度差异 → 不必要的 DOM 更新
4. `movePanelInTree` 的 remove → insert → cleanEmptySplits 三轮 normalizeSizes → size 值反复重算
5. 组件缺少 `React.memo` → 无关 props 变化也触发重渲染

---

## 分步修复计划

### 第 1 步：修复 Popover 透明背景

**文件**: `src/components/common/popover.css`, `src/components/remote-tools/remote-tools-view.css`

1. 给 `.popover` 添加默认背景样式：
   ```css
   .popover {
     z-index: 9998;
     pointer-events: auto;
     background: var(--bg-panel);
     border: 1px solid var(--border-color);
     border-radius: var(--radius-md);
     box-shadow: var(--shadow-lg);
   }
   ```

2. 给 `.ssh-config-popover` 补充背景样式（移除 popover 上的重复样式）：
   ```css
   .ssh-config-popover {
     display: flex;
     flex-direction: column;
     gap: 8px;
     padding: 12px;
     min-width: 320px;
   }
   ```
   （背景由 `.popover` 统一提供，不需要单独设置）

3. 给 `.panel-add-menu` 补充背景样式（同上，由 `.popover` 统一提供）

4. 添加 immersive 模式下 `.popover` 的毛玻璃样式：
   ```css
   [data-visual-style="immersive"] .popover {
     background: var(--glass-bg);
     border-color: var(--glass-border);
     -webkit-backdrop-filter: blur(var(--glass-blur-md)) var(--glass-saturate);
     backdrop-filter: blur(var(--glass-blur-md)) var(--glass-saturate);
     box-shadow: var(--glass-elevation-2);
   }
   ```

**核验点**：
- [ ] Classic 模式下 SSH 配置弹出框有正常背景
- [ ] Classic 模式下添加面板下拉菜单有正常背景
- [ ] Immersive 模式下弹出框有毛玻璃效果
- [ ] 工具栏的外观设置下拉菜单不受影响（`.tb-settings-dropdown` 有自己的背景，会覆盖 `.popover` 的背景）
- [ ] 弹出框动画不受影响

---

### 第 2 步：修复 handleDragOver 不去重导致的过度渲染

**文件**: `src/components/views/RemoteToolsView.tsx`

1. 将 `handleDragOver` 中的 `allowClearRef` 改为 `true`，启用去重逻辑：
   ```tsx
   const handleDragOver = useCallback((event: DragOverEvent) => {
     updateDropZoneFromEvent(event, pointerPosRef.current, setDropZoneInfo, setDeadZoneOverId, dropZoneInfoRef, true)
   }, [])
   ```

2. 在 `updateDropZoneFromEvent` 中，对 `setDeadZoneOverId` 也添加去重：
   ```tsx
   // 之前：setDeadZoneOverId(null)
   // 之后：只在值变化时设置
   setDeadZoneOverId((prev) => prev === null ? prev : null)
   ```
   实际上更简洁的方式是只在需要时调用：
   ```tsx
   if (deadZoneOverId !== null) setDeadZoneOverId(null)
   ```
   但 `deadZoneOverId` 不在函数参数中，需要通过 ref 追踪。添加 `deadZoneOverIdRef`。

3. 移除 `handleDragOver` 和 `handleDragMove` 的双重触发问题。由于 `@dnd-kit` 的 `onDragOver` 在 over 目标变化时触发，`onDragMove` 在每次鼠标移动时触发，两者都会更新 `dropZoneInfo`。考虑只保留 `onDragMove`，因为它的触发频率更高，且已经做了去重。

**核验点**：
- [ ] 拖拽过程中 `setDropZoneInfo` 只在值真正变化时触发
- [ ] `setDeadZoneOverId` 只在值变化时触发
- [ ] 拖拽功能正常工作

---

### 第 3 步：修复 previewDirectionOverride 导致的 flexDirection 切换抖动

**文件**: `src/components/views/RemoteToolsView.tsx`

问题分析：当拖拽面板到另一个面板的边缘时，`previewDirectionOverride` 会实时改变 split 节点的 `flexDirection`，导致子元素在 row/column 之间瞬间切换，造成严重抖动。

修复方案：**移除 previewDirectionOverride 机制**。拖拽预览应该只通过 drop indicator 和 DragOverlay 来表达，不应该改变实际布局的方向。用户释放鼠标后，`movePanelInTree` 会创建正确方向的 split。

1. 移除 `previewDirectionOverride` 的计算逻辑
2. 移除 `LayoutNodeRenderer` 中对 `previewDirectionOverride` 的使用
3. 移除 `previewDirectionOverride` prop 的传递

**核验点**：
- [ ] 拖拽过程中不再有 flexDirection 切换
- [ ] drop indicator 仍然正常显示
- [ ] DragOverlay 预览仍然正常显示
- [ ] 释放鼠标后布局正确创建

---

### 第 4 步：修复 normalizeSizes 的浮点精度问题

**文件**: `src/stores/useRemoteToolsStore.ts`

1. 修改 `normalizeSizes`，只在 size 值实际变化时才创建新对象：
   ```typescript
   function normalizeSizes(nodes: LayoutNode[]): LayoutNode[] {
     const totalSize = nodes.reduce((sum, n) => sum + n.size, 0)
     if (totalSize <= 0) return nodes.map((n) => ({ ...n, size: 1 / nodes.length }))
     return nodes.map((n, i) => {
       const newSize = n.size / totalSize
       if (Math.abs(newSize - n.size) < 1e-10) return nodes[i]  // 保持引用
       return { ...n, size: newSize }
     })
   }
   ```

2. 同样修改 `normalizePanelSizes`（如果存在类似问题）

**核验点**：
- [ ] size 值没有浮点精度差异
- [ ] 相同 size 的节点保持引用相等
- [ ] 布局渲染结果不变

---

### 第 5 步：优化 movePanelInTree 的 size 保持

**文件**: `src/stores/useRemoteToolsStore.ts`

问题：`movePanelInTree` 在 remove → insert → cleanEmptySplits 过程中三轮 normalizeSizes，导致 size 值反复重算，最终结果可能与原始值差异很大。

修复方案：

1. 在 `movePanelInTree` 中，当面板插入到已有的 split 中时，保持原有子节点的 size 比例不变，只将新面板设为较小比例（如 0.25），然后重新归一化：
   ```typescript
   // 插入时：新面板占 0.25，原有面板按比例缩小到 0.75
   const existingTotal = existingChildren.reduce((s, c) => s + c.size, 0)
   const newChildren = existingChildren.map(c => ({
     ...c,
     size: c.size * 0.75 / existingTotal
   }))
   newChildren.splice(insertIndex, 0, { ...activeNodeCopy, size: 0.25 })
   ```

2. 在创建新 split 时，使用 overNode 的原始 size 来分配，而不是强制 0.5/0.5：
   ```typescript
   const newSplit: SplitNode = {
     id: generateId('split'),
     type: 'split',
     direction: targetDirection,
     children: insertBefore
       ? [{ ...activeNodeCopy, size: 0.5 }, { ...overNodeAfterRemove, size: 0.5 }]
       : [{ ...overNodeAfterRemove, size: 0.5 }, { ...activeNodeCopy, size: 0.5 }],
     size: overNodeAfterRemove.size,  // 保持原始 size
   }
   ```

**核验点**：
- [ ] 移动面板后，未被影响的面板 size 保持不变
- [ ] 新创建的 split 合理分配空间
- [ ] cleanEmptySplits 后 size 比例合理

---

### 第 6 步：为关键组件添加 React.memo

**文件**: `src/components/views/RemoteToolsView.tsx`

1. 用 `React.memo` 包裹 `DraggablePanel`：
   ```tsx
   const DraggablePanel = React.memo(function DraggablePanel(...) { ... })
   ```

2. 用 `React.memo` 包裹 `TabGroupRenderer`：
   ```tsx
   const TabGroupRenderer = React.memo(function TabGroupRenderer(...) { ... })
   ```

3. 用 `React.memo` 包裹 `DraggableTab`：
   ```tsx
   const DraggableTab = React.memo(function DraggableTab(...) { ... })
   ```

4. 用 `React.memo` 包裹 `LayoutNodeRenderer`：
   ```tsx
   const LayoutNodeRenderer = React.memo(function LayoutNodeRenderer(...) { ... })
   ```

**核验点**：
- [ ] 拖拽过程中，未受影响的面板不重渲染
- [ ] 所有拖拽功能正常工作
- [ ] 点击、关闭、最大化等操作不受影响

---

## 文件修改清单

| 文件 | 修改内容 |
|---|---|
| `src/components/common/popover.css` | 添加 `.popover` 默认背景/border/shadow + immersive 毛玻璃 |
| `src/components/remote-tools/remote-tools-view.css` | 确认 `.ssh-config-popover` 和 `.panel-add-menu` 背景由 `.popover` 提供 |
| `src/components/views/RemoteToolsView.tsx` | 修复 handleDragOver 去重、移除 previewDirectionOverride、添加 React.memo |
| `src/stores/useRemoteToolsStore.ts` | 修复 normalizeSizes 浮点精度、优化 movePanelInTree size 保持 |

---

## 实施原则

1. **每步严格核验**：完成一步后立即验证，确认无副作用再继续
2. **最小改动**：每步只修改必要的代码
3. **向后兼容**：不改变现有 API 和数据结构
4. **性能优先**：减少不必要的重渲染和 DOM 更新
