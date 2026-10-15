# DSH 轻反馈模块与独立演示

自有代码采用项目 MIT 许可。宠物预览来自用户已选的 fywdy 美术，保持 CC BY-NC 4.0；本目录不复制参考原图或图集。

- `feedback-core.mjs`：独立状态、文字限长、去重、拖动及边缘布局。
- `feedback-dom.mjs` / `feedback.css`：专用 actor wrapper 上 220ms 的均匀轻回弹、三主题云朵。不要与宿主镜像或视频 transform 共用元素。
- `demo.template.html`：构建后位于 `docs/qa/feedback/demo.html`，图片相对引用已有 `assets/characters/{silver,orange,tide}.png`。

```sh
node scripts/build-feedback-demo.mjs
node --test tests/feedback-core.test.mjs
PLAYWRIGHT_MODULE=/path/to/existing/playwright node scripts/verify-feedback-browser.mjs
```

浏览器脚本只复用已有 Playwright，不安装依赖。macOS 正式内存压力必须为 1；脚本仅起一个后台 Chromium 并启用 Chromium sandbox，结束后关闭。无前台窗口、宿主启动或网络访问。

默认 8 秒关闭。相同事件 ID 不重播、不续时；新事件替换当前条目。动画先到的 fallback 可以升级为同 ID 真文案，仍不回弹或续时。关闭后同 ID 不重开。最近 64 个 ID 采用有界缓存，renderer 重建后清空。

文字只通过 textContent 写入，默认限 120 Unicode 码点。pop/cloud 可分别关闭，减少动态时不缩放，关闭按钮不自动转移输入焦点。dragStart 清泡；dragEnd 后 300ms 不把释放视为点击。进入后台不排队。

所有布局使用 CSS / DIP。工作区不足 96×112 时暂时隐藏云朵并释放交互区，恢复尺寸只使用原时限。Desktop 适配器应传入当前 helper 窗口与当前屏工作区的交集，并复用既有输入区域 IPC。

这些验证仅覆盖独立 DOM 模块。真实 DSH Web、独立 Desktop helper、OS 焦点、跨屏 DPI 与点击穿透必须另作接入验证。上游 Windows/Linux 主屏缩放变化仍有需重启限制。
