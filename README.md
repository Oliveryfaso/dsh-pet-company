# dsh-pet-company

给 dsh-pet 加上几句关心：坐久了起来走走，水杯空了续一下，深夜了早点收工。默认安静，其余时间陪你慢慢写代码。

![银白龙娘、橙书娘与蓝鲸女仆三套 Q 版角色预览](assets/characters/preview.png)

美术来自 [fywdy](https://github.com/fywdy/chatgpt-chibi-pets)，为非官方同人，采用 **CC BY-NC 4.0：非商用，须署名**。橙色角色按用户选择使用正常比例的阅读动作待机。

**当前为开发版。已在 DSH Desktop 2.0.17 / DSH 0.2.0-rc.2 的隔离 Profile 验证官方通信、设置保存、显式关怀和云朵气泡；透明浮窗与跨屏等边界单独记录。** 最新范围见 [兼容性](docs/COMPATIBILITY.md)。 用户反馈后的播放器修复已做三宠顺序原生抽查，采样中未复现周期变淡或橙发变扁；源动画仍有分帧感，跨应用焦点、点击穿透和多屏等边界尚未完整验收；[取证与修复范围](docs/qa/visual-stability/README.md)。

## 它会做什么

- 久坐、喝水、连续工作与深夜提醒，分别可以关闭。
- 默认安静档每滚动小时最多一句；支持频率、静默时段和「安静一小时」。
- 审批、提问等待期间不插话，缺少 dsh-pet 或目标宠物时显示原因并保持安静。
- 「设置 → 陪伴」保存配置；「试说一句（会显示气泡）」可检查目标宠物。
- 可选 [dsh-pet 0.3.7 兼容补丁](compat/dsh-pet-0.3.7/) 提供三色云朵、轻回弹与原桌宠页的外观设置；安装本插件不会自动改写依赖。独立演示和验证见 [反馈模块](compat/dsh-pet-feedback/)。

本插件负责关怀调度，宠物窗口、动作播放、大小、位置、走动与余额显示仍由 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet) 负责。本插件不调用模型、不读取键盘输入，也不采集健康数据。

## 开始使用

先阅读 [安装与卸载](docs/INSTALL.md)：Desktop 通过应用自己的插件管理入口；已验证的 Web 路线可使用独立的自定义 profile。需要在同一 profile 安装并启用 dsh-pet。

三套角色素材位于 `pet/`，需单独导入 dsh-pet。安装关怀插件不会自动改写已有桌宠；也可以先对默认 `main` 宠物说话。

| 角色 | 目标宠物 ID | 默认待机 |
|---|---|---|
| 银白龙娘 | `companion-silver` | 源 idle |
| 橙书娘 | `companion-orange` | 源 review，1030 ms 循环 |
| 蓝鲸女仆 | `companion-tide` | 源 idle |

「角色」选择台词语气，「宠物 ID」选择说话目标，两者独立。

## 开发检查

开发检查需要 Node.js 22.13+（播放器源码回归使用 Node 内置的 TypeScript 类型擦除；运行插件的 JS 下限仍见 package.json）。核心与组件契约测试不需要安装 npm 依赖：

```sh
npm test
npm run check
npm pack --dry-run --ignore-scripts --offline
```

CI 检查测试、JavaScript 语法和包清单，不启动 DSH、不生成美术、不等同于 Desktop 验收。重新生成素材需要另外准备美术工具，日常运行使用已生成的视频。

## 许可与来源

自有插件代码、测试和构建工具采用 [MIT](CODE-LICENSE.md)。随包角色美术另受 CC BY-NC 4.0 的非商用限制，整个素材包不能按纯 MIT 使用；总范围见 [LICENSE](LICENSE)。

fywdy 的图集、派生透明动画与预览为 **CC BY-NC 4.0**；上游脚本和 JSON 的 MIT 许可不覆盖美术。角色并非任何品牌的官方形象，也未获得品牌授权、赞助或背书。本项目不宣称这些素材为自行原创手绘。

完整署名、来源与修改说明见 [第三方说明](THIRD_PARTY_NOTICES.md)、[美术许可](ASSET-LICENSE.md) 和 [上游资料](assets/upstream/README.md)。市场收录准备见 [市场说明](docs/MARKET.md)。
