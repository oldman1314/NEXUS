# 修复标题栏面包屑与右侧内容区域左边界对齐

## Why
标题栏中的面包屑（GET badge + Breadcrumb）左边缘没有与下方右侧内容区域（main-content）的左边界对齐。当前面包屑从 AppMenu 右边缘开始，但由于标题栏和内容区域是不同的 DOM 层级，导致视觉上不对齐。

## What Changes
- 修改 `.tb-app-menu` 的宽度，使其精确等于 sidebar 的总占用宽度（含 border）
- 修改 `.tb-context-area` 的 padding，确保 GET badge 左边缘与 main-content 左边界对齐
- 处理 immersive 模式下 sidebar 的 `margin: 6px` 偏移
- 处理 sidebar 折叠状态下的对齐

## Impact
- Affected code: `app-menu.css`, `context-area.css`, `title-bar.css`
- Affected layouts: Classic 模式、Immersive 模式、折叠状态

## ADDED Requirements

### Requirement: 标题栏面包屑与内容区域左边界对齐

标题栏中 GET badge 的左边缘 SHALL 与下方 main-content 的左边界精确对齐。

#### Scenario: Classic 模式下对齐
- **GIVEN** 应用处于 Classic 视觉模式，sidebar 未折叠
- **WHEN** 用户查看标题栏和内容区域
- **THEN** GET badge 左边缘与 main-content 左边界处于同一垂直线上

#### Scenario: Immersive 模式下对齐
- **GIVEN** 应用处于 Immersive 视觉模式，sidebar 未折叠
- **WHEN** 用户查看标题栏和内容区域
- **THEN** GET badge 左边缘与 main-content 左边界处于同一垂直线上（考虑 sidebar 的 margin: 6px）

#### Scenario: Sidebar 折叠状态下对齐
- **GIVEN** sidebar 处于折叠状态（48px）
- **WHEN** 用户查看标题栏和内容区域
- **THEN** GET badge 左边缘与 main-content 左边界处于同一垂直线上

## MODIFIED Requirements

### Requirement: AppMenu 宽度与 sidebar 宽度一致
AppMenu 的宽度 SHALL 等于 sidebar 的总占用宽度（含 border 和 margin），确保标题栏左侧区域与 sidebar 精确对齐。

### Requirement: ContextArea 无左侧 padding
ContextArea SHALL 没有左侧 padding，使 GET badge 紧贴 AppMenu 右边缘，从而与 main-content 左边界对齐。
