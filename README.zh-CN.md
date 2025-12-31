# Claude Code 会话同步

[![Version](https://img.shields.io/visual-studio-marketplace/v/tubo.claude-code-chats-sync)](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/tubo.claude-code-chats-sync)](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/tubo.claude-code-chats-sync)](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)
[![License](https://img.shields.io/github/license/tubo70/claude-code-sync-extension)](LICENSE)

一个 VSCode 扩展，将 Claude Code 的聊天会话同步到项目目录中，方便版本控制和跨机器共享。

## ⚠️ 重要提示：安全配置 API Keys

**强烈建议**：在使用本扩展前，通过环境变量配置 Claude Code 的 API key。这样可以完全避免 API key 被写入会话文件，是最安全的方式。

### 快速设置

**Linux/macOS** - 添加到 shell 配置文件（`~/.bashrc`、`~/.zshrc` 等）：
```bash
export ANTHROPIC_AUTH_TOKEN="sk-ant-..."
export ANTHROPIC_BASE_URL="https://api.example.com"  # 可选：用于第三方 API
```

**Windows** - 设置环境变量：

**临时设置（仅当前会话）**：
```powershell
# 命令提示符
set ANTHROPIC_AUTH_TOKEN=sk-ant-...
set ANTHROPIC_BASE_URL=https://api.example.com

# PowerShell
$env:ANTHROPIC_AUTH_TOKEN="sk-ant-..."
$env:ANTHROPIC_BASE_URL="https://api.example.com"
```

**永久设置（用户级）** - 以管理员身份运行命令提示符：
```cmd
setx ANTHROPIC_AUTH_TOKEN "sk-ant-..."
setx ANTHROPIC_BASE_URL "https://api.example.com"
```

**永久设置（系统级）** - 以管理员身份运行命令提示符：
```cmd
setx ANTHROPIC_AUTH_TOKEN "sk-ant-..." /M
setx ANTHROPIC_BASE_URL "https://api.example.com" /M
```

**图形界面方法**：
1. 按 `Win + R`，输入 `sysdm.cpl`，回车
2. 进入"高级"选项卡
3. 点击"环境变量"
4. 在"用户变量"（当前用户）或"系统变量"（所有用户）中添加
5. 重启 VSCode 使更改生效

**为什么这很重要**：会话文件存储了完整的对话历史，包括配置中的 API keys。使用环境变量可以让你的凭据更安全，避免被版本控制追踪。

## 功能特性

- 🔄 **自动同步**：自动从 Claude Code 本地存储创建符号链接到项目文件夹
- 📁 **项目本地历史**：聊天会话存储在项目中，而不是用户主目录
- 🔒 **敏感数据保护**：在提交到 Git 前自动清理 API keys
- 🎯 **一键设置**：单个命令即可初始化同步
- 📊 **状态跟踪**：在状态栏显示同步状态和会话数量
- 🌳 **Git 友好**：配置 Git 过滤器以安全地进行版本控制
- 🔧 **跨平台**：支持 Windows、macOS 和 Linux

## 工作原理

Claude Code 将聊天会话存储在 `~/.claude/projects/{normalized-project-path}/` 中。本扩展创建一个指向项目文件夹的符号链接（默认：`.claudeCodeSessions/`），使聊天历史成为项目的一部分。

### 示例

```
Your Project/
├── src/
├── .claudeCodeSessions/      # 聊天会话（与 ~/.claude 同步）
│   ├── session-abc123.jsonl
│   └── session-def456.jsonl
├── .gitignore               # 自动更新以忽略 .claudeCodeSessions/
└── package.json
```

## 安装

### 从 VSCode Marketplace 安装

1. 打开 VSCode
2. 进入扩展（Ctrl+Shift+X）
3. 搜索"Claude Code Chats Sync"
4. 点击安装

[Marketplace 链接](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)

### 从源码安装

1. 克隆此仓库
2. 安装依赖：
   ```bash
   npm install
   ```
3. 编译 TypeScript：
   ```bash
   npm run compile
   ```
4. 在 VSCode 中按 F5 启动扩展开发模式

## 使用方法

### 初始设置

1. 在 VSCode 中打开项目
2. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
3. 运行：`Claude Code Chats Sync: Initialize Claude Code Chats Sync`
4. 扩展将：
   - 在项目中创建 `.claudeCodeSessions/` 文件夹
   - 在 `~/.claude/projects/` 中创建符号链接
   - 配置 Git 过滤器以自动清理敏感数据
   - 将 `.claudeCodeSessions/` 添加到 `.gitignore`（默认被注释）

**注意**：如果你已有此项目的 Claude Code 会话历史，系统会提示你将其迁移到项目文件夹。

### 命令

- **初始化 Claude Code 会话同步**：设置符号链接并配置 Git 过滤器以安全共享
- **打开 Claude Code 历史文件夹**：在文件管理器中打开历史文件夹
- **检查 Claude Code 会话同步状态**：显示同步状态和会话数量
- **设置自动清理的 Git 过滤器**：配置 Git 在提交时自动移除 API keys
- **清理会话文件中的敏感数据**：手动清理所有会话文件中的 API keys

### 状态栏

扩展在状态栏中显示：
- ✅ `Claude Code (N)` - 同步已激活，有 N 个会话
- ❌ `Claude Code` - 未初始化（点击设置）

## 配置

可以在 VSCode 设置中配置扩展：

```json
{
  "claudeCodeSync.historyFolderName": ".claudeCodeSessions",
  "claudeCodeSync.autoInitialize": true
}
```

- `historyFolderName`：存储对话历史的文件夹名称（默认：`".claudeCodeSessions"`）
- `autoInitialize`：打开新工作区时提示初始化（默认：`true`）

## 💰 Token 使用与成本考虑

> ⚠️ **重要提示**：在团队成员间共享会话文件时，每个成员使用自己的 API key 并承担自己的 API 成本。

### 共享会话时的 Token 计费原理

当你从 Git 拉取共享的会话文件并继续对话时：

1. **每个成员支付自己的使用费用**
   - 每个团队成员必须配置自己的 API key
   - 当你继续共享的对话时，**你需要为所有新生成的 tokens 付费**
   - 原始创建者的 API key **不会被使用**（除非你明确配置了相同的 key）

2. **上下文窗口考虑**
   - Claude Code 会从共享会话中加载**完整的对话历史**
   - 较长的共享对话会消耗更多 tokens 作为上下文
   - **示例**：一个包含 50,000 tokens 的共享对话，每次新成员继续它时都会消耗约 50,000 个输入 tokens

3. **不会重复计费**
   - 历史消息**不会被重新处理**或重新计费
   - 只有新消息和完整的上下文（包括历史）会被发送到 API
   - 你需要为输入上下文 + 新消息付费，而不是重新运行整个对话

### 节省成本的最佳实践

1. **共享前生成对话摘要** ⭐ **推荐**

   在提交会话文件到 Git 之前，让 Claude Code 生成对话摘要。这样其他团队成员可以在不加载完整对话历史的情况下了解上下文。

   **在有价值对话结束时使用的推荐提示词**：

   ```
   请提供一个可以与团队分享的结构化对话摘要。包括：
   1. 主要主题：我们讨论/实现了什么
   2. 关键决策：做出的重要选择及原因
   3. 代码变更：修改的文件及每个变更的目的
   4. 技术细节：架构模式、方法或考虑因素
   5. 未解决的问题：未解答的问题、待办事项或需要进一步工作的领域
   6. 继续工作的上下文：某人继续此工作所需的简要上下文

   请以易于复制和分享的格式整理摘要。
   ```

   **如何使用摘要**：
   - 摘要将包含在会话文件末尾（对拉取更改的团队成员可见）
   - 团队成员可以在 VSCode 中打开会话文件并阅读末尾的摘要
   - 他们可以复制摘要并使用该上下文开始新的对话
   - 无需编辑提交消息 - 摘要随会话文件一起传播

   **工作流程示例**：

   ```
   # 1. 在对话结束时使用摘要提示词
   # 2. Claude Code 生成摘要并将其添加到会话中
   # 3. 正常提交会话文件
   git add .claudeCodeSessions/
   git commit -m "添加 JWT 认证实现会话"

   # 4. 其他团队成员拉取后可以：
   #    - 打开 .claudeCodeSessions/session-abc123.jsonl
   #    - 阅读末尾的摘要
   #    - 使用摘要作为上下文开始新对话
   ```

   **为什么能节省成本**：团队成员可以阅读会话文件末尾约 500 tokens 的摘要，而不是加载 50,000+ tokens 的对话历史，然后使用该上下文开始新对话。

2. **尽可能开始新对话**
   - 对于新问题或任务，重新开始而不是继续长共享会话
   - 使用对话摘要为 Claude Code 提供上下文
   - 示例："从共享会话继续 JWT 认证工作。我们实现了刷新令牌轮换。现在我需要添加令牌黑名单。"
   - 这能显著最小化上下文窗口使用

3. **归档旧会话**
   - 将已完成的对话移动到单独的归档文件夹
   - 仅在 `.claudeCodeSessions/` 中保留活跃/相关的会话

4. **使用分支进行实验性工作**
   - 为实验性对话创建功能分支
   - 仅将有价值的讨论合并到主分支

5. **监控使用情况**
   - 定期检查 Claude API 仪表板
   - 注意继续长对话会因上下文大小而花费更多

### 场景示例

```
团队成员 A 创建对话（花费 $1 的 tokens）
团队成员 B 拉取会话并继续
  -> B 需支付：50,000 tokens（上下文）+ 新消息
团队成员 C 拉取并继续
  -> C 需支付：55,000 tokens（上下文）+ 新消息
```

每个团队成员使用自己的 API key 和自己的账单，成本根据他们加入时的对话长度而扩展。

## 版本控制

> ⚠️ **安全警告**：在将 `.claudeCodeSessions/` 添加到 Git 之前，请注意会话文件可能包含敏感信息，包括：
> - API keys 和认证令牌
> - 专有代码和业务逻辑
> - 私人对话和内部讨论
> - 系统路径和环境详情
>
> 虽然本扩展提供了清理 API keys 的工具，**但没有任何自动清理是 100% 完整的**。只有在你完全理解并接受安全风险时才提交这些文件。最安全的方法是将 `.claudeCodeSessions/` 保留在 `.gitignore` 中。

扩展自动配置 Git 过滤器，在提交聊天会话时保护敏感信息。

### API Key 配置选项

**选项 1：使用环境变量（推荐）**

配置 Claude Code 从环境变量使用 API keys，防止它们出现在会话文件中：

```bash
# Linux/macOS
export ANTHROPIC_AUTH_TOKEN="sk-ant-..."
export ANTHROPIC_BASE_URL="https://api.example.com"  # 可选：用于第三方 API

# Windows
set ANTHROPIC_AUTH_TOKEN=sk-ant-...
set ANTHROPIC_BASE_URL=https://api.example.com
```

这是最安全的方法，因为 API keys 不会触及你的会话文件。如果你使用第三方 API 端点，请设置 `ANTHROPIC_BASE_URL`。

**选项 2：使用 Git 过滤器**

如果你在配置文件中存储 API keys，扩展的 Git 过滤器会在提交时自动清理它们。

### 自动敏感数据保护

初始化扩展时，它会自动设置 Git 过滤器，该过滤器会：
- ✅ 在提交前从会话文件中移除 API keys
- ✅ 保留对话结构和内容
- ✅ 保持原始文件不变（仅清理已提交的版本）

### 工作原理

```bash
# 初始化后，正常提交即可
git add .claudeCodeSessions/
git commit -m "添加对话历史"

# API keys 自动替换为 [REDACTED]
# 你的本地文件保持不变
```

### 手动配置

如果你想手动设置 Git 过滤器：

1. 运行：`Claude Code Chats Sync: Setup Git Filter for Auto-Cleaning`
2. 或手动清理文件：`Claude Code Chats Sync: Clean Sensitive Data from Session Files`

### 完全 Git 忽略

**推荐**：完全忽略会话文件以避免泄露敏感信息的任何风险。在 `.gitignore` 中取消此行的注释：

```gitignore
.claudeCodeSessions/
```

这可以防止意外将 API keys、专有代码、私人对话或其他敏感数据提交到仓库。

### 跨机器同步

> ⚠️ **警告**：在提交会话文件到 Git 之前，请查看上面的安全警告。

如果你选择继续进行同步：

1. 提交 `.claudeCodeSessions/` 文件夹（如果你想同步它）
2. 推送到 GitHub
3. 在另一台机器上拉取
4. 运行 `Claude Code Chats Sync: Initialize` 创建符号链接

> 📖 **详细文档**：有关敏感数据保护和 Git 过滤器配置的更多信息，请参阅 [SENSITIVE_DATA.md](SENSITIVE_DATA.md)。

## 故障排除

### 符号链接创建失败（Windows）

Windows 需要管理员权限或开发者模式才能创建符号链接。本扩展使用"junction"点，无需特殊权限即可工作。

### 历史记录未同步

1. 检查符号链接是否存在：
   - Windows: `dir %USERPROFILE%\.claude\projects`
   - macOS/Linux: `ls -la ~/.claude/projects`

2. 验证符号链接是否指向项目的 `.claudeCodeSessions/` 文件夹

3. 检查 VSCode 输出中的错误消息

### 已初始化

如果在使用本扩展之前你有现有的 Claude Code 会话历史，初始化命令将自动迁移它：

**迁移期间发生的事情**：
1. 检测 `~/.claude/projects/{your-project}/` 中的现有会话文件
2. 系统会提示你将它们移动到项目的 `.claudeCodeSessions/` 文件夹
3. 如果确认，文件将被移动并在其位置创建符号链接
4. 你现有的对话历史得到保留，现在成为项目的一部分

**重新初始化**：
1. 删除符号链接：
   ```bash
   # Windows
   rmdir "%USERPROFILE%\.claude\projects\{project-name}"

   # macOS/Linux
   rm ~/.claude/projects/{project-name}
   ```

2. 再次运行初始化命令

## 开发

### 构建

```bash
npm install
npm run compile
```

### 监视更改

```bash
npm run watch
```

### 调试

在 VSCode 中按 F5 启动新 VSCode 窗口（扩展开发主机）中的扩展。

## 许可证

MIT - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎贡献！请提交 issue 或拉取请求。

## 致谢

创建是为了解决跨机器和项目同步 Claude Code 对话历史的问题。

## 链接

- [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)
- [GitHub 仓库](https://github.com/tubo70/claude-code-sync-extension)
- [问题跟踪](https://github.com/tubo70/claude-code-sync-extension/issues)
- [更新日志](CHANGELOG.md)
