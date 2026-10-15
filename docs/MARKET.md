# 市场与发布状态

源码仓库：[Oliveryfaso/dsh-pet-company](https://github.com/Oliveryfaso/dsh-pet-company)。公开仓库、GitHub 安装、npm 发布与第三方市场收录分别进行；**本页不表示已经上架或发布 npm**。

## 目录收录

本机捆绑的 dshmarket 以 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 为目录来源。当前投稿为新增 `data/plugins/Oliveryfaso__dsh-pet-company.yml` 后提 PR；不编辑生成的目录 README。

```yaml
url: https://github.com/Oliveryfaso/dsh-pet-company
name: Oliveryfaso/dsh-pet-company
category: notify
description:
  en: 'Quiet break and water reminders through dsh-pet for DSH Web profiles.'
  zh: '通过 dsh-pet 提供安静的休息与喝水提醒，目前验证 Web profile。'
```

投稿前需有真实代码、有效 `dsh.bundle.patch` 和 patch 文件、`dsh-plugin` topic；**仓库创建必须满一天**。CI 通过后仍需维护者审阅。新仓库当天不能跳过该门槛；本项目目前只准备材料，不提交目录 PR。[收录规范](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)

## 安装来源与关联

无需 npm 也能从 GitHub 安装。若未来发布 npm，包的 `repository` 应指回本仓库，目录才会关联该包；不要在投稿 YAML 中自填 `npm:`。可选预构建 `tarball` 必须指向 GitHub Release 的 HTTPS `.tgz`；使用版本文件名时绑定固定标签。[分发规范](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md#npm-package--npm-包optional--可选)

添加 topic 只帮助发现，不自动完成目录投稿。[DSH 官方发现说明](https://github.com/deepseek-ai/deepseek-harness#community-and-support) 没有承诺自动上架。`repository` 字段也不代表某个市场账号已验证仓库所有权。

其他社区目录如 dshfind、DSH 1024Store 有各自规则；不能把一个目录收录当成所有市场都已收录，也不把第三方市场称为 DeepSeek 官方运营市场。

## 发布材料的边界

市场简介应注明已验证 Web profile 与原生 Desktop 主窗口的基础流程，并说明云朵/回弹依赖可选兼容补丁；透明 helper 的焦点、点击穿透和物理多屏尚未验收，不能宣称所有桌面场景完整可用。版本范围见 [兼容性记录](COMPATIBILITY.md)。

自有代码为 MIT；美术为 fywdy 的 CC BY-NC 4.0 非商用素材，不能填成全包 MIT。发布包应包含来源与许可，排除历史拒稿、用户参考截图、个人配置和运行日志。具体署名见 [第三方说明](../THIRD_PARTY_NOTICES.md)。
