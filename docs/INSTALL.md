# 安装与卸载

## 先看适用范围

`dsh-pet-company` 是关怀插件，依赖同一 profile 中的 dsh-pet。Web profile 与原生 Desktop 主窗口已验证基础流程；透明 helper 的焦点、点击穿透和物理跨屏仍未完成验收。请先看 [兼容性状态](COMPATIBILITY.md)。

本项目交付可直接运行的 JavaScript 和预生成宠物视频，安装时不需要生成美术。不要为了本插件修改宿主安全设置。

## Desktop：使用应用自己的插件管理

1. 在 DSH Desktop 当前 profile 的插件管理入口安装 `dsh-pet`。
2. 在支持 GitHub 地址或安装 spec 的入口填写：

   ```text
   github:Oliveryfaso/dsh-pet-company
   ```

3. 按应用提示完成安装并重启当前 profile。打开「设置 → 陪伴」查看连接状态。

原生 Desktop 2.0.17 的主窗口已验证官方通信、设置保存和显式气泡。云朵/轻回弹另需仓库 compat/dsh-pet-0.3.7 中的可选补丁，安装本插件不会自动修改依赖。若显示宿主限制访问，请保留该设置并查看兼容性记录；不要开启额外访问权限或自行拼接原生权限头。

普通 npm 安装的 `dsh` CLI 不能管理 Electron 保留的 `desktop` profile。应用内置 CLI 与 npm CLI 的权限不同，所以不把 `dsh plugin --profile desktop ...` 作为通用安装命令。具体入口以所用 Desktop 版本提供的功能为准。

## Web：建议使用独立自定义 profile

以下 `pet-company-dev` 是示例名称；可换成你自己的、基于 Web 模板创建的 profile。已有合适 profile 时跳过第一步。

先从 Web 模板创建并启动一次，不自动打开浏览器：

```sh
dsh --profile pet-company-dev --from-default-profile web --no-open
```

完成初始化后按 `Ctrl+C` 停止该测试 profile，再安装到同一个 profile：

```sh
dsh plugin --profile pet-company-dev add dsh-pet@0.3.7
dsh plugin --profile pet-company-dev add github:Oliveryfaso/dsh-pet-company
```

默认地址安装的是当时仓库默认分支的内容。需要复现某个版本时，使用真实存在的标签或提交，例如 `github:Oliveryfaso/dsh-pet-company#<实际标签或提交 SHA>`；不要使用尚未发布的标签。

安装后启动：

```sh
dsh --profile pet-company-dev --no-open
```

使用终端显示的本机地址进入 DSH。「设置 → 陪伴」中先保留目标 `main`，选择「试说一句（会显示气泡）」检查连接。这个按钮会真实发送一句话；自动关怀只会在符合工作状态、频率与静默规则时发生。

更新插件后重启该 profile，不能把源码目录里的修改当成已经加载。

以上 profile 与 GitHub 安装语法依据 [DSH 官方打包指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md)。

## 导入三套角色

不想换角色时，可以继续使用已有桌宠，跳过此节。

将仓库 `pet/` 中三组配对的配置和动画目录，放入当前 DSH home 下的 `dsh-pet/pet/`：

```text
$DSH_HOME/dsh-pet/pet/
├── companion-silver-config.json
├── companion-silver-animation/
├── companion-orange-config.json
├── companion-orange-animation/
├── companion-tide-config.json
└── companion-tide-animation/
```

先确认正在使用的 DSH home，并检查是否有同名文件；不要覆盖已有宠物配置，也不要替换 `main-config.jsonc` 或 `main-animation/`。导入后重载 dsh-pet 配置或重启当前 profile，在「桌宠配置」中确认实例存在，再把「陪伴」的目标 ID 改为对应的 `companion-*`。

额外种类的目录规则来自 [dsh-pet 的 pet pack 说明](https://github.com/PC2005-cloud/dsh-pet#%EF%B8%8F-%E9%85%8D%E7%BD%AE%E5%A4%A7%E5%B0%8F--%E4%BD%8D%E7%BD%AE--%E5%A4%9A%E5%BC%80)。关怀插件不会自动复制或覆盖这些资源。

橙色默认待机采用用户选择的源 `review` 行，6 帧共 1030 ms；原 `idle` 以 `source-idle` 保留可查看。美术及派生动画仅限非商业用途，详见 [美术许可](../ASSET-LICENSE.md)。

## 卸载或暂时关闭

只想安静一会儿，使用「安静一小时」；长期停用自动提醒，在「设置 → 陪伴」关闭总开关。

Desktop 使用安装时的应用插件管理入口移除 `dsh-pet-company`。自定义 Web profile 使用：

```sh
dsh plugin --profile pet-company-dev remove dsh-pet-company
```

移除按包名进行，不按 GitHub 仓库名推断。若此前装过旧包 `dsh-companion`，它与新包是不同的安装项，应在原 profile 中单独移除旧包，避免同时运行两套提醒。

卸载不会连带卸载 dsh-pet，也不会自动删除你保存的陪伴设置或手动导入的角色。需要移除这三套角色时，只处理本节列出的三组配对文件，不要删除整个 `dsh-pet` 目录。

## 设置兼容

新版本将设置保存到 `$DSH_HOME/dsh-pet-company/config.json`，同一 home 的多个 profile 会共享它。新文件不存在时可只读载入旧 `dsh-companion/config.json`；之后的保存写入新位置，不修改旧文件。新文件损坏时不会回退覆盖，也不会用旧文件掩盖故障。
