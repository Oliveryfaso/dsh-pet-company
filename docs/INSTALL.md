# 安装、升级与卸载

当前版本：**0.2.0**（发布候选，等待 dshmarket 目录合并）。实测宿主：DSH 0.2.0-rc.2 / DSH Desktop 2.0.17，macOS arm64。

## 先看适用范围

`dsh-pet-company` 是 DSH 插件：内置模式随包提供三套角色、云朵、轻回弹和派生播放器，不要求手工替换原版 dsh-pet；外部模式只向同 Profile 的原版 dsh-pet 发送基础关怀。

- **DSH 页面内**显示不需要独立 Electron，设置保存后即可使用。
- **桌面窗口**需要 macOS arm64 与官方 Electron 43.3.0，首次明确同意后下载。
- Windows、Linux 与 Web 移动端未验证，不宣称可用。

安装不需要构建美术、不需要安装 npm 依赖，也不会自动修改 dsh-pet 或 DSH.app。

## 安装

### 方式一：dshmarket（推荐，目录合并后可用）

1. 打开 DSH Desktop 2.0.17 或更高版本，进入 设置 → 插件市场（dshmarket）。
2. 搜索 `dsh-pet-company`，打开详情，确认来源为 `github.com/Oliveryfaso/dsh-pet-company`。
3. 点击安装并按提示重启当前 Profile。
4. 在 设置 → 陪伴 确认状态。

目录收录正在审核；合并前市场搜不到时用方式二。市场安装走宿主插件管理服务，不需要普通 npm CLI，也不会改写你的全局依赖。

### 方式二：GitHub Release tarball

在安装了 `dsh` CLI 的机器上（Web profile 或自定义 profile）：

```sh
dsh plugin --profile <你的 Profile> add https://github.com/Oliveryfaso/dsh-pet-company/releases/download/v0.2.0/dsh-pet-company-0.2.0.tgz
dsh --profile <你的 Profile>
```

Desktop 用户请在应用自己的「设置 → 插件」入口填写同一个 tarball 地址。**普通 npm CLI 不能管理 Desktop 保留的 `desktop` Profile**，请使用应用内置入口；不要手工伪造 Profile 绕过检查。

安装完成后重启当前 Profile，再打开 设置 → 陪伴。说明：

