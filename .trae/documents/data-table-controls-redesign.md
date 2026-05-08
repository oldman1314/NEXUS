# Data Table 控件重构计划

## 目标
摒弃当前的模式切换（Simple/Detailed）和布局间距（Comfortable/Standard/Compact）的滑块设计，重新设计两个组件的 UI，提升主题适配性、一致性、可读性和排版专业性。

## 当前问题分析

### 现有设计缺陷
1. **滑块指示器过于复杂**: 需要维护 `data-position` 属性和绝对定位动画
2. **视觉层次不清**: 滑块组件与工具栏其他按钮风格不统一
3. **占用空间过多**: 两个滑块组件并排显示，工具栏拥挤
4. **可读性差**: 只有图标没有文字标签，用户难以理解功能
5. **主题适配弱**: 指示器的 `accent-glow` 背景在某些主题下对比度不足

## 新设计方案

### 组件 1: 视图模式切换器 (View Mode Switcher)
**设计风格**: 下拉选择器（Dropdown Select）

```
┌─────────────────────┐
│ 📊 Simple        ▾  │
└─────────────────────┘
         ↓ 点击展开
┌─────────────────────┐
│ ✓ Simple            │
│   Detailed          │
└─────────────────────┘
```

**特点**:
- 显示当前模式的图标 + 文字标签 + 下拉箭头
- 占用空间小（单按钮宽度）
- 专业感强，符合数据工具的语境
- 下拉菜单提供清晰的选项列表

### 组件 2: 行高密度选择器 (Row Density Selector)
**设计风格**: 分段图标按钮组（Segmented Icon Buttons）

```
┌───┬───┬───┐
│ ☰ │ ☰ │ ≡ │
│宽 │中 │紧 │
└───┴───┴───┘
```

**特点**:
- 三个独立按钮，每个带图标和简短文字标签
- 无滑块指示器，使用边框/背景区分选中状态
- 图标直观表达行高概念（线条疏密）
- 紧凑布局，与工具栏其他控件协调

## 实施步骤

### 步骤 1: 删除旧 CSS 样式
**文件**: `src/components/data-table/data-table.css`

删除以下样式块:
- [x] `.dt-mode-slider` (L97-L107) - 模式滑块容器
- [x] `.dt-mode-slider-indicator` (L109-L124) - 模式滑块指示器
- [x] `.dt-mode-slider-btn` (L126-L155) - 模式滑块按钮
- [x] `.dt-density-group` (L489-L523) - 密度组容器（保留类名，重写样式）
- [x] `.dt-density-indicator` (L509-L523) - 密度指示器
- [x] `.dt-density-btn` (L525-L550) - 密度按钮（保留类名，重写样式）

### 步骤 2: 实现视图模式下拉选择器
**文件**: `src/components/data-table/data-table.css`

新增样式:
```css
/* View Mode Dropdown */
.dt-view-mode-dropdown {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--dt-border-strong);
  border-radius: var(--dt-radius-sm);
  background: var(--dt-surface);
  color: var(--dt-text-muted);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dt-fast) var(--dt-ease-out);
  white-space: nowrap;
}

.dt-view-mode-dropdown:hover {
  border-color: var(--dt-accent);
  color: var(--dt-text);
}

.dt-view-mode-dropdown-icon {
  display: flex;
  align-items: center;
  color: var(--dt-accent);
}

.dt-view-mode-dropdown-arrow {
  margin-left: auto;
  color: var(--dt-text-dim);
  transition: transform var(--dt-fast) var(--dt-ease-out);
}

.dt-view-mode-dropdown.open .dt-view-mode-dropdown-arrow {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dt-view-mode-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 140px;
  background: var(--dt-elevated);
  border: 1px solid var(--dt-border-strong);
  border-radius: var(--dt-radius);
  box-shadow: var(--shadow-lg);
  padding: 4px;
  z-index: var(--dt-z-popup);
  animation: dt-scaleIn var(--dt-fast) var(--dt-ease-out);
}

.dt-view-mode-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  color: var(--dt-text-muted);
  font-size: var(--text-xs);
  font-weight: 500;
  border-radius: var(--dt-radius-sm);
  cursor: pointer;
  text-align: left;
  transition: all var(--dt-fast) var(--dt-ease-out);
}

.dt-view-mode-item:hover {
  background: color-mix(in srgb, var(--dt-accent) 8%, transparent);
  color: var(--dt-text);
}

.dt-view-mode-item.active {
  color: var(--dt-accent);
  background: var(--dt-accent-glow);
}

.dt-view-mode-item-check {
  margin-left: auto;
  opacity: 0;
  transition: opacity var(--dt-fast);
}

.dt-view-mode-item.active .dt-view-mode-item-check {
  opacity: 1;
}
```

