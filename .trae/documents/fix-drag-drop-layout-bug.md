# Remote Tools 拖拽布局 Bug 修复计划

## 问题分析

用户反馈：拖动任意组件面板（如 SSH 或浏览器）到任意 SSH 或浏览器组件上时，无法进行垂直或者水平布局。

经过对代码的深入审查，发现以下根因：

### 根因 1：`computeZone` 中心区域阈值过大

**文件**: [RemoteToolsView.tsx:230-244](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L230-L244)

```typescript
const threshold = Math.min(0.2, 30 / Math.min(overRect.width, overRect.height))
```

**问题**：

* 当面板尺寸为 150px 时，threshold = 0.2，表示中心 40% 区域（0.2 \* 2）不会触发分割

* 当面板尺寸为 100px 时，threshold 仍为 0.2（被 Math.min 限制）

* 用户拖拽面板时，被拖拽元素的中心很容易落入目标面板的中心区域，导致 `computeZone` 返回 null

* 返回 null 后，`updateDropZoneFromEvent` 会设置 `dropZoneInfo` 为 null，`handleDragEnd` 中 `savedDropZone` 为 null，直接 return，不执行任何移动操作

### 根因 2：`updateNodeInTree` 总是创建新节点

**文件**: [useRemoteToolsStore.ts:161-168](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L161-L168)

```typescript
function updateNodeInTree(root: LayoutNode, targetId: string, updater: (node: LayoutNode) => LayoutNode): LayoutNode {
  if (root.id === targetId) return updater(root)
  if (root.type === 'panel') return root
  return {
    ...root,
    children: root.children.map((child) => updateNodeInTree(child, targetId, updater)),
  }
}
```

**问题**：

* 该函数无条件创建新节点（通过展开运算符），即使子树没有变化

* 导致引用相等性检查 `if (newRoot === state.layout.root) return state` 永远为 false

* 可能触发不必要的状态更新和重新渲染

### 根因 3：`movePanelInTree` 方向匹配时面板尺寸分配不合理

