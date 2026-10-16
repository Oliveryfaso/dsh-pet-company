# dsh-pet-company

安静一点的桌面陪伴：坐久了起来走走，水杯空了续一下，深夜了早点收工。

![银白龙娘、橙书娘与蓝鲸女仆三套 Q 版角色预览](assets/characters/preview.png)

**0.2.0 可按固定版本试用。源码已公开到 `feat/installable-runtime`；提交 `b78abd22073e87f028a3c9da8813f57f72b0e57d` 的 [Node 22/24 CI](https://github.com/Oliveryfaso/dsh-pet-company/actions/runs/38861959396) 各通过 220 项回归。正式 Desktop CLI 已在隔离 Profile 完成公开固定 SHA 安装、源码更新和移除；该产物的 CLI Host 激活、三个 Host 依赖及三角色 HTTP 配置保存／恢复、view 和素材响应也已通过。** 本地包设置生命周期子项另有证据；本次固定 SHA 未运行真实设置 UI 或 helper，实际观感留待试用反馈。市场端到端、完整 Desktop 升级回退仍未验收，见 [兼容性](docs/COMPATIBILITY.md)。

## 它会做什么

- 久坐、喝水、连续工作和深夜关怀，可分别关闭；默认安静档每滚动小时最多一句。
- 审批或提问等待期间保持安静；离线、运行组件缺失或目标切换时不积压关怀。
- 新装默认内置模式，仅一只银白；银白、暖橘、潮蓝可切换，语气与视觉角色独立。
- 内置模式随包提供三套视频、云朵、等比轻回弹及派生播放器，使用独立命名的 Electron helper。无需修改原版 dsh-pet 文件。
- 外部模式仍可连接同一 Profile 的原版 dsh-pet；已有 `main` 等目标保持外部模式，升级交接需先停止旧实例。
- 「设置 → 陪伴」管理关怀、角色、大小、位置及外观；「试说一句」会真实显示关怀。

本插件不调用模型、不读取键盘输入，也不采集健康数据。内置模式需要独立官方 Electron 43.3.0，目前仅验证目标为 Mac ARM64。缺少运行时时设置仍可用；只有明确点击并同意下载才会获取，不使用 DSH.app 代替。

## 安装、更新与回退

主交付目标是 DeepSeek Harness 的 dshmarket 插件，继续兼容 DSH Desktop。市场契约、收录草稿与待验范围见 [市场说明](docs/MARKET.md)，固定候选及升级回退见 [安装说明](docs/INSTALL.md)。当前尚未上架，市场端到端安装验收仍未完成；正式 CLI 的固定源码验证、helper 单独运行、打包或测试数量都不能替代市场验收。

同一 DSH home 的 company 组件只有一个运行拥有者，其他 Profile 只读。v2 设置与旧版文件分开保存；回退默认保留全部设置和旧资源。

| 角色 | 内置 ID | 默认待机 |
|---|---|---|
| 银白龙娘 | `companion-silver` | 源 idle |
| 橙书娘 | `companion-orange` | 源 review，1030 ms 循环 |
| 蓝鲸女仆 | `companion-tide` | 源 idle |

橙色点击与关怀使用选定的正常比例阅读动作；原始其他动作保留供来源预览。

## 开发检查

Node.js 22.13+，核心回归无需安装 npm 依赖：

```sh
npm test
npm run check
npm pack --dry-run --ignore-scripts --offline
```

`npm run build` 使用 Node 内置类型擦除生成派生 reducer 和 helper/client bundle。包内交付预构建 JavaScript 与视频，无 prepare/postinstall、无 Electron 二进制、无安装时依赖补丁。CI 不启动 DSH，也不等同于 Desktop 验收。

历史 [dsh-pet 0.3.7 补丁](compat/dsh-pet-0.3.7/) 作为兼容与取证材料保留；原版外部模式不具备内置组件的外观与播放器能力。

## 许可与来源

自有代码采用 [MIT](CODE-LICENSE.md)。派生播放器和工作状态 reducer 来自 PC2005-cloud/dsh-pet，保留 [上游 MIT 版权与许可](vendor/dsh-pet-0.3.7/LICENSE)。

三套美术来自 [fywdy/chatgpt-chibi-pets](https://github.com/fywdy/chatgpt-chibi-pets)，为非官方同人，采用 **CC BY-NC 4.0：非商用，须署名**。该限制继续覆盖派生透明视频与预览；整个含素材包不能按纯 MIT 使用。本项目不宣称素材为原创手绘或品牌官方形象。

完整范围见 [LICENSE](LICENSE)、[美术许可](ASSET-LICENSE.md)、[第三方说明](THIRD_PARTY_NOTICES.md) 和 [上游资料](assets/upstream/README.md)。
