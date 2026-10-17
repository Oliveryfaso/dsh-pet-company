# 市场与上架

主交付目标：作为标准 DSH 插件收录进 **dshmarket**（DeepSeek Harness 的插件市场应用，DSH Desktop 2.0.17 内置版本 1.66.5），并可从市场一键安装。

源码仓库：[Oliveryfaso/dsh-pet-company](https://github.com/Oliveryfaso/dsh-pet-company) · 当前版本：**0.2.0** · 状态：**发布材料已就绪，等待合并后的目录 PR 审核**。

> 本页记录投稿材料与验证边界，不代表已经上架。dshmarket 不是 DeepSeek 官方运营的商店，它是社区市场应用；目录数据的官方来源是 awesome-dsh-plugin。收录不等于官方背书，也不等于安全审计。

## 官方流程（2026-10 核对）

1. **DSH 侧只定义插件形态与安装机制**：组合包在 `package.json` 声明 `dsh.bundle.patch`，客户端 UI 另声明 ``dsh.client``。官方文档：[打包与安装插件](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md)。
2. **市场应用本身不收条目**：dsh-market README 明确写着「这个仓库是市场应用本身，不是插件目录……想让你的插件上架，请去 awesome-dsh-plugin 提 PR」：[dsh-market](https://github.com/dsh-market/dsh-market)。
3. **实际投稿**：向 [awesome-dsh-plugin/awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 提交一个 PR，只新增一个 `data/plugins/Oliveryfaso__dsh-pet-company.yml`；不要编辑生成的 README。规范：[contributing.md](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)。
4. **CI 之后仍需人工审阅**；CI 通过只是前置条件。近期已接受的同类 PR（如 #7702 单条目新增）可作为格式参照。
5. 合并后站点与 dshmarket 的目录数据自动重建（市场每次启动实时拉取 `awesome-dsh-plugin.com/plugins.json`），通常一天内生效。**提 PR 不等于已上架，以合并后的市场实际可安装为准。**

## 投稿条目（拟）

文件名：`data/plugins/Oliveryfaso__dsh-pet-company.yml`

```yaml
url: https://github.com/Oliveryfaso/dsh-pet-company
name: Oliveryfaso/dsh-pet-company
category: notify
tarball: https://github.com/Oliveryfaso/dsh-pet-company/releases/download/v0.2.0/dsh-pet-company-0.2.0.tgz
description:
  en: 'Quiet break, water, long-session and late-night reminders delivered by three bundled chibi companions, with cloud bubbles and a light bounce. Works in-page without extra downloads; the optional macOS desktop window uses a separately downloaded Electron helper.'
  zh: '用三套内置 Q 版角色提供久坐、喝水、连续工作与深夜关怀，带云朵气泡和轻回弹；页面内显示无需额外下载，可选 macOS 桌面窗口使用单独下载的 Electron 组件。'
```

分类说明：核心行为是关怀提醒与桌面陪伴反馈，选 `notify`；如果维护者认为更贴近 `ui`，按收录规则由维护者调整，不会因此打回。

## 收录要求核对

| 要求 | 本项目 |
|---|---|
| `package.json` 声明 `dsh.bundle.patch` 与同目录 `cordis.patch.yml` | 已具备：`dsh.bundle.patch: ./cordis.patch.yml`，patch 只插入一个 `dsh-pet-company` 行 |
| 真实可运行代码，非占位/空壳 | 有完整 Host、Client、设置面板、调度、三角色资源与测试 |
| 仓库创建满 1 天 | 2026-10-15 创建，已满足 |
| 活跃维护 | 当前发布版本 0.2.0，CI 通过 |
| `dsh-plugin` topic | **待添加**（发布前在仓库设置中添加） |
| 描述准确、不夸大 | 条目描述只写已实现能力；桌面窗口注明可选、需单独下载 |
| 官方 ``deepseek-ai/*` 包用 peerDependencies | 已使用 peerDependencies，且含明确预发布范围 |
| 预构建 tarball（可选，推荐） | 已计划：GitHub Release `v0.2.0` 资产，HTTPS、`.tgz`、绑定 tag、属主与条目一致，符合市场校验规则 |
| npm（可选） | 不发布 npm；市场从 Release tarball 安装 |
| 截图 | 仓库根 `screenshots.json` 声明 4 张真实截图/预览（1–8 张，相对路径，GitHub 托管） |

## 发布前门禁

- [ ] 最终代码通过 `npm test`、`npm run check`、`npm pack --dry-run` 与 Node 22/24 CI
- [ ] 隔离 Profile 真实宿主验收：安装、设置保存/重载、三角色、点击与试说云朵、外部缺失提示、配置损坏提示、卸载与进程/端口清理
- [ ] 默认分支合并到 0.2.0；Release `v0.2.0` 与 tarball 资产发布
- [ ] 添加 `dsh-plugin` topic
- [ ] 目录 PR 通过 CI 与维护者审阅
- [ ] 合并后在 dshmarket 中实际安装一次并确认版本

## 来源、许可与分发边界

- 自有代码 MIT；角色美术与派生视频 **CC BY-NC 4.0（署名、非商业性使用）**，不能把完整包统一标为 MIT。
- 免费发布在 GitHub 与插件目录属于非商业分发；若用于收费产品、付费分发、商业捆绑或商业推广，需要另行取得美术权利方授权或替换素材。当前发布方式与该限制不冲突。
- 角色为非官方同人，非任何品牌官方形象，也未获品牌授权或背书；署名、来源与修改说明见 [第三方说明](../THIRD_PARTY_NOTICES.md) 与 [美术许可](../ASSET-LICENSE.md)。
- 发布包排除历史拒稿、用户参考截图、个人配置、运行日志与 Electron 二进制；包含上游 MIT 许可与美术许可全文。

## 提交后跟进

1. 关注目录 PR 的 CI 与维护者评论，按意见修改同一分支。
2. 合并后等待站点/市场目录重建，安装一次确认来源、版本、设置页与三角色。
3. 若条目被拒：按评论修正描述、格式或材料后重提；不要同时向 dsh-market 仓库提交条目。
