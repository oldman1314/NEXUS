# Tasks

- [x] Task 1: 替换 prompt() 为内联保存对话框
  - [x] SubTask 1.1: 创建 SaveWorkflowDialog 组件，包含名称和描述输入框
  - [x] SubTask 1.2: 在 WorkflowView 中集成对话框，替换 handleSaveWorkflow 中的 prompt()
  - [x] SubTask 1.3: 添加对话框样式（save-workflow-dialog.css）
  - [x] SubTask 1.4: 支持另存为功能（已有工作流时可选）

- [x] Task 2: 节点面板拖拽支持与智能定位
  - [x] SubTask 2.1: 为节点面板项添加 draggable 属性和 onDragStart 事件
  - [x] SubTask 2.2: 在 ReactFlow 画布上实现 onDrop 和 onDragOver 事件处理
  - [x] SubTask 2.3: 修改 addNode 函数，基于视口中心计算位置（替代随机位置）
  - [x] SubTask 2.4: 连续添加节点时自动偏移避免重叠

- [x] Task 3: API 节点配置面板补充 Headers/Params 编辑器
  - [x] SubTask 3.1: 在 NodeConfigPanel 的 api 分支中添加 Headers 区块，复用 KVEditor 组件
  - [x] SubTask 3.2: 在 NodeConfigPanel 的 api 分支中添加 Params 区块，复用 KVEditor 组件
  - [x] SubTask 3.3: 确保 Headers/Params 数据正确同步到节点 data

- [x] Task 4: Transform 节点代码编辑器
  - [x] SubTask 4.1: 复用 useCodeEditor hook 为 Transform 节点配置创建代码编辑器实例
  - [x] SubTask 4.2: 替换 NodeConfigPanel 中 transform 分支的 textarea 为代码编辑器
  - [x] SubTask 4.3: 添加编辑器容器样式

- [x] Task 5: 侧边栏与编辑器双向联动
  - [x] SubTask 5.1: 在 useAppStore 中添加 activeWorkflowId 状态
  - [x] SubTask 5.2: SidebarWorkflows 点击工作流时设置 activeView 为 'workflow' 并加载工作流
  - [x] SubTask 5.3: WorkflowView 读取 activeWorkflowId 并自动加载
  - [x] SubTask 5.4: 侧边栏选中状态与编辑器同步

- [x] Task 6: 画布空状态引导与工作流模板
  - [x] SubTask 6.1: 创建 EmptyCanvasGuide 组件，显示引导文案和快速操作
  - [x] SubTask 6.2: 定义 2-3 个预置模板（如：API 串联调用、条件分支、数据转换管道）
  - [x] SubTask 6.3: 在画布为空时显示引导组件
  - [x] SubTask 6.4: 添加空状态和模板样式

- [x] Task 7: 执行时边线流动动画
  - [x] SubTask 7.1: 创建自定义 AnimatedEdge 组件，支持流动动画
  - [x] SubTask 7.2: 在执行过程中标记活跃边线
  - [x] SubTask 7.3: 注册自定义边线类型到 ReactFlow

- [x] Task 8: 日志面板可调整高度
  - [x] SubTask 8.1: 在 WorkflowLogs 顶部添加拖拽分隔条
  - [x] SubTask 8.2: 实现拖拽调整高度逻辑（最小 120px，最大 500px）
  - [x] SubTask 8.3: 添加拖拽手柄样式和光标变化

- [x] Task 9: 键盘快捷键
  - [x] SubTask 9.1: 在 WorkflowView 中添加 keydown 事件监听
  - [x] SubTask 9.2: 实现 Delete/Backspace 删除选中节点
  - [x] SubTask 9.3: 实现 Ctrl+S 保存工作流
  - [x] SubTask 9.4: 实现 Escape 取消选中/关闭面板

- [x] Task 10: 条件节点 Handle 优化
  - [x] SubTask 10.1: 重新设计条件节点 True/False Handle 的位置和样式
  - [x] SubTask 10.2: True Handle 使用绿色标识，False Handle 使用红色标识
  - [x] SubTask 10.3: 添加 Handle 悬停提示标签
  - [x] SubTask 10.4: 更新条件节点 CSS 样式

# Task Dependencies
- [Task 3] depends on [Task 1] (配置面板改动需要先完成保存对话框)
- [Task 5] depends on [Task 1] (联动需要保存对话框完成)
- [Task 6] depends on [Task 2] (模板创建依赖拖拽和智能定位)
- [Task 7] depends on [Task 2] (边线动画依赖节点交互基础)
- [Task 8] 独立
- [Task 9] 独立
- [Task 10] 独立
- [Task 4] 独立
