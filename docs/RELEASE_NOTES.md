# Faraway v0.1.4 发布说明

0.1.4 是一个修复版：解决设置中修改模式名时页面被放大且无法恢复的问题，并统一替换应用图标与启动页。版本号升级到 `0.1.4`（Android `versionCode 5`，iOS build 5）。

## 本次修复

- **改名不再放大页面**：设置页的模式名输入框在移动端固定为 `16px`，避免 iOS WKWebView 因输入框字号小于 16px 触发自动缩放；同时锁定 viewport 的双指缩放，键盘收起后不会停留在放大状态。
- **新应用图标**：使用日出公路图案替换旧图标，重新生成 Android 自适应图标（背景 + 全出血前景）、iOS `AppIcon`、PWA 图标、favicon 与 Android/iOS 启动页。清除 Android 启动器缓存后确认图标无白边。
- **Figma 复核**：通过 Figma MCP 读取 [Faraway 设计文件](https://www.figma.com/design/46zxalrl2LCCnF3VbkUw2P/Faraway?node-id=0-1) 当前可见的 landing 画面，应用内 landing 的层级、文案和圆形视觉与该画面一致。设计文件目前只公开一个 landing 页面，专注、设置、洞察页面没有可读取节点，因此没有做全量逐屏比对。

## 保持不变

- 正式版专注 **20 分钟**、眼休息 **20 秒**；20-20-20 节奏不变。
- 专注页、模式下拉、停止确认、重置数据、洞察堆叠柱状图沿用 0.1.3 的实现。
- Android / iOS 本地通知、触感、安全区、竖屏锁定与本地持久化不变；没有账号、云端或遥测。

## 验证情况

- Web：`npm run lint`、`npm run format:check`、`npm run typecheck`、`npm test`（19 项单元测试）、`npm run test:e2e`（7 项 Pixel 7 移动端 E2E）全部通过。
- Android：本地 API 33 模拟器安装 `0.1.4` APK，确认 `versionCode 5` / `versionName 0.1.4`；设置页模式名输入框聚焦后页面不放大，输入框计算字号为 `16px`；应用抽屉与启动页使用新图标。
- iOS：由 GitHub Actions macOS 15 runner 构建未签名 IPA 与模拟器 App。iOS 的输入框自动缩放无法在 Windows 本机复现，修复采用移动端 16px 字号加 viewport 缩放锁定的标准方案，建议在真机验收时补一次改名操作。
- Figma：MCP 读取到设计文件仅有一个 landing `CODE_INSTANCE` 页面；对比截图保存在 `docs/screenshots/figma-latest-landing.png`。

## 下载文件

- [Faraway-0.1.4-android-debug.apk](https://github.com/Phanstal/Faraway/releases/download/v0.1.4/Faraway-0.1.4-android-debug.apk) — Android debug 签名 APK，可直接侧载。
- [Faraway-0.1.4-ios-unsigned.ipa](https://github.com/Phanstal/Faraway/releases/download/v0.1.4/Faraway-0.1.4-ios-unsigned.ipa) — iOS 未签名 IPA，需要自行用 Apple ID 重签。
- [Faraway-0.1.4-ios-simulator.zip](https://github.com/Phanstal/Faraway/releases/download/v0.1.4/Faraway-0.1.4-ios-simulator.zip) — iOS 模拟器 App，需要 macOS + Xcode。
- [SHA256SUMS.txt](https://github.com/Phanstal/Faraway/releases/download/v0.1.4/SHA256SUMS.txt) — 校验和。

## 已知限制

- 暂无云同步、账号、导出/导入；数据只在本机。
- Android 本地通知使用非精确闹钟（未授予精确闹钟权限时可能延迟约 1 分钟）。
- Android APK 使用 CI debug 签名，不适合直接上架 Google Play；从 0.1.3 覆盖安装如提示签名不一致，请先卸载旧版，本地数据会一起清除。
- iOS 只发布未签名 IPA 与模拟器包，真机需要自行签名；iOS 端的改名缩放修复未在真机上做本地验收。

## 校验

```bash
sha256sum -c SHA256SUMS.txt
```

或在 Windows PowerShell 中：

```powershell
Get-FileHash .\Faraway-0.1.4-android-debug.apk -Algorithm SHA256
```
