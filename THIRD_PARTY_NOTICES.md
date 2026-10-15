# 第三方素材、署名与许可

## fywdy · AI 模型娘宠物包

本项目使用 **fywdy** 发布于 [fywdy/chatgpt-chibi-pets](https://github.com/fywdy/chatgpt-chibi-pets) 的三套素材，并适配为 DSH 的 dsh-pet 动画资源。

原作者署名：**Copyright (c) 2026 fywdy（AI 模型娘宠物包）**。

| 本项目角色 | 上游素材 ID | 上游名称 |
|---|---|---|
| 银白 / `companion-silver` | `chatgpt-white-dragon-chibi-v5` | ChatGPT 白发龙娘 Q 版 |
| 暖橘 / `companion-orange` | `claude-orange-scholar-chibi-v3` | Claude 橙书娘 Q 版 |
| 潮蓝 / `companion-tide` | `deepseek-whale-maid-chibi-v4` | DeepSeek 蓝鲸女仆 Q 版 |

以上三套来源已由用户选择。上游 ID 和名称仅为来源追溯与署名，插件名称仍为 `dsh-pet-company`。项目保留的原图位于 `assets/upstream/fywdy/<素材 ID>/spritesheet.webp`，原始 `pet.json` 同目录；四份上游声明与规格文档保留在 `assets/upstream/fywdy/` 根目录。

### 美术许可：CC BY-NC 4.0

上游图集、接触表、预览图采用 [Creative Commons Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/)，即 **CC BY-NC 4.0（署名—非商业性使用）**。本项目从这些图集提取的帧、生成的透明 WebM、角色预览以及其他派生美术继续保留该非商用许可、fywdy 署名、来源链接和修改说明。

**这些美术资产及其派生版本不得用于商业用途。代码部分的 MIT 许可不解除美术的非商用限制。** 本说明不授予任何第三方商标权，也不代表商业使用已获授权。许可全文保留于 [assets/upstream/fywdy/LICENSE](assets/upstream/fywdy/LICENSE)。

### 非官方同人声明

这些角色是上游标注的**非官方同人创作**。它们不是 OpenAI / ChatGPT、Anthropic / Claude 或 DeepSeek 的官方形象；本项目与这些公司、产品无关联，未获其授权、赞助或背书。品牌名称与商标归各自所有者所有，素材 ID 和名称中的品牌词用于识别来源，不构成商标许可或合作声明。

原作者说明素材由生成式图像工具产出，再经逐格人工筛选、拼接与修复。本项目不将其宣称为自行原创、原创手绘或官方素材。原始声明完整保留于 [assets/upstream/fywdy/NOTICE.md](assets/upstream/fywdy/NOTICE.md)。

如权利人对使用提出异议，应停止使用相关素材并联系上游仓库 Issues 处理；保留上游声明中的下架与联系说明不等于获得品牌授权。

### 本项目修改说明

适配目标为 **DSH / dsh-pet**，不是向其他宠物宿主安装。修改范围：

1. 从上游 `dist/codex-native/<素材 ID>/spritesheet.webp` 按状态行提取有效帧，保留原始图集供追溯。
2. 按源规格中的帧顺序与逐帧时长生成透明 VP9 WebM，供 dsh-pet 使用；不把所有帧统一改成等时长播放。
3. 将角色放入一致的输出画布，进行等比缩放与定位，并为 DSH 生成动画目录和宠物配置。
4. 用户已明确选择“使用正常比例阅读待机”。因此橙色角色默认待机采用源图集的 **`review` 行（第 8 行，0 起计数；列 0–5）**循环：6 帧时长依次为 **150、150、150、150、150、280 ms**，每轮 **1030 ms**。原始 `idle` 行仍以 **`source-idle`** 动作保留，供查看和来源比对，不覆盖原图。

橙发原始 jumping / failed 也存在明显偏扁造型。默认点击与关怀使用选定的 review 姿态（care 为该视频的字节副本），成功/失败联动改用 care / review；偏扁原动作保留在明确标注的原始预览分类，不再由这些自动路径触发。未拉伸或覆盖原图。

转换和缩放不改变来源与署名要求。源图集的命名和元数据保留为追溯材料；项目展示名与实例 ID 不表示独立创作了原角色。

### 脚本与 JSON：MIT 范围

fywdy 的脚本与 JSON 工具产物采用 MIT；原文见 [assets/upstream/fywdy/LICENSE-MIT](assets/upstream/fywdy/LICENSE-MIT)。复用或分发这些内容时保留原版权及许可声明。

**该 MIT 许可不覆盖 fywdy 的美术资产。** `dsh-pet-company` 自有源代码的许可由本项目单独的代码许可文件决定，本第三方说明不代替其授权；根目录如另有 MIT 代码许可，也不覆盖这里列出的第三方美术。

## 历史占位素材

先前的参数化 SVG / WebM 角色稿已被用户否定，不属于当前选定视觉方案。历史回滚目录为 `assets/history/rejected-parametric-2026-10-15/`，用于记录和回滚。该历史稿不得在 README、预览或宠物包中被表述为用户认可的正式美术。

本次 fywdy 素材许可不追溯改变历史稿或其他参考文件的许可。项目中原有参考图片、`ref-bluewhale/` 与实验文件应分别保留自己的来源信息，不能因放在同一目录就一并标为 MIT 或 CC BY-NC 4.0。

## dsh-pet 兼容补丁

`compat/dsh-pet-0.3.7/feedback.patch` 含 PC2005-cloud 的 dsh-pet 0.3.7 MIT 代码上下文与本项目修改。原始许可保留于 [UPSTREAM-LICENSE](compat/dsh-pet-0.3.7/UPSTREAM-LICENSE)。该目录不分发上游角色素材，也不自动修改用户依赖。

## 同包派生运行组件

`vendor/dsh-pet-0.3.7/player.js` 与 `work-status.ts` / 生成的 `work-status.js` 复用 PC2005-cloud/dsh-pet 0.3.7 的 MIT 代码。版权为 **Copyright (c) 2026 PC2005-cloud**，完整许可见 [vendor/dsh-pet-0.3.7/LICENSE](vendor/dsh-pet-0.3.7/LICENSE)。本项目修改播放器的循环、首帧提交及过期资源清理，并以独立命名的 company 模块组合；生成的 client/helper bundle 继续保留来源声明。

自有 helper IPC、生命周期和适配代码采用本项目 MIT。随包美术仍按上文 fywdy 的 CC BY-NC 4.0 单独授权；没有打包原版 dsh-pet 的默认美术、字体、提示词或表情图。独立 Electron 不随插件包分发，其官方运行时及第三方许可随官方下载保留。
