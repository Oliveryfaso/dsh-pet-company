# dsh-pet 0.3.7 可选兼容补丁

本目录保存面向 `dsh-pet@0.3.7` 的源码补丁，**不会在安装 dsh-pet-company 时自动应用**。上游代码作者为 PC2005-cloud，采用 MIT；原文见 UPSTREAM-LICENSE。这里不分发上游角色素材或完整 fork 包。

补丁为三只宠物提供可选 `presentation:{theme,pop,cloud,closeSeconds}`，统一轻回弹与三色云朵，并在原「桌宠配置」页保存覆盖项。未启用 presentation 的其他宠物保留原表现。关怀的说话与动作共享 UUID，动画先到时只升级正文，不二次回弹、续时或重开。

在独立副本中先执行 `git apply --check feedback.patch`，确认是精确 0.3.7 基底后再应用。不要直接覆盖用户全局 node_modules 或 DSH.app。完整文件清单在 manifest.json。

安装分发包不带官方构建配置，单改 TS 源码不会更新运行时。配置与脚本来自上游 tag v0.3.7 的 dsh-pet/ 目录：
<https://github.com/PC2005-cloud/dsh-pet/tree/v0.3.7/dsh-pet>

已在经用户批准的临时副本中，使用 tsdown 0.8.0、rolldown 1.0.0-beta.7 与官方 tsdown.config.mjs，执行反馈 helper 构建、三个 bundle 入口及 build-desktop-core。没有运行安装脚本、prepare/prepack 链。运行时 JS 构建及语法检查通过；声明文件未重新生成，**不能视作完整类型检查或发布构建通过**。

兼容补丁的真实宿主验收范围随 docs/COMPATIBILITY.md 更新。独立浏览器演示见 ../dsh-pet-feedback/。透明 Electron helper、输入焦点和真实跨屏需分别验收，不能由独立演示推导。

## 播放器修复候选

用户实机发现周期性变淡后，补丁加入 opt-in 固定单待机原生循环、首个可提交视频帧后原子换层、严格源/请求代际校验，以及抢占、超时、卸载和失败后的旧动画恢复。工作状态的直接 ended/loop 更新也经过同一提交记录。源码回归位于项目 tests/helper-video.test.mjs 和 tests/web-video.test.mjs，四份最小测试输入位于 source/，其中 shared-core.js 是同一官方构建生成的运行产物，其余三份与补丁源码一致，原始上游 MIT 仍适用。

18 项 helper、20 项 Web 播放回归与原有反馈/设置检查已通过，官方构建完成。随后已在内存正常时进行三宠顺序原生窗口抽查，点击/显式关怀/返回待机可见，采样中未复现空帧或橙发变扁；详见 ../../docs/qa/visual-stability/native-helper-results.json。**有限截图不等于连续逐帧或长期流畅度证明，OS焦点、点击穿透、多屏及完整类型/发布门禁仍未通过。**
