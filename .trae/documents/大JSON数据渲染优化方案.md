# 大 JSON 数据渲染优化方案

## 当前问题

1. **`buildJsonTree` 一次性构建整棵树** — 5000 个节点全部递归构建，大数据时 JS 执行耗时长
2. **`JsonNode` 递归渲染** — 展开的节点全部一次性渲染到 DOM，大数据时 DOM 节点数巨大
3. **Raw 模式 `JSON.stringify` 一次性格式化** — 大数据时字符串拼接耗时长
4. **50MB 响应截断后仍然尝试解析** — 截断的 JSON 无法解析，会 fallback 到纯文本

## 方案：懒渲染 + 按需展开 + 虚拟滚动

### 核心思路

**不引入第三方虚拟滚动库**（项目无相关依赖），使用自研方案，分三层优化：

### 第一层：懒构建树节点（解决 `buildJsonTree` 性能问题）

当前 `buildJsonTree` 一次性递归构建所有 5000 个节点。改为：
- 只构建**当前可见层级**的节点
- 子节点在**展开时才构建**（懒加载）
- 大数组（>100 项）折叠时只显示摘要，不构建子树

```
修改前: buildJsonTree(data) → 一次性构建 5000 个节点
修改后: buildJsonTree(data, depth=0) → 只构建顶层 + 展开层
        expand(node) → 按需构建该节点的子树
```

### 第二层：虚拟滚动（解决 DOM 节点数问题）

将树形结构**扁平化**为可见行列表，只渲染视口内的行：

```
视口高度 600px / 行高 20px = 30 行可见
总行数 5000 → 只渲染 30+overscan ≈ 50 个 DOM 节点
```

实现方式：
1. 维护 `expandedKeys: Set<string>` 状态
2. 将树扁平化为 `FlatRow[]`（只包含当前展开后可见的行）
3. 监听滚动事件，计算 `startIndex` / `endIndex`
4. 用绝对定位 + `transform: translateY()` 渲染可见行
5. 容器设置 `totalHeight = flatRows.length * ROW_HEIGHT`

**关键：保持原始 UI 结构不变**
- 每行仍然是 `.jv-line` 结构
- 缩进仍然用 `paddingLeft: depth * 20px`
- 展开/折叠、复制按钮等交互不变

### 第三层：Raw 模式分段渲染（解决大字符串渲染问题）

当前 `JSON.stringify(data, null, 2)` 一次性生成完整格式化字符串。改为：
- 大数据时（>1MB）使用**分段渲染**
- 只渲染视口范围内的文本片段
- 用 `textarea` 替代 `pre>code`，原生支持滚动

### 第四层：大数据提示与降级

- 响应 > 5MB 时，默认使用 Raw 模式（跳过树形解析）
- 显示提示："Large response (XX MB), showing raw view for better performance"
- 提供按钮 "Switch to Tree View" 手动切换
- 响应 > 50MB 时，截断并提示

## 实现步骤

### Step 1: 重构 `buildJsonTree` 为懒构建模式

修改 `JsonHighlighter.tsx`：
- `buildJsonTree` 只构建当前层，不递归构建子节点
- 新增 `buildChildren(node)` 函数，展开时按需调用
- `JsonTreeNode.children` 改为懒加载：初始为 `undefined`，展开时才填充

### Step 2: 实现扁平化 + 虚拟滚动

新增 `useVirtualTree` hook：
- 输入：树根节点 + `expandedKeys`
- 输出：`flatRows: FlatRow[]`（当前可见行列表）
- 维护 `scrollTop` 和 `viewportHeight`
- 计算 `startIndex`、`endIndex`、`offsetY`

### Step 3: 重写 `JsonHighlighter` 组件

- 使用 `useVirtualTree` 替代递归 `JsonNode`
- 保持 `.jv-line`、`.jv-key`、`.jv-bracket` 等 CSS 类名不变
- 保持展开/折叠、复制等交互不变
- 容器结构：`div.json-viewer > div.jv-tree-virtual > div.jv-line*`

### Step 4: Raw 模式优化

- 大数据（>1MB）时用分段渲染
- 小数据保持原有 `pre>code` 结构

### Step 5: 大数据降级策略

- 在 `ResponsePanel` 中检测响应大小
- > 5MB 默认 Raw 模式 + 提示
- 提供手动切换按钮

## 涉及文件

| 文件 | 修改内容 |
|------|---------|
| `src/components/views/JsonHighlighter.tsx` | 重写为虚拟滚动架构 |
| `src/components/views/json-highlighter.css` | 新增虚拟滚动容器样式 |
| `src/components/views/ResponsePanel.tsx` | 大数据降级逻辑 |
| `src/utils/request.ts` | 优化截断策略 |

## 性能预期

| 场景 | 优化前 | 优化后 |
|------|--------|--------|
| 5000 节点 JSON 首次渲染 | ~500ms | ~30ms |
| DOM 节点数 | ~5000 | ~50 |
| 展开一个 1000 项数组 | ~200ms | ~16ms |
| 50MB Raw 渲染 | 卡死 | 流畅滚动 |
| 主题切换（大数据时） | ~280ms | ~30ms |
