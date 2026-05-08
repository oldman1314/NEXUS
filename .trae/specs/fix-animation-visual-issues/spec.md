# 修复动画视觉问题 Spec

## Why
用户反馈三个动画相关问题影响用户体验：
1. 发送请求时进度栏显示会瞬间挤压其他元素导致抖动
2. 无人机瞌睡时螺旋桨速度没有降低（或降低效果不明显）
3. 无人机移动时会变小，视觉效果不理想

## What Changes
- 修改进度条布局方式，使用绝对定位避免影响其他元素
- 确保瞌睡状态螺旋桨转速正确降低
- 调整无人机飞行状态的 scale 值，保持大小一致

## Impact
- Affected specs: 无
- Affected code:
  - `src/components/views/request-view.css` - 进度条样式
  - `src/components/layout/titlebar/DroneBar.tsx` - 无人机动画参数
  - `src/components/layout/titlebar/drone-bar.css` - 瞌睡样式优先级

## ADDED Requirements

### Requirement: 进度条不挤压布局
进度条 SHALL 使用绝对定位渲染，不占用文档流空间，避免出现/消失时导致布局抖动。

#### Scenario: 发送请求时
- **WHEN** 用户点击 Send 按钮发送请求
- **THEN** 进度条以绝对定位方式显示在 URL 输入框下方
- **AND** 其他元素位置保持不变，无抖动

#### Scenario: 请求完成时
- **WHEN** 请求完成（成功或失败）
- **THEN** 进度条消失
- **AND** 其他元素位置保持不变，无回弹抖动

### Requirement: 瞌睡时螺旋桨减速
无人机进入瞌睡状态时，螺旋桨旋转速度 SHALL 明显降低。

#### Scenario: 进入瞌睡状态
- **WHEN** 用户 20 秒无操作且无人机处于 idle 状态
- **THEN** 螺旋桨动画时长从 0.6s 变为 2s 或更慢
- **AND** 视觉上能明显感知到减速效果

### Requirement: 无人机飞行保持大小
无人机在飞行和悬停状态时 SHALL 保持与 idle 状态相同的大小（scale: 1）。

#### Scenario: 无人机起飞飞行
- **WHEN** 无人机从 idle 切换到 flying/hovering 状态
- **THEN** 无人机大小保持不变（scale: 1）
- **AND** 仅改变位置（x, y），不缩放

## MODIFIED Requirements

### Requirement: 进度条组件
进度条组件从条件渲染改为始终渲染但控制可见性，使用 position: absolute 避免布局变化。

### Requirement: 无人机动画目标值
STATE_TARGETS 中 flying 和 hovering 状态的 scale 从 0.85 改为 1。
