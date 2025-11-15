# VSCode 配置设置说明

本项目使用 `.erix.vscode` 目录作为 VSCode 配置文件的模板，这样每个开发者都可以有自己的 `.vscode` 目录，而不会影响到其他开发者。

## 设置步骤

1. **复制配置文件**
   ```bash
   # 在 Windows 上
   xcopy .erix.vscode\.vscode /E /I
   
   # 在 Linux/Mac 上
   cp -r .erix.vscode/.vscode .
   ```

2. **或者创建符号链接（推荐）**
   ```bash
   # 在 Windows 上（需要管理员权限）
   mklink /D .vscode .erix.vscode
   
   # 在 Linux/Mac 上
   ln -s .erix.vscode .vscode
   ```

## 配置文件说明

- `settings.json`: 包含编辑器设置、工作区配置等
- `launch.json`: 调试配置，包含多个调试选项
- `tasks.json`: 任务配置，包含启动服务器、安装依赖等任务
- `extensions.json`: 推荐扩展列表

## 注意事项

- `.vscode` 目录已经在 `.gitignore` 中，不会被提交到版本控制系统
- 如果需要修改配置，可以直接修改 `.vscode` 目录中的文件
- 如果想要分享配置修改，请同时更新 `.erix.vscode` 目录中的文件

## 优势

- 每个开发者可以有自己的个性化配置
- 不会因为配置差异导致版本控制冲突
- 新开发者可以快速获得推荐的配置
- 配置文件可以作为模板分享给团队