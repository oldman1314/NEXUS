# 图标不显示修复 + 多方案图标设计计划

## 问题诊断

### 根因分析（3个问题叠加）

1. **ICO 文件格式不兼容**：当前 `build/icon.ico` 由 `png-to-ico` 库生成，内部所有图像（16x16~256x256）均以 **BMP DIB 格式**存储（header `28000000` = BITMAPINFOHEADER），而非 PNG-in-ICO。虽然 BMP DIB 是 ICO 的传统格式，但 `png-to-ico` 生成的 DIB 可能存在兼容性问题（如缺少 AND 掩码层、颜色深度不对等），导致 Electron/Windows 无法正确解析。

2. **BrowserWindow 使用 PNG 而非 ICO**：当前 `electron/main.ts` 中 `icon` 配置使用的是 `build/256x256.png`。Windows 任务栏图标优先使用 `.ico` 格式，PNG 在开发模式下可能无法正确设置任务栏图标。

3. **`app.getAppPath()` 在开发模式下可能返回 asar 路径**：虽然目前开发模式下 `getAppPath()` 返回项目根目录，但更可靠的做法是使用 `__dirname` + 相对路径，因为 `__dirname` 在 Vite CJS 打包后始终指向 `dist-electron/`。

## 实施步骤

### 步骤 1：设计 4 个不同风格的图标 SVG

为用户提供 4 个创意方案选择：

| 方案 | 名称 | 设计概念 | 配色 |
|------|------|----------|------|
| A | API Bot | 可爱机器人吉祥物，`{ }` 花括号眼睛，天线发射信号波 | 橙粉渐变 |
| B | Rocket API | 火箭冲天造型，火箭体是 `{ }` 花括号，尾焰是 API 响应数据流 | 深蓝到青色渐变 |
| C | Code Wave | 抽象代码波浪，`</>` 符号融入海浪/声波形态 | 紫蓝渐变 |
| D | Lightning Bolt | 闪电造型，代表快速 API 调试，闪电中嵌入 `⚡` 和 `GET` 文字 | 金黄到橙色渐变 |

### 步骤 2：使用 `@ctjs/png2icons` 替换 `png-to-ico` 重新生成合规 ICO

**关键**：`@ctjs/png2icons` 支持 `-icowe` 模式（for Windows Executables），小尺寸用 BMP、大尺寸用 PNG，这是 Electron 应用的最佳实践格式。

- 安装 `@ctjs/png2icons`
- 重写 `build/generate-icons.mjs`，使用 `png2icons` 的 `createICO(input, BICUBIC, 0, false, true)` 参数（`forWinExe=true`）
- 同时生成 ICNS（macOS）格式

### 步骤 3：修复 BrowserWindow 图标路径

修改 `electron/main.ts`：

```typescript
// 开发模式：使用 __dirname 相对路径定位到 build/icon.ico
// 打包模式：使用 process.resourcesPath 定位 extraResources 中的 icon.ico
icon: app.isPackaged
  ? path.join(process.resourcesPath, 'icon.ico')
  : path.resolve(__dirname, '../build/icon.ico'),
```

**为什么用 `path.resolve` 而非 `path.join`**：`path.resolve` 会生成绝对路径，避免相对路径解析问题。

### 步骤 4：确保 electron-builder 配置正确

当前 `package.json` 中的 `build` 配置已有 `win.icon` 和 `extraResources`，确认无需修改。

### 步骤 5：更新 favicon 配置

确保 `public/favicon.ico` 和 `public/favicon-32x32.png` 也从选定的图标方案重新生成。

### 步骤 6：验证

- 运行 `npm run build:electron:dev` 重新编译主进程
- 运行 `npm run dev` 启动应用
- 检查 Windows 任务栏图标是否正确显示
- 如仍显示旧图标，清理 Windows 图标缓存

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `build/icon-a.svg` | 新建 - 方案A图标 |
| `build/icon-b.svg` | 新建 - 方案B图标 |
| `build/icon-c.svg` | 新建 - 方案C图标 |
| `build/icon-d.svg` | 新建 - 方案D图标 |
| `build/generate-icons.mjs` | 重写 - 使用 @ctjs/png2icons |
| `electron/main.ts` | 修改 - 修复图标路径 |
| `package.json` | 修改 - 替换 png-to-ico 为 @ctjs/png2icons |
