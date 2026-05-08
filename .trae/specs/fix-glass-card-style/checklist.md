# 玻璃卡片样式修复 Checklist

## 核心变量修复
- [x] 浅色模式 `--glass-bg` 不透明度已降至 ≤ 0.5（实际: 0.48）
- [x] 浅色模式 `--glass-border` 使用深色调（非白色）（实际: rgba(0,0,0,0.10)）
- [x] 浅色模式 `--glass-border-subtle` / `--glass-border-pronounced` 可见
- [x] 浅色模式 `--glass-elevation-1/2/3` 阴影强度已提升（elev-1: 0.09, elev-2: 0.10, elev-3: 0.14）
- [x] 浅色模式 `--glass-highlight` 高光效果可见（三段式渐变）
- [x] 浅色模式 `--bg-canvas` 与 `--bg-canvas-end` 色差充足（#e8eaed → #dce0e6）
- [x] 深色模式 `--glass-bg` 不透明度已优化（实际: 0.58 ≤ 0.62）
- [x] 深色模式 `--glass-border` 不透明度 ≥ 0.18（实际: 0.20）
- [x] 深色模式 `--glass-elevation` 阴影扩散适当（elev-1: 0.28, elev-2: 0.38, elev-3: 0.48）
- [x] 深色模式 `--glass-highlight` 高光可见
- [x] 深色模式背景渐变有足够深度（#10101c → #181838）

## 面板卡片效果
- [x] 请求面板具有可见的半透明玻璃效果（使用 --glass-bg + backdrop-filter）
- [x] 响应面板具有可见的半透明玻璃效果（使用 --glass-bg + backdrop-filter）
- [x] 卡片边框在浅色背景下清晰可辨（rgba(0,0,0,0.10) 深色边框）
- [x] 卡片边框在深色背景下清晰可辨（rgba(255,255,255,0.20) 白色边框）
- [x] 卡片阴影产生"浮起"的空间层次感（elevation-2 双层阴影）
- [x] 卡片顶部高光反射可见（三段式 glass-highlight 渐变）

## 子组件一致性
- [x] `.request-toolbar` 在 immersive 下背景处理正确（半透明 30%/6%）
- [x] `.panel-tabs` 在 immersive 下背景正确（transparent + subtle 边框）
- [x] `.response-header` / `.response-toolbar` 背景一致（transparent）
- [x] 侧边栏玻璃效果与面板风格统一（使用相同 glass 变量系统）
- [x] 弹窗/命令面板/右键菜单玻璃效果协调（差异化 blur/border/elevation 参数）

## 回归保障
- [x] Classic 模式下界面无任何变化（所有修改均在 immersive 选择器内）
- [x] 所有动画和过渡效果正常工作（未修改动画相关代码）
- [x] prefers-reduced-motion 仍被尊重（保留原有媒体查询）
- [x] backdrop-filter 不支持时的回退仍有效（保留 @supports 回退块）
