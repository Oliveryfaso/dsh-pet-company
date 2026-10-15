# 上游美术来源

这里保留 DSH `dsh-pet-company` 所选美术的来源、原始声明与适配依据。来源项目：[fywdy/chatgpt-chibi-pets](https://github.com/fywdy/chatgpt-chibi-pets)，作者 **fywdy**。

## 选用素材

| 本项目实例 | 上游 ID | 源文件（上游仓库相对路径） |
|---|---|---|
| `companion-silver` | `chatgpt-white-dragon-chibi-v5` | `dist/codex-native/chatgpt-white-dragon-chibi-v5/{pet.json,spritesheet.webp}` |
| `companion-orange` | `claude-orange-scholar-chibi-v3` | `dist/codex-native/claude-orange-scholar-chibi-v3/{pet.json,spritesheet.webp}` |
| `companion-tide` | `deepseek-whale-maid-chibi-v4` | `dist/codex-native/deepseek-whale-maid-chibi-v4/{pet.json,spritesheet.webp}` |

用户已选择以上三套角色，并已明确选择橙色角色“使用正常比例阅读待机”。橙色默认待机采用源 `review` 行（第 8 行，0 起计数，列 0–5）循环，6 帧时长为 150、150、150、150、150、280 ms，单轮 **1030 ms**；原 `idle` 以 **`source-idle`** 动作保留可查看。原始 ID、`pet.json` 的非官方声明与图集保留，不因 DSH 实例重命名而丢失来源。

本项目的原图保存位置为 `assets/upstream/fywdy/<素材 ID>/spritesheet.webp`，原始 `pet.json` 同目录。以下四份上游文档位于 `assets/upstream/fywdy/` 根目录，不放入单个角色目录。

## 保留的原始说明

- [fywdy/LICENSE](fywdy/LICENSE)：美术 **CC BY-NC 4.0** 全文，非商用。
- [fywdy/LICENSE-MIT](fywdy/LICENSE-MIT)：上游脚本及 JSON 工具产物的 MIT 许可，**不覆盖美术**。
- [fywdy/NOTICE.md](fywdy/NOTICE.md)：非官方同人、无品牌关联及来源生产方式声明。
- [fywdy/SPEC.md](fywdy/SPEC.md)：图集行序与逐帧时长的原始规格副本。

署名保留：**Copyright (c) 2026 fywdy（AI 模型娘宠物包）**。本项目不宣称这些角色为官方形象、用户或本项目的原创手绘，也不声称获得任何品牌的授权、赞助或背书。

## 本项目只消费图片规格

源目录中的 `codex-native` 是上游的历史格式名称。本项目只读取其中的图集与描述文件，按行抽帧、保留源时序、统一画布缩放并编码成透明 VP9 WebM，再由 **DSH 的 dsh-pet** 消费。

`SPEC.md` 中包含其他客户端的安装、CLI 和目录说明。它们是保留的上游文档，**不是本项目操作步骤**：本项目不会运行上游安装脚本、写入其他宿主的宠物目录，或把它当成 ChatGPT Pets 集成。

原始图集不应被转换输出覆盖。每份转换产物应能追溯到素材 ID、源状态行、有效列与逐帧时长；橙色默认待机按用户选择采用源 `review` 行，原待机另存 `source-idle`，这项映射须保留在适配记录中。许可与具体修改范围见 [../../THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md)。
