# Faraway v0.1.3 发布说明

界面版本：按 Figma Make **当前原型**重做专注页、模式切换、停止确认、重置数据与洞察图表。20 分钟专注 / 20 秒眼休息的正式版节奏保持不变；应用版本升级到 `0.1.3`（Android `versionCode 4`，iOS build 4）。

## 本次变更

- **专注页重排**：模式选择移到计时器上方，改为紧凑的 `Work` 下拉；专注进行中仍可切换模式。页面高度、间距和字号按原型重新对齐。
- **开始休息**：专注结束后主按钮显示 `Start Break`，休息状态仍可 `Skip break` 或直接开始下一轮。
- **停止本轮**：专注中或暂停时新增 `Stop Focus`，两步确认后结束；已专注满 1 分钟会按整分钟写入历史，不足 1 分钟不产生记录。
- **重置数据**：设置页新增 `Reset Faraway` / `Reset all data`，经过两次确认后清空本机历史、模式与偏好，并回到专注页。
- **洞察图表**：模式拆分改为紧凑卡片行；趋势柱按模式颜色堆叠，Day / Week / Month 都使用同一套堆叠规则。
- **版本**：npm `0.1.3`，Android `versionCode 4` / `versionName 0.1.3`，iOS `CFBundleShortVersionString 0.1.3` / build 4。

## 保持不变

- 正式版专注 **20 分钟**、眼休息 **20 秒**，不使用原型为演示设置的 10 秒计时。
- Android / iOS 本地通知、原生触感、安全区、竖屏锁定与 Android 分层返回。
- 本地持久化：Android SharedPreferences、iOS UserDefaults、Web localStorage；没有账号、云端或遥测。

## 与原型的有意差异

Figma 原型把专注时长加速为 10 秒用于演示，因此设计稿中的计时器显示 `00:10`。正式版恢复为真实的 **20 分钟**，让应用可以直接遵循 20-20-20 法则；眼休息保持 **20 秒**。其余视觉、文案和交互按原型当前版本实现。

## 下载文件

- [Faraway-0.1.3-android-debug.apk](https://github.com/Phanstal/Faraway/releases/download/v0.1.3/Faraway-0.1.3-android-debug.apk) — Android debug 签名 APK，可直接侧载。
- [Faraway-0.1.3-ios-unsigned.ipa](https://github.com/Phanstal/Faraway/releases/download/v0.1.3/Faraway-0.1.3-ios-unsigned.ipa) — iOS 未签名 IPA，需要自行用 Apple ID 重签。
- [Faraway-0.1.3-ios-simulator.zip](https://github.com/Phanstal/Faraway/releases/download/v0.1.3/Faraway-0.1.3-ios-simulator.zip) — iOS 模拟器 App，需要 macOS + Xcode。
- [SHA256SUMS.txt](https://github.com/Phanstal/Faraway/releases/download/v0.1.3/SHA256SUMS.txt) — 校验和。

## 验证情况

- 本地 Web：`npm run lint`、`npm run format:check`、`npm run typecheck`、`npm test`（19 项单元测试）、`npm run test:e2e`（7 项移动端 E2E）全部通过。
- Android：本地 API 33 模拟器安装 `0.1.3` APK，验证模式下拉、专注中切换模式、`Stop Focus` 两步确认、满 1 分钟保存（本次保存 2m）、重置数据、杀进程后恢复计时；包内 `versionCode 4` / `versionName 0.1.3`。
- iOS：由 GitHub Actions macOS 14 runner 构建模拟器 App、安装启动并截图；未签名设备 IPA 与模拟器 zip 由 release workflow 构建。
- CI：[CI_RUN_LINK]。
- Release workflow：[RELEASE_RUN_LINK]。

## 已知限制

- 暂无云同步、账号、导出/导入；数据只在本机。
- Android 本地通知使用非精确闹钟（系统未授予精确闹钟权限时可能延迟约 1 分钟）。
- Android APK 未使用 release keystore 签名，不适合直接上架 Google Play。
- iOS 没有 Apple Developer 证书，因此只发布未签名 IPA 与模拟器包。
- iOS 真机安装与运行需要用户自行签名；签名有效期取决于 Apple ID 类型。

## 校验

```bash
sha256sum -c SHA256SUMS.txt
```

或在 Windows PowerShell 中：

```powershell
Get-FileHash .\Faraway-0.1.3-android-debug.apk -Algorithm SHA256
```
