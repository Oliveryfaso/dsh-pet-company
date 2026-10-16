# 市场与发布状态

主交付目标是在 DeepSeek Harness 的 **dshmarket** 内安装和管理的标准 DSH 插件，继续兼容 DSH Desktop。独立 Electron helper 是插件的桌面显示组件；单独运行 helper 不代表市场安装、设置或卸载已验收。

源码仓库：[Oliveryfaso/dsh-pet-company](https://github.com/Oliveryfaso/dsh-pet-company)。公开仓库、GitHub 安装、npm 发布与第三方市场收录分别进行；**本页不表示已经上架或发布 npm**。当前内置组件候选位于 `feat/installable-runtime`，固定源码与已测范围见 [安装说明](INSTALL.md)；默认分支仍是旧外部模式版本，不能把目录链接指向仓库视为已经交付内置候选。

## 插件契约与宿主集成

包根的 `package.json` 声明 `dsh.bundle.patch: ./cordis.patch.yml`，补丁只插入一个 `dsh-pet-company` 根入口。Host 从 `src/index.js` 导出 `name`、`Config`、`inject`、`apply`，内部通过公开 `ctx.plugin()` 组合；Client 由 `dsh.client` 和预构建 `./client` export 提供，以同一包名注册 lazy-CJS factory，在 `settings.section` 注册「陪伴」设置页。声明了 Client 不能代替 bundle；这些入口随源码和归档一起交付。

运行依赖使用宿主提供的 `@deepseek-ai/*` peers 与 React：webserver/home-paths 为 `^0.2.0-rc.1`，client-connection 为 `^0.2.0-rc.2`；实际验证宿主为 DSH 0.2.0-rc.2 / Desktop 2.0.17。包内已有运行 JavaScript、三套资源与许可，无安装时构建脚本，也不包含 Electron 二进制。运行时的显式下载、路径优先级与平台范围见 [安装说明](INSTALL.md#独立运行时)。

dshmarket 在官方 Desktop 的 `desktop` Profile 上通过宿主 `pluginManager.installBundle()` / `removeBundle()` 进行包操作，不转为普通 npm CLI 修改该 Profile；常规 Web Profile 使用 DSH 自己的插件管理路径。安装结果还需区分已应用、需重启、被其他层覆盖和失败。停用后须释放插件的路由、计时与 helper；移除默认保留用户配置和私有缓存。现有本地包/生命周期子项证据不自动覆盖市场端到端路径。

契约依据：[DSH 插件形态](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md)、[官方 Client 模块与设置说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-settings-card.md)、[dshmarket 安装来源和管理路径](https://github.com/dsh-market/dsh-market)。本地核对使用捆绑的 dshmarket 1.66.5 和 DSH 0.2.0-rc.2 实现；官方主分支的新接口不能直接当作该版本已支持。

## 目录收录

本机捆绑的 dshmarket 以 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 为目录来源。当前投稿为新增 `data/plugins/Oliveryfaso__dsh-pet-company.yml` 后提 PR；不编辑生成的目录 README。

```yaml
url: https://github.com/Oliveryfaso/dsh-pet-company
name: Oliveryfaso/dsh-pet-company
category: notify
description:
  en: 'Quiet break and water reminders with three bundled companion characters for DeepSeek Harness.'
  zh: '为 DeepSeek Harness 提供三套内置陪伴形象和安静的休息、喝水提醒。'
```

以上是面向内置候选的投稿草稿，须待候选成为目录实际可取得的版本、相关安装门禁通过后才能使用。投稿前需有真实代码、有效 `dsh.bundle.patch` 和 patch 文件、`dsh-plugin` topic；**仓库创建必须满一天**。CI 通过后仍需维护者审阅。新仓库当天不能跳过该门槛；本项目目前只准备材料，不提交目录 PR。[收录规范](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)

## 安装来源与关联

无需 npm 也能从 GitHub 安装。若未来发布 npm，包的 `repository` 应指回本仓库，目录才会关联该包；不要在投稿 YAML 中自填 `npm:`。可选预构建 `tarball` 必须指向 GitHub Release 的 HTTPS `.tgz`；使用版本文件名时绑定固定标签。[分发规范](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md#npm-package--npm-包optional--可选)

dshmarket 的来源优先级是已关联的 npm 包、同仓库的有效 Release tarball、GitHub 源码。当前未发布 npm 或 Release tarball；只有仓库根 URL 的条目会生成不带开发分支的 `github:Oliveryfaso/dsh-pet-company`，落到默认分支。公开开发分支和目录收录均不能单独证明用户装到内置候选。

添加 topic 只帮助发现，不自动完成目录投稿。[DSH 官方发现说明](https://github.com/deepseek-ai/deepseek-harness#community-and-support) 没有承诺自动上架。`repository` 字段也不代表某个市场账号已验证仓库所有权。

其他社区目录如 dshfind、DSH 1024Store 有各自规则；不能把一个目录收录当成所有市场都已收录，也不把第三方市场称为 DeepSeek 官方运营市场。

## 发布材料的边界

0.2.0 内置模式的云朵、回弹和派生播放器已随 company 包分发，不能再要求用户替换原版 dsh-pet 的依赖文件。外部模式只提供原版 dsh-pet 的基础关怀。市场简介与详情可说明固定公开 SHA 的正式 CLI 获取、源码更新和移除已验证，但须注明市场实际安装与在线激活、完整 Desktop 升级回退和三宠连续视觉仍待验收；透明 helper 的焦点、点击穿透和物理多屏也尚未验收，不能宣称所有桌面场景完整可用。版本范围见 [兼容性记录](COMPATIBILITY.md)。

自有代码为 MIT；美术为 fywdy 的 CC BY-NC 4.0 非商用素材，不能填成全包 MIT。发布包应包含来源与许可，排除历史拒稿、用户参考截图、个人配置和运行日志。具体署名见 [第三方说明](../THIRD_PARTY_NOTICES.md)。
