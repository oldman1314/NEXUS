# 浅色主题玻璃卡片样式问题修复 Checklist

## 变量覆盖
- [x] 浅色模式 `--bg-hover` 已覆盖为半透明白色（rgba(255,255,255,0.15)，替代深色实色）
- [x] 浅色模式 `--bg-active` 已覆盖为半透明蓝色（rgba(0,122,255,0.15)）
- [x] 浅色模式 `--border-color` 已覆盖为协调值（rgba(0,0,0,0.10)）
- [x] 深色模式 `--bg-hover` 已覆盖为半透明白色（rgba(255,255,255,0.10)）
- [x] 深色模式 `--bg-active` 已覆盖为半透明蓝色（rgba(10,132,255,0.20)）
- [x] 深色模式 `--border-color` 已覆盖为协调值（rgba(255,255,255,0.14)）

## 侧边栏子元素玻璃化（通过变量覆盖自动生效）
- [x] collection-header hover 状态半透明（--bg-hover 自动应用）
- [x] collection-header selected 状态半透明（--bg-active 自动应用）
- [x] request-item hover 状态半透明（--bg-hover 自动应用）
- [x] request-item selected 状态半透明（--bg-active 自动应用）
- [x] nav-item hover 状态半透明（--bg-hover 自动应用）
- [x] nav-item active 状态半透明（--bg-active 自动应用）
- [x] section-header hover 状态半透明（--bg-hover 自动应用）
- [x] sidebar-toggle-btn hover 状态半透明（--bg-hover 自动应用）
- [x] icon-btn hover 状态半透明（--bg-hover 自动应用）

## 响应面板内层透明化（显式覆盖）
- [x] body-editor-wrapper 背景透明 + glass 边框（body-tab.css）
- [x] body-line-numbers 背景透明 + glass 边框（body-tab.css）
- [x] body-toolbar-btn glass 边框（body-tab.css）
- [x] script-editor-wrapper 背景透明 + glass 边框（script-tab.css）
- [x] line-numbers 背景透明 + glass 边框（script-tab.css）
- [x] script-console / console-header glass 边框（script-tab.css）
- [x] script-textarea 背景透明 + glass 边框（request-view.css）
- [x] params/headers 表格 th/td glass 边框（request-view.css）
- [x] key-value-input / description-input 透明 + glass 边框（request-view.css）
- [x] curl-import-dropdown glass 效果（request-view.css）
- [x] file-input-label / type-toggle 透明 + glass 边框（request-view.css）
- [x] response-timeout-badge glass 背景（request-view.css）

## 回归保障
- [x] Classic 模式下 hover/active 状态不变（:root 变量未修改）
- [x] 深色主题下效果正常（所有深色变量已覆盖）
- [x] 所有动画和过渡效果正常工作（未修改动画相关代码）
