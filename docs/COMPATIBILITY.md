# 兼容性与验证记录

本文件区分**当前版本实际验证过的范围**、**只能由代码/测试支持的结论**和**未验证事项**。验证日期与宿主版本一并记录；有限截图、单元测试或打包成功都不能替代真实宿主验收。

## 当前版本

- 版本：0.2.0（发布候选）
- 适配：DSH 0.2.0-rc.x（`engines.dsh: >=0.2.0-rc.1 <0.3.0-0`）
- 实测宿主：DSH 0.2.0-rc.2 / DSH Desktop 2.0.17（macOS 15 arm64）
- 自动化：`npm test` 222 项通过，`npm run check` 通过，`npm pack` 产物 135 个文件（约 22.2 MB）
- 市场状态：目录收录 PR 待提交/审核；市场内一键安装尚未验证

## 2026-10-18 隔离 Web Profile 真实宿主验收

环境：临时 `DSH_HOME`（不触碰日常 home/Profile），用 DSH Desktop 2.0.17 自带 `dsh` 0.2.0-rc.2 CLI 创建独立 Web profile，安装本地构建的 0.2.0 tarball，启动真实 DSH Web 服务（127.0.0.1 随机端口），用 Playwright 驱动真实浏览器操作。**这是真实 DSH 前端 + 真实插件 Host，不是组件夹具。**

| 检查 | 结果 | 观察 |
|---|---|---|
| 安装到新 Profile | 通过 | 官方 CLI `plugin add` 本地 tarball，pnpm 安装成功，profile bundles 增加 `dsh-pet-company` |
| 首次打开设置页 | 通过 | 真实「设置 → 陪伴」渲染；默认内置模式/银白/桌面窗口；运行时缺失提示与下载按钮存在，页面无崩溃 |
| 保存与持久化 | 通过 | 显示位置改为「DSH 页面内」并保存，`config.v2.json` 写入期望值；重启服务后角色、显示位置仍保留 |
| 页面内角色显示 | 通过 | 银白、橙书娘、蓝鲸女仆依次切换并真实渲染；隐藏视频 + Canvas 播放器出帧正常 |
| 点击反馈 | 通过 | 点击三宠均出现云朵气泡「我在呢～」与关闭按钮；角色播点击动作；采样帧未见橙色点击变扁 |
| 关怀气泡 | 通过 | 「试说一句」返回 200，目标宠物出现对应主题色云朵与台词；同一分钟内重复试说得到明确「刚说过话，稍等一分钟再试」限流提示，不误报成功 |
| 设置校验 | 通过 | 两次关心间隔改为 5 分钟时显示范围错误、保存按钮禁用、未发出 PUT；恢复后正常 |
| 外部模式降级 | 通过 | 切到外部模式且同一 Profile 未装 dsh-pet 时，状态变为「等待桌宠 / 需要先安装并启用 dsh-pet」，角色隐藏，设置仍可保存 |
| 配置损坏恢复 | 通过 | 手工破坏 `config.v2.json` 后重启：显示「陪伴配置无法读取」与真实路径，保存被拒绝并提示修复，原损坏文件未被覆盖；恢复备份后正常 |
| 安静一小时 | 通过 | 状态变为「暂时安静一会儿」，提示「好，这一小时安静陪你」 |
| 卸载 | 通过 | 官方 CLI `plugin remove` 后，bundle 与包文件移除；`/dsh-pet-company/status` 返回 404，「陪伴」设置分区消失；用户配置保留 |
| 启停清理 | 通过 | 停止服务约 2 秒退出，监听端口关闭，无残留 `dsh` Node 进程、owner.lock 或 helper；页面内模式未启动任何 Electron |
| 市场内一键安装 | 未验证 | 目录收录完成后补测；当前仅验证官方 CLI 安装 tarball 的同等路径 |

### 本轮未覆盖

- DSH Desktop 原生主窗口与透明 helper 的当前工作树复测（先前版本有独立 helper 证据，见下文）。
- 独立 Electron 的真实网络下载、缓存复用与中断恢复。
- 已安装原版 dsh-pet 时的外部模式实际投递（当前只验证了缺依赖降级与单元/接口测试）。
- 完整旧版本升级、回退与多 Profile 运行锁竞争的真实长流程。
- 连续肉眼观感、长期 CPU/GPU/内存、跨应用焦点、点击穿透、物理多屏/DPR。
- Windows、Linux、Safari、Web 移动端。

