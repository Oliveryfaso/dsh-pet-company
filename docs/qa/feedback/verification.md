# 独立反馈模块验证

- 21 / 21 纯状态和布局测试通过，见 `core-tests.tap` 与 `core-results.json`。
- 16 / 16 真实 DOM 检查通过，见 `browser-results.json`。覆盖同 ID 去重、fallback 文案升级、连点取消、关闭保持输入焦点、拖动、自动过期、边缘翻转、极短工作区、pop/cloud 开关、系统减少动态和销毁。
- 最终半椭圆云朵版本已重跑，并实际查看 `feedback-desktop.png`、`feedback-mobile.png`、`feedback-reduced.png`；三主题与关闭按钮完整，375px 页面无横向溢出，减少动态文案正常换行。
- 浏览器为已有 Chromium，headless、Chromium sandbox 开启；正式内存压力为 1，单个浏览器串行运行后关闭。脚本错误 0，外部网络请求 0。
- 演示只通过相对路径读取项目已有且已许可的角色预览，没有复制参考原图或图集。自有代码遵循 MIT，角色美术仍遵循 CC BY-NC 4.0。

范围：这是独立 DOM 模块验证，不是 DSH Web 或独立 Electron helper 接入验收。本次 deviceScaleFactor 为 1；负屏幕坐标由纯布局测试覆盖。真实 OS 焦点、跨屏/DPR 热变化和点击穿透仍需在临时 profile 接入后验证。上游 helper 的 focusable:true 可能产生 OS 点击激活，不能仅凭 DOM 焦点测试认定所有平台都不抢焦点。
