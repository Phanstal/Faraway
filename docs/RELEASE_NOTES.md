# Faraway v0.1.0 发布说明

首个公开版本，提供 Android、iOS 原生外壳，以及可在浏览器中运行的本地优先 Web 版本。

## 功能

- 欢迎页：品牌文案、随机护眼提示与 5 秒自动进入计时器。
- 20-20-20 专注循环：20 分钟专注、20 秒眼休息、完成页；支持暂停、继续、跳过休息和开始下一轮。
- 专注模式：Work / Study / Creative 三套配色，最多 3 个模式，可改名、删除、新增。
- 专注洞察：总时长、今日时长、模式拆分，以及 Day / Week / Month 趋势图；包含空状态。
- 原生本地通知：专注结束时提醒抬头看远处；首次开始专注时请求权限，设置页可查看状态。
- 触感反馈：开始、暂停、休息和完成使用原生 Haptics。
- 本地持久化：Android SharedPreferences、iOS UserDefaults、Web localStorage；重启后恢复计时与记录。
- 原生适配：安全区、竖屏锁定、Android 分层返回。

## 与原型的有意差异

Figma 原型把专注时长加速为 10 秒用于演示，因此设计稿中的计时器显示 `00:10`。正式版恢复为真实的 **20 分钟**，让应用可以直接遵循 20-20-20 法则；眼休息保持 **20 秒**。其余视觉、文案和交互按原型实现。

## 下载文件

- [Faraway-0.1.0-android-debug.apk](https://github.com/Phanstal/Faraway/releases/download/v0.1.0/Faraway-0.1.0-android-debug.apk) — Android debug 签名 APK，可直接侧载。
- [Faraway-0.1.0-ios-unsigned.ipa](https://github.com/Phanstal/Faraway/releases/download/v0.1.0/Faraway-0.1.0-ios-unsigned.ipa) — iOS 未签名 IPA，需要自行用 Apple ID 重签。
- [Faraway-0.1.0-ios-simulator.zip](https://github.com/Phanstal/Faraway/releases/download/v0.1.0/Faraway-0.1.0-ios-simulator.zip) — iOS 模拟器 App，需要 macOS + Xcode。
- [SHA256SUMS.txt](https://github.com/Phanstal/Faraway/releases/download/v0.1.0/SHA256SUMS.txt) — 校验和。

## 验证情况

- CI：[run 41163996500](https://github.com/Phanstal/Faraway/actions/runs/41163996500)，Web / Android / iOS 三个 job 全部成功。
- Web：lint、格式、类型检查、15 项单元测试、5 项移动端 E2E 全部通过。
- Android：API 33 x86_64 模拟器完成安装、启动、通知权限弹窗、20 分钟专注结束、后台恢复、20 秒休息、完整循环、暂停后杀进程恢复、返回键和 Insights 验证；发布 APK 再次安装并启动成功，APK 为 debug 签名。
- iOS：GitHub Actions macOS 14 runner 上构建模拟器 App、安装、启动并截图；设备目标由 release workflow 构建未签名 IPA。本地环境为 Windows，无法在真机上运行验证；真机安装需要用户自己的 Apple 签名。
- 发布文件：APK、IPA、模拟器 zip 与 SHA256SUMS.txt 已上传；下载后重新计算 SHA-256，与清单一致。

## 已知限制

- 暂无云同步、账号、导出/导入；数据只在本机。
- Android 本地通知使用非精确闹钟（系统未授予精确闹钟权限时可能略有延迟）。
- Android APK 未使用 release keystore 签名，不适合直接上架 Google Play。
- iOS 没有 Apple Developer 证书，因此只发布未签名 IPA 与模拟器包。
- iOS 真机安装与运行需要用户自行签名；签名有效期取决于 Apple ID 类型。

## 校验

```bash
sha256sum -c SHA256SUMS.txt
```

或在 Windows PowerShell 中：

```powershell
Get-FileHash .\Faraway-0.1.0-android-debug.apk -Algorithm SHA256
```
