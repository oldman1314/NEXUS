# 玻璃卡片内层穿透修复 Checklist

## 变量覆盖
- [x] 浅色模式 `--bg-sidebar` 已覆盖为半透明值（rgba(255,255,255,0.06)）
- [x] 浅色模式 `--bg-input` 已覆盖为半透明值（rgba(255,255,255,0.55)）
- [x] 浅色模式 `--bg-tertiary` 已覆盖为半透明值（rgba(255,255,255,0.12)）
- [x] 浅色模式 `--border-light` 已覆盖为协调值（rgba(0,0,0,0.08)）
- [x] 深色模式 `--bg-sidebar` 已覆盖为半透明值（rgba(255,255,255,0.04)）
- [x] 深色模式 `--bg-input` 已覆盖为半透明值（rgba(255,255,255,0.08)）
- [x] 深色模式 `--bg-tertiary` 已覆盖为半透明值（rgba(255,255,255,0.06)）
- [x] 深色模式 `--border-light` 已覆盖为协调值（rgba(255,255,255,0.10)）

## 侧边栏玻璃效果
- [x] 侧边栏整体呈现半透明玻璃质感（非实色块）
- [x] section-header 区域不遮挡玻璃效果
- [x] sidebar-footer 区域不遮挡玻璃效果
- [x] 侧边栏 fallback 路径（无 backdrop-filter）也使用半透明背景

## 响应面板内层玻璃化
- [x] body-editor-wrapper 背景半透明（var(--bg-input) → rgba(255,255,255,0.55)，非 #ffffff 实色）
- [x] body-line-numbers 背景半透明（var(--bg-tertiary) → rgba(255,255,255,0.12)，非 #e8e8ed 实色）
- [x] url-input 输入框背景半透明（var(--bg-input) 自动继承）
- [x] params key/value 输入框背景半透明（var(--bg-input) 自动继承）
- [x] headers key/value 输入框背景半透明（var(--bg-input) 自动继承）
- [x] 响应面板内部不再有"classic 白色方块"的割裂感

## 回归保障
- [x] Classic 模式下所有变量值不变（:root 和 [data-theme="dark"] 均未修改）
- [x] 输入框在 immersive 下仍保持足够的可读性对比度（55% 白色 + 底层 canvas 渐变）
- [x] 行号区域文字清晰可读（12% 白色 + 文字颜色保持不变）