- 包内已含预构建 JavaScript、三套角色视频、第三方许可与 MIT 派生代码，无 prepare/postinstall 脚本。
- 宿主提供的 ``deepseek-ai/*` 包与 React 按 peerDependencies 解析，不需要你单独安装。
- 首次安装可能看到 pnpm 的 peer 依赖提示；只要 Profile 能启动、设置页出现「陪伴」即属正常。

## 首次使用

1. 打开 设置 → 陪伴，等待状态变成「桌宠已连接」；默认是内置模式、银白一只。
2. 选择「显示位置」：
   - **DSH 页面内**：立即在页面右下角显示，不需要下载。
   - **桌面窗口**：点击提示里的「下载独立 Electron」，确认后从 Electron 官方发布下载 43.3.0 并校验 SHA256；下载完成后自动启动。
   - **暂不显示**：只保留关怀调度与设置。
3. 选择角色、大小、停靠角落、边距和云朵时长，保存。
4. 点击宠物或点「试说一句（会显示气泡）」检查真实气泡；「试说一句」每分钟最多一次。
5. 外部模式：先在同一个 Profile 安装并启用 [dsh-pet](https://github.com/PC2005-cloud/dsh-pet)，再把「陪伴模式」切换为「外部 dsh-pet（基础关怀）」，填写目标宠物 ID（默认 `main`）。

新装默认「桌面窗口」。没有独立 Electron 时不会自动下载或反复启动，设置页会显示原因；先选「DSH 页面内」也可以完整使用提醒、云朵和点击反馈。

## 独立运行时（桌面窗口）

- 版本与平台：官方 **Electron 43.3.0 / darwin-arm64**；其他平台保持未验证。
- 下载来源：`github.com/electron/electron` 的正式 release；包内只接受 https、GitHub 主机与官方 SHA256 校验和。
- 缓存位置：`$DSH_HOME/dsh-pet-company/runtime/electron-cache/43.3.0-darwin-arm64/`；helper 用户数据：`$DSH_HOME/dsh-pet-company/runtime/user-data/`，与原版 dsh-pet 分开。
- 如已有正确版本的独立官方 Electron，可在根插件配置中设置 `runtimeExecutable` 为绝对路径（结尾为 `Electron.app/Contents/MacOS/Electron`）。不能指向 DSH Desktop.app。该项不在「陪伴」页面修改；改后需重新加载插件或重启 Profile。
- 非空 `runtimeExecutable` 优先于私有缓存；路径无效时请修正或清空后重新加载，缓存不会覆盖显式路径。
- 下载或启动失败会显示原因，需要手动重试；已保存的设置保留。**当前版本的真实网络下载与中断恢复尚未完整验收**，失败时先改用「DSH 页面内」。

不修改宿主安全设置，不拼接原生权限头，不启用额外文件访问。

## 设置与配置

- 设置写入 `$DSH_HOME/dsh-pet-company/config.v2.json`；同一 DSH home 的多个 Profile 共享该文件，但运行权只属于一个 Profile。
- 旧版 `dsh-pet-company/config.json` 与 `dsh-companion/config.json` 只在新文件不存在时作为只读来源；保存始终写 v2，不改旧文件。
- v2 文件损坏时停止关怀并显示实际路径，不覆盖、不回退到旧文件。修复或删除损坏文件后重启 Profile。
- 从旧 company / `dsh-companion` 升级：先在官方入口停用旧实例并停止其 Profile/进程，安装 0.2.0 后重启；旧目标与提醒参数以外部模式载入，需在「陪伴」里确认交接，再显式切换到内置模式。
- 异常退出可能留下运行锁：页面会显示只读与恢复入口。先停止相关 Profile，再点「原进程已退出，恢复占用锁」；恢复不会向任何 PID 发信号，遗留的未知锁文件请人工确认后处理，不要删除不明文件。

## 更新

- dshmarket：在「插件市场」里点更新；若提示需要重启，重启当前 Profile。
- 命令行：用新版本 tarball 重新执行 `dsh plugin --profile <Profile> add <新 tarball URL>`，然后重启 Profile。
- 更新后核对「设置 → 陪伴」中的版本行为与设置是否保留；仅修改源码目录不代表已加载。
- 同一 DSH home 只允许一个 company 运行拥有者；更新前先停用旧实例，避免两个 Profile 同时调度。

## 停用与卸载

- 只想安静一会儿：点「安静一小时」。
- 长期停止提醒：关闭「让它关心我」；需要隐藏角色时把「显示位置」设为「暂不显示」。
- 卸载：使用安装时的同一入口移除 `dsh-pet-company`。
  - Desktop：应用内插件管理入口。
  - Web/自定义 profile：```sh
dsh plugin --profile <你的 Profile> remove dsh-pet-company
```
- 卸载默认保留 `$DSH_HOME/dsh-pet-company/` 下的设置与运行时缓存，也保留原版 dsh-pet 与手动导入的角色资源。
- 若此前装过旧包 `dsh-companion`，它与新包是不同安装项，应在原 Profile 单独移除，避免两个提醒器并行。
- 移除后确认：设置里不再出现「陪伴」，`/dsh-pet-company/status` 返回 404，helper 与监听端口已释放。

## 回退

1. 先停用当前版本，确认 helper 与 Profile 进程已退出。
2. 安装较早的 release tarball（例如 v0.1.x 或下一个修复版）并重启。
3. 旧版不会读取 v2 设置；v2 文件与私有缓存保留，便于再次升级。
4. 若需要把新设置带回旧版，请先备份，再使用旧版支持的字段手工生成配置；不要直接覆盖 v1 文件。

安装器的 manifest/lock 回滚不等于所有磁盘副作用自动回滚；运行时缓存需要手动删除 `$DSH_HOME/dsh-pet-company/runtime/`。

## 故障排查

| 现象 | 检查 |
|---|---|
| 设置里没有「陪伴」 | 包是否安装到当前 Profile；是否重启；Profile 是否被其他层覆盖或停用 |
| 显示「等待桌宠」/「内置伴侣尚未就绪」 | 显示位置是否为「DSH 页面内」；桌面窗口是否已下载运行时；外部模式是否安装了 dsh-pet |
| 下载运行时失败 | 网络能否访问 GitHub；改用「DSH 页面内」；稍后手动重试 |
| 试说提示「刚说过话」 | 每分钟限一次，等待后重试 |
| 试说提示正在等待审批/提问 | 等当前审批或提问结束后再试 |
| 设置显示只读 | 同一 home 的其他 Profile 持有运行权；先停用旧 Profile 再恢复 |
| 配置损坏提示 | 修复或删除提示的 config.v2.json 后重启；不要用旧文件掩盖故障 |
| 卸载后设置仍在 | 默认行为：设置与缓存保留；需要彻底清理时手动删除 `$DSH_HOME/dsh-pet-company/` |

## 验收边界

本页描述的是 0.2.0 的安装契约。已验证范围、未验项与证据日期见 [兼容性记录](COMPATIBILITY.md)；市场目录收录状态见 [市场说明](MARKET.md)。单元测试、打包成功或 helper 单独运行都不能替代真实宿主安装验收。