**文件**: `src/components/data-table/DataTableToolbar.tsx`

修改 `renderModeSlider()` 函数:
```tsx
const renderModeSelector = () => {
  const currentMode = modeOptions.find(opt => opt.value === mode)!
  
  return (
    <div className="dt-view-mode-wrapper" ref={viewModeRef}>
      <button
        className={`dt-view-mode-dropdown ${showViewMode ? 'open' : ''}`}
        onClick={() => setShowViewMode(!showViewMode)}
      >
        <span className="dt-view-mode-dropdown-icon">{currentMode.icon}</span>
        <span>{currentMode.label}</span>
        <ChevronDown size={12} className="dt-view-mode-dropdown-arrow" />
      </button>
      
      {showViewMode && (
        <div className="dt-view-mode-menu">
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`dt-view-mode-item ${mode === opt.value ? 'active' : ''}`}
              onClick={() => { onModeChange(opt.value); setShowViewMode(false) }}
            >
              {opt.icon}
              <span>{opt.label}</span>
              {mode === opt.value && (
                <Check size={14} className="dt-view-mode-item-check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

添加状态:
```tsx
const [showViewMode, setShowViewMode] = useState(false)
const viewModeRef = useRef<HTMLDivElement>(null)

// 点击外部关闭
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (viewModeRef.current && !viewModeRef.current.contains(e.target as Node)) {
      setShowViewMode(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```

添加导入:
```tsx
import { ChevronDown, Check } from 'lucide-react'
```

### 步骤 3: 重构行高密度选择器
**文件**: `src/components/data-table/data-table.css`

替换现有 `.dt-density-group` 和相关样式为:
```css
/* Row Density Selector */
.dt-density-group {
  display: inline-flex;
  align-items: center;
  background: var(--dt-surface);
  border: 1px solid var(--dt-border-strong);
  border-radius: var(--dt-radius-sm);
  padding: 2px;
  gap: 0;
  height: 28px;
}

.dt-density-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 36px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: calc(var(--dt-radius-sm) - 1px);
  background: transparent;
  color: var(--dt-text-dim);
  cursor: pointer;
  transition: all var(--dt-fast) var(--dt-ease-out);
  position: relative;
  line-height: 1;
  gap: 2px;
}

.dt-density-btn:hover:not(.active) {
  color: var(--dt-text-muted);
  background: rgba(128, 128, 128, 0.05);
}

.dt-density-btn.active {
  background: var(--dt-bg);
  color: var(--dt-accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.dt-density-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16px;
}

.dt-density-btn-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  opacity: 0.7;
}
```

**文件**: `src/components/data-table/DataTableToolbar.tsx`

修改 `renderDensitySelector()` 函数:
```tsx
const renderDensitySelector = () => (
  <div className="dt-density-group" role="radiogroup" aria-label="Row density">
    {densityOptions.map((opt) => (
      <button
        key={opt.value}
        className={`dt-density-btn ${density === opt.value ? 'active' : ''}`}
        onClick={() => onDensityChange(opt.value)}
        title={opt.label}
        role="radio"
        aria-checked={density === opt.value}
      >
        <span className="dt-density-btn-icon">{opt.icon}</span>
        <span className="dt-density-btn-label">
          {opt.value.charAt(0).toUpperCase()}
        </span>
      </button>
    ))}
  </div>
)
```

更新图标定义以更好表达密度:
```tsx
const densityOptions: { value: Density; icon: React.ReactNode; label: string }[] = [
  { value: 'comfortable', icon: <Rows3 size={13} />, label: 'Comfortable' },
  { value: 'standard', icon: <List size={13} />, label: 'Standard' },
  { value: 'compact', icon: <AlignJustify size={13} />, label: 'Compact' },
]
```

### 步骤 4: 清理无用代码
**文件**: `src/components/data-table/DataTableToolbar.tsx`

移除:
- `data-position` 属性逻辑
- `positionMap` 对象
- 滑块指示器 DOM 元素

### 步骤 5: 测试验证
1. **功能测试**:
   - [ ] 模式切换正常工作（Simple ↔ Detailed）
   - [ ] 密度切换正常工作（Comfortable / Standard / Compact）
   - [ ] 下拉菜单点击外部关闭
   - [ ] 键盘导航支持（Tab / Enter / Escape）

2. **视觉测试**:
   - [ ] 亮色主题下显示正常
   - [ ] 暗色主题下显示正常
   - [ ] Hover/Focus/Active 状态正确
   - [ ] 动画流畅无卡顿

3. **响应式测试**:
   - [ ] 1200px 以下屏幕宽度适配
   - [ ] 768px 以下移动端适配
   - [ ] 工具栏换行时布局合理

4. **一致性检查**:
   - [ ] 新组件与其他工具栏按钮风格统一
   - [ ] 圆角、字号、颜色变量使用一致
   - [ ] 间距符合设计规范

## 设计优势

### 1. 主题适配性
- ✅ 所有颜色使用 CSS 变量（`--dt-*` 系列）
- ✅ 自动适配亮色/暗色主题
- ✅ 高对比度模式下文字可读性好

### 2. 一致性
- ✅ 边框样式与输入框、按钮统一（`var(--dt-border-strong)`）
- ✅ 圆角规格统一（`var(--dt-radius-sm)`）
- ✅ 过渡动画时长统一（`var(--dt-fast)` / `var(--dt-normal)`）
- ✅ 字体大小统一（`var(--text-xs)`）

### 3. 可读性
- ✅ 模式选择器：显示完整文字标签（"Simple"/"Detailed"）
- ✅ 密度选择器：图标+首字母缩写（C/S/C）双重提示
- ✅ 下拉菜单：清晰的选项列表 + 勾选标记
- ✅ Tooltip：悬停显示完整描述

### 4. 排版专业性
- ✅ 工具栏从拥挤变得清爽
- ✅ 主次分明：搜索框 > 模式选择 > 密度控制 > 操作按钮
- ✅ 符合现代数据工具 UI 规范（类似 GitHub/GitLab/Tableau）
- ✅ 信息层级清晰，用户无需猜测功能

## 影响范围

### 修改文件列表
1. `src/components/data-table/data-table.css`
   - 删除 ~60 行旧滑块样式
   - 新增 ~120 行新组件样式

2. `src/components/data-table/DataTableToolbar.tsx`
   - 重写 `renderModeSlider()` → `renderModeSelector()`
   - 重写 `renderDensitySelector()`
   - 新增状态管理（`showViewMode`, `viewModeRef`）
   - 新增导入（`ChevronDown`, `Check`）

3. 不影响的其他文件
   - `DataTableView.tsx` - 仅调用接口不变
   - `useDataTableStore.ts` - 状态管理不变
   - `useDataTableData.ts` - 数据获取逻辑不变

## 预期效果

### Before（当前）
```
[Project ID] [Test Run ID] [📊][📋] | [☰][☰][≡] | [↻][▤][⊞][⚑][⋯]
  滑块1     滑块2           操作按钮
```

### After（新设计）
```
[Project ID] [Test Run ID] [Search] [📊 Simple ▾] [C|S|C] | [↻][▤][⊞][⚑][⋯]
                              下拉选择    密度按钮组    操作按钮
```

**改进点**:
- 工具栏更整洁，视觉噪音减少
- 功能标识更明确（文字标签）
- 交互更符合直觉（下拉 vs 滑动）
- 专业感提升（类似企业级数据工具）