## 先前证据（不同日期，不能合并成本轮结论）

| 日期 | 范围 | 结论与边界 |
|---|---|---|
| 2026-10-15/16 | 正式 CLI 获取公开固定 SHA、更新与移除 | 隔离 Desktop/Web Profile；锁文件来源与 16 个安装文件逐字匹配；无 UI/helper；当时版本同为 0.2.0 候选 |
| 2026-10-16 | 固定 SHA 的 Host/HTTP 基础路径 | 真实 CLI Host 中 company active，Host peers 满足；status/非法配置/三角色保存/view 与素材响应通过；未加载真实 React/UI |
| 2026-10-17 | Desktop 本地包安装与设置生命周期 | 隔离 Desktop Profile 下 Host 与 helper 就绪；设置保存与磁盘一致；停用后 helper、锁、路由释放；不构成完整冷启动/升级验收 |
| 2026-10-17 | 派生 helper 三宠交互取样 | 每只两轮待机、可信点击、缩放/主题色/关闭采样；未见身体空帧或橙色变扁；取自独立取样工具，不等于完整桌面视觉通过；详见 [取样记录](qa/visual-stability/README.md) 与 [结果](qa/visual-stability/native-helper-results.json) |
| 2026-10-15 | 先期 Web 设置与气泡流程 | 0.1.0 时代的 renderer relay/设置面板/显式气泡；不等同 0.2.0 内置组件验收 |

历史 CI（Node 22/24）与本轮 Node 26 本地测试都通过；CI 只覆盖测试、语法与包清单，不启动 DSH。

## 播放器与视觉修复

旧播放器每轮重新加载 A/B 视频并以 180 ms 透明度交叉淡化，会出现中间透明度下降和迟到加载竞态；用户也观察到橙色角色点击时变扁（源 jumping 高度 113–125 px，正常 review 约 189–190 px）。

0.2.0 的处理：

- 两个隐藏视频解码 + 一个可见 Canvas2D 输出 + 离屏缓冲；新帧完整画入后才整帧替换，加载期间保留旧画面，失败不清空、不 resize。
- 橙色点击与关怀改用源 review 姿态的精确视频副本 `care`；原偏扁动作只保留在来源预览分类。
- 取消、重复事件、超时、切层、卸载都有清理与过期提交防护，由自动回归覆盖；真实连续观感仍由用户试用反馈为主。

**这些修复只由自动测试与本轮页面内采样支持。** 透明 helper 的连续人眼观感、长时运行和桌面合成效果未在本轮重新验收。

## 宿主兼容与配置边界

- `package.json` 声明 `engines.dsh` 与宿主 peer 范围；安装/启动会按声明拒绝不匹配的宿主。范围允许不代表所有版本已实测。
- 新装默认内置模式、银白、桌面窗口；Web profile 用户可切到「DSH 页面内」，不需要 Electron。
- 设置写 `$DSH_HOME/dsh-pet-company/config.v2.json`；旧配置文件只读迁移；损坏时不覆盖、不回退。
- 同一 DSH home 只有一个 company 运行拥有者；其他 Profile 只读，不调度、不写配置、不启动窗口/helper。
- 外部模式只调用原版 dsh-pet 已有的状态/气泡/动作接口，不共享其可写数据；原版外观能力（云朵/回弹）不保证存在。
- 不修改 DSH.app、宿主安全设置或其他 Profile；不开启额外文件/网络权限。

## 如何复验

```sh
npm test
npm run check
npm pack --dry-run --ignore-scripts --offline
```

真实宿主建议使用隔离 home：

```sh
export DSH_HOME=/tmp/dsh-pet-company-accept
dsh --profile accept --from-default-profile web --no-open   # 初始化后按 Ctrl+C
dsh plugin --profile accept add <tarball 或 github spec>
dsh --profile accept --no-open
```

然后按上面的验收表逐项检查；视觉观感、透明桌面窗口与多屏请以实机为准，不用自动化结果替代。
