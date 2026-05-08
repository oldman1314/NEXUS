# Workflow 样式补全 Checklist

- [x] `.wf-node` 拥有完整的默认模式基础样式（背景、边框、圆角、阴影、文字颜色）
- [x] 非沉浸模式下节点不再是纯白方块，有面板级视觉层次
- [x] Start 节点左侧有 3px 绿色指示条（border-left: 3px solid var(--success)）
- [x] API 节点左侧有 3px 蓝色指示条（border-left: 3px solid var(--accent)）
- [x] Condition 节点左侧有 3px 橙色指示条（border-left: 3px solid var(--warning)）
- [x] Transform 节点左侧有 3px 紫色指示条（border-left: 3px solid #a855f7）
- [x] Output 节点左侧有 3px 靛蓝指示条（border-left: 3px solid #6366f1）
- [x] 各节点类型 hover 时有微妙的类型特有背景色调（极淡渐变，4% opacity）
- [x] Config Panel 的 label 与输入框间距合理（display: block; margin-bottom: 6px）
- [x] Config Panel 输入框 focus 态有明确的 accent 边框和发光效果
- [x] NodeKVEditor 行 hover 时有背景高亮反馈（var(--bg-hover)）
- [x] ScriptEditor 行号区域有次级背景色区分（var(--bg-tertiary)）
- [x] ScriptEditor textarea 有正确的等宽字体和行高
- [x] 所有样式在亮色主题下表现良好（CSS 变量均已在亮色模式定义）
- [x] 所有样式在暗色主题下表现良好（CSS 变量均已在暗色模式定义）
- [x] 沉浸式模式的 glass morphism 样式仍然正常工作（作为覆盖层，选择器优先级更高）
