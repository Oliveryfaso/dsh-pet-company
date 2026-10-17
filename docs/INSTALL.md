# 安装、升级与回退

## 当前候选的状态

0.2.0 实现了同包内置运行组件：角色、云朵、轻回弹和派生播放器均随插件分发。此前固定候选完成了 Desktop CLI 隔离安装、设置保存与停用恢复，以及 Web Profile 离线安装、升级、回退和移除检查；对应固定 SHA 与历史 CI 证据见下文，不能代表当前工作树验收。

候选源码已公开到 `feat/installable-runtime`；可试用的固定提交为 [`b78abd22073e87f028a3c9da8813f57f72b0e57d`](https://github.com/Oliveryfaso/dsh-pet-company/commit/b78abd22073e87f028a3c9da8813f57f72b0e57d)，其 [Node 22/24 CI](https://github.com/Oliveryfaso/dsh-pet-company/actions/runs/38861959396) 各通过 220 项回归。2026-10-16 已通过应用自带正式 CLI，在隔离 Desktop Profile 从公开固定 SHA 安装、更新到该提交并移除；两阶段锁文件来源和 16 个已安装文件均匹配对应 Git 提交。另从缓存正式重装该 SHA，完成 CLI Host 激活、三个 Host 依赖、HTTP 配置校验及三角色保存／恢复、view 和 idle 素材响应检查，再正式移除并恢复原配置字节。

该固定 SHA 的基础功能可供试用；本轮没有启动浏览器或 helper，没有把设置声明夹具当作真实 React/UI。三宠闪烁、点击缩放、云朵及日常观感留给用户试用反馈，不作为本轮基础交付前置条件。市场端到端和 Desktop 界面的完整升级回退仍未测；默认分支或旧公开 SHA 不代表取得本候选。原版 dsh-pet 共存、真实运行时下载及中断恢复等限制见 [兼容性记录](COMPATIBILITY.md)。

本轮仅在临时目录工作，没有修改 DSH.app、真实全局 Profile 或持久化下载运行时。

### 2026-10-17 当前工作树复验

`npm test` 221 项通过，`npm run check` 通过；当前运行环境为 Node 26。npm 打包 dry-run 通过，包保留安装所需运行文件和许可证，排除 `docs/qa/feedback` 与 `docs/qa/visual-stability` 验证素材。历史 Node 22/24 各 220 项结果仍只对应上文固定 SHA。

设置流程在浏览器中操作了当前构建的 `client.js` 面板，并连接临时 home 上的真实 `createRuntime`：角色、提醒开关和间隔、大小、位置、云朵均保存；非法间隔不会发配置写入；模拟存储失败会报错并保留草稿；重启本地 runtime 后设置恢复。另检查了宿主不可用提示、375px 视口无横向溢出。React 模块加载、DSH Host/RPC 为 stub，因此这不是实际 DSH Desktop 界面或真实宿主验收。

## DSH / dshmarket 安装入口

主交付目标是在 DeepSeek Harness 的 dshmarket 管理插件；本项目尚未完成目录收录，市场的一键安装路径仍待验收。在官方 Desktop 上，市场通过宿主插件管理服务操作 `desktop` Profile；该服务不可用时使用应用的「设置 → 插件」，不改用普通 npm CLI。当前固定 spec 已通过应用自带 CLI 的隔离安装验证，仍是开发候选；市场目录的来源选择和在线激活需另行验收：

```text
github:Oliveryfaso/dsh-pet-company#b78abd22073e87f028a3c9da8813f57f72b0e57d
```

以后更新需使用另一个已公开的真实 SHA；默认分支安装也不代表已经取得本候选。按应用提示完成安装、检查激活及需要重启的状态，重启当前 Profile 后核对实际版本。

新装默认内置模式、银白一只。在「设置 → 陪伴」选择视觉角色、展示位置、大小和外观。外部模式才需要同一 Profile 的 dsh-pet；切换模式不会修改其资源或接管其窗口。

普通 npm CLI 不能管理 Electron 保留的 `desktop` Profile。Desktop 应用内置 CLI 是不同的正式入口，且要求先由 Desktop 初始化 Profile，再完全退出应用后管理。不要手工伪造 Profile 来绕过此检查。

本轮固定 SHA 安装使用 `ignoreScripts=true`、`autoInstallPeers=false`。pnpm 报告 GitHub 依赖的构建脚本被忽略及 peer 依赖问题；包内预构建入口已核对存在并匹配对应源码，没有运行安装构建或补装宿主 peers。实际 CLI Host 已解析并满足三个 Host peer；React 与客户端 connection 属于前端层，不按 Host 入口的解析结果判断缺失。实际服务的 Client factory 与安装文件一致；「陪伴」设置声明通过无挂载组件/effect 的 slot 夹具检查，真实 React/UI 加载不在本次固定 SHA 验证范围。

## 独立运行时

内置桌面窗口需要官方 Electron **43.3.0 / darwin-arm64**；其他平台保持未验证状态，设置仍可打开。

- 缺少运行时不会自动下载或反复启动。明确点击下载并确认后，才从 Electron 官方发布获取并验证 SHA256。
- 缓存位于 `$DSH_HOME/dsh-pet-company/runtime/electron-cache/43.3.0-darwin-arm64/`；helper 数据位于 `$DSH_HOME/dsh-pet-company/runtime/user-data/`，与原版 dsh-pet 分开。
- 如已有正确版本的独立官方 Electron，可在根插件配置的 `runtimeExecutable` 指定绝对路径，结尾为 `Electron.app/Contents/MacOS/Electron`。不能指向 DSH Desktop.app。该项不写入 v2 外观设置，也不在「设置 → 陪伴」修改；更改后需重新加载插件或重启当前 Profile。
- 非空 `runtimeExecutable` 优先于私有缓存。若该路径无效，应修正或清空根配置再重新加载；下载缓存不会覆盖显式路径。
- 下载或启动失败时显示原因，需用户手动重试；已经保存的设置保留。本轮没有执行真实持久化下载，首用下载验收仍待完成。

不修改宿主安全设置，不拼接原生权限头，不启用额外文件访问。

## 从旧版升级

1. 在官方入口停用相关旧 company / `dsh-companion` 实例，并停止其 Profile 或进程；仅关闭主窗口不足以完成交接。
2. 安装新固定版本并重启，在「陪伴」页面显式确认旧实例已停止。
3. 旧目标 `main`、语气及提醒参数继续以外部模式载入。只有用户显式选择内置模式才创建内置角色窗口。

设置写入 `$DSH_HOME/dsh-pet-company/config.v2.json`。新文件不存在时只读读取旧 `dsh-pet-company/config.json`，再读取 `dsh-companion/config.json`；保存始终写 v2，不改旧文件。配置损坏时停止关怀并显示原因，不用旧配置掩盖故障。

同一 home 的 company 运行权通过独占锁保护；其他 Profile 显示只读，既不调度也不保存。异常退出遗留的锁不会自动夺取。先停止相关 Profile，再使用显式恢复入口核对 token 和原进程已退出；恢复不会向原 PID 发信号。并发恢复使用独立恢复锁，遗留恢复锁需人工核实，不能自动删除不明文件。

已有超过 256 个未解决等待会话时，观察器会保守地持续阻止关怀，直到插件重载；不会因历史淘汰而恢复插话。

## 更新、停用与卸载

更新到另一个真实 SHA 后，检查安装器报告并重启 Profile；重复同一 spec 或源码目录变化不能证明实际加载已更新。

「关闭自动提醒」仅停止关怀调度；不等于卸载桌面组件。需要关闭窗口时，将展示方式设为不显示，或在官方入口停用/移除 company。父插件清理会等待子进程退出和已接受的配置写入完成，再释放运行锁。

卸载默认保留 company 设置和私有缓存，也保留原版 dsh-pet 与手动导入的资源。旧 `dsh-companion` 是不同包名，需在原 Profile 单独停用，避免旧提醒器并行工作。

## 回退

先通过官方入口停用相关 company Profile，并确认其 helper 已退出，再安装先前存在的固定版本并重启。已知旧公开基线为 `45589d6b46e6264c04cfa2e0305ae0fdb51055e0`。

旧版自然读取未被改写的 v1 文件和原外部目标，不读取 v2；新 v2 文件继续保留。回退不会自动把新的关怀参数写回旧文件。需要携带新参数时，应先显式生成只含旧字段、以 `externalTarget` 为目标的兼容副本，备份 v1，再另行确认替换；当前提供的 `exportLegacyConfig()` 负责严格转换，尚无页面下载入口。

新装没有 v1 时，旧版恢复其基础默认行为，且需要原版 dsh-pet；不能承诺旧版继续具备内置组件功能。安装器的 manifest/lock 回滚不等于所有磁盘副作用自动回滚。

## 验收边界

单元回归、包清单、隔离 Desktop 本地包安装及上述生命周期子项已有证据；完整分发门禁的覆盖范围仍见 [兼容性记录](COMPATIBILITY.md)。原生透明、焦点、点击穿透、拖拽、物理多屏及完整连续观感分别记录。有限截图或解码 readiness 变化都不足以证明真实闪烁或零闪烁。