**文件**: [useRemoteToolsStore.ts:208-217](file:///d:/std/postman-app/src/stores/useRemoteToolsStore.ts#L208-L217)

```typescript
if (overParent.direction === targetDirection) {
  const insertIndex = insertBefore ? overIndex : overIndex + 1
  const newChildren = [...overParent.children]
  newChildren.splice(insertIndex, 0, { ...activeNodeCopy, size: 0 })
  const normalizedChildren = normalizeSizes(newChildren)
  // ...
}
```

**问题**：

* 插入 `size: 0` 的节点后，`normalizeSizes` 会根据总 size 重新分配

* 当已有多个子节点时，新插入的面板会分配到极小的尺寸

* 例如：3个面板（每个 0.33），插入 size:0 的面板后，normalizeSizes 会分配 0.25 给每个面板，但新面板初始为 0，可能被分配到比预期更小的尺寸

### 根因 4：`previewDirectionOverride` 未传递给 ResizeHandle

**文件**: [RemoteToolsView.tsx:179-183](file:///d:/std/postman-app/src/components/views/RemoteToolsView.tsx#L179-L183)

**问题**：

* `previewDirectionOverride` 只影响 `LayoutNodeRenderer` 中的 `flexDirection` 样式

* `ResizeHandle` 的 `isRow` prop 仍然使用 `node.direction`（第180行）

* 拖拽预览时 resize 手柄的光标方向可能与视觉布局方向不一致

## 修复方案

### 修复 1：调整 `computeZone` 阈值计算

**文件**: `src/components/views/RemoteToolsView.tsx`

将阈值计算改为：

```typescript
const minDimension = Math.min(overRect.width, overRect.height)
const threshold = Math.max(0.06, Math.min(0.12, 10 / minDimension))
```

这样：

* 面板尺寸 300px 时，threshold ≈ 0.06（中心区域 12%）

* 面板尺寸 150px 时，threshold ≈ 0.067（中心区域 13.4%）

* 面板尺寸 80px 时，threshold = 0.12（中心区域 24%）

* 面板尺寸越小，中心区域越大（防止误操作），但不超过 24%

* 面板尺寸越大，中心区域越小，更容易触发分割

### 修复 2：优化 `updateNodeInTree` 引用相等性

**文件**: `src/stores/useRemoteToolsStore.ts`

添加引用检查，只在必要时创建新节点：

```typescript
function updateNodeInTree(root: LayoutNode, targetId: string, updater: (node: LayoutNode) => LayoutNode): LayoutNode {
  if (root.id === targetId) return updater(root)
  if (root.type === 'panel') return root
  
  const newChildren = root.children.map((child) => updateNodeInTree(child, targetId, updater))
  const hasChanged = newChildren.some((child, index) => child !== root.children[index])
  
  if (!hasChanged) return root
  
  return {
    ...root,
    children: newChildren,
  }
}
```

### 修复 3：修复 `movePanelInTree` 面板尺寸分配

**文件**: `src/stores/useRemoteToolsStore.ts`

在方向匹配时，保留被拖动面板的原始尺寸，而不是分配 0：

```typescript
if (overParent.direction === targetDirection) {
  const insertIndex = insertBefore ? overIndex : overIndex + 1
  const newChildren = [...overParent.children]
  // 使用原始尺寸，normalizeSizes 会重新分配
  newChildren.splice(insertIndex, 0, { ...activeNodeCopy })
  const normalizedChildren = normalizeSizes(newChildren)
  // ...
}
```

实际上，`normalizeSizes` 会根据总 size 重新分配，所以 `size: 0` 的问题在于，它会被分配到一个极小的比例。修复方式是移除 `size: 0`，使用 `activeNodeCopy` 的原始 `size`，让 `normalizeSizes` 正常计算。

### 修复 4：传递 `previewDirectionOverride` 到 ResizeHandle

**文件**: `src/components/views/RemoteToolsView.tsx`

在 `LayoutNodeRenderer` 中，使用 `effectiveDirection` 计算 `ResizeHandle` 的 `isRow` prop：

```typescript
{index < node.children.length - 1 && (
  <ResizeHandle
    resizeChildId={child.id}
    isRow={effectiveDirection === 'row'}
    onResizeStart={onResizeStart}
  />
)}
```

这已经是正确的实现（第180行使用 `effectiveDirection`）。让我重新检查代码...

实际上，查看代码第180行：

```typescript
isRow={effectiveDirection === 'row'}
```

这是正确的。但第159行使用的是 `node.direction` 而不是 `effectiveDirection`：

```typescript
data-direction={effectiveDirection}
style={{ flexDirection: effectiveDirection }}
```

第159行是正确的，使用 `effectiveDirection`。所以这个修复可能不需要。

让我重新检查代码...

查看代码：

```typescript
return (
  <div
    className="layout-split"
    data-direction={effectiveDirection}
    style={{ flexDirection: effectiveDirection }}
  >
    {node.children.map((child, index) => (
      <Fragment key={child.id}>
        <div className="layout-split-child" style={{ flexGrow: child.size }}>
          <LayoutNodeRenderer ... />
        </div>
        {index < node.children.length - 1 && (
          <ResizeHandle
            resizeChildId={child.id}
            isRow={effectiveDirection === 'row'}
            onResizeStart={onResizeStart}
          />
        )}
      </Fragment>
    ))}
  </div>
)
```

第159行和第180行都使用了 `effectiveDirection`。所以这个修复不需要。

但让我检查一下 `previewDirectionOverride` 的计算是否正确...

```typescript
const previewDirectionOverride = dropZoneInfo ? (() => {
  const parentInfo = findParentAndIndex(layout.root, dropZoneInfo.overId)
  if (!parentInfo) return null
  const targetDirection: LayoutDirection = isVerticalPreview ? 'column' : 'row'
  if (parentInfo.parent.direction === targetDirection) return null
  return { splitId: parentInfo.parent.id, direction: targetDirection }
})() : null
```

这个逻辑是正确的：

* 如果目标父节点的方向已经和目标方向一致，不需要 override

* 否则，返回 override，强制改变方向

所以，主要的修复点是：

1. 修复 `computeZone` 阈值
2. 修复 `updateNodeInTree` 引用相等性
3. 修复 `movePanelInTree` 面板尺寸分配

## 实施步骤

### 步骤 1：修复 `computeZone` 函数

**文件**: `src/components/views/RemoteToolsView.tsx`

修改 `computeZone` 函数中的阈值计算逻辑。

### 步骤 2：修复 `updateNodeInTree` 函数

**文件**: `src/stores/useRemoteToolsStore.ts`

添加引用检查，只在必要时创建新节点。

### 步骤 3：修复 `movePanelInTree` 函数

**文件**: `src/stores/useRemoteToolsStore.ts`

移除 `size: 0` 的硬编码，使用原始尺寸。

### 步骤 4：验证修复

* 运行 lint 检查

* 运行 build

* 手动测试拖拽布局功能

## 预期效果

1. 拖拽面板到另一个面板上时，能够正确触发垂直或水平分割
2. 拖拽预览正确显示分割方向
3. 释放鼠标后，面板正确分割并调整尺寸
4. 嵌套布局中的拖拽操作正常工作
5. 不必要的重新渲染减少

