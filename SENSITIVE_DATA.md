# 敏感数据清理功能

这个扩展现在支持在提交会话记录到 Git 之前自动清理敏感信息（如 API Key），让您可以安全地在不同机器或用户之间同步会话记录。

## 功能特性

### 1. 自动清理（推荐）

#### 方式一：初始化时自动配置

当您第一次初始化扩展时，Git filter 会自动配置：

```bash
# 在 VSCode 命令面板中运行
Claude Code Chats Sync: Initialize Claude Code Chats Sync
```

初始化命令会：
- 创建会话记录文件夹
- 创建符号链接到 Claude Code 项目目录
- **自动配置 Git filter**（无需手动操作）
- 自动配置 `.gitattributes` 文件

#### 方式二：手动配置 Filter

如果您想单独配置 Git filter：

```bash
# 在 VSCode 命令面板中运行
Claude Code Chats Sync: Setup Git Filter for Auto-Cleaning
```

Git Filter 功能会：
- 创建一个 Git clean filter 脚本
- 配置 `.gitattributes` 文件
- 自动在提交时清理所有 API keys
- 原始文件保持不变，只有 Git 仓库中的版本被清理

### 2. 手动清理

如果您想一次性清理所有会话文件：

```bash
# 在 VSCode 命令面板中运行
Claude Code Chats Sync: Clean Sensitive Data from Session Files
```

⚠️ **注意**：这个操作会直接修改会话文件，建议先备份。

## 工作原理

### 清理的内容

扩展会清理以下敏感信息：
- **Anthropic API Keys**: `sk-ant-...` 格式的 API keys
- **其他 API Keys**: `apiKey`、`api_key`、`authorization`、`token`、`bearer` 字段

### 清理方式

所有被清理的内容会被替换为 `[REDACTED]`，保留 JSON 结构和会话内容的完整性。

### 示例

**清理前：**
```json
{
  "primaryApiKey": "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "customApiKeyResponses": {
    "approved": ["xxxxxxxxxxxxxxxxxxxxxxxx"]
  }
}
```

**清理后：**
```json
{
  "primaryApiKey": "[REDACTED]",
  "customApiKeyResponses": {
    "approved": ["[REDACTED]"]
  }
}
```

## 使用场景

### 场景 1：团队协作

在团队中共享项目时，您希望同步会话记录但不泄露个人的 API keys：

1. 运行 `Setup Git Filter for Auto-Cleaning`
2. 正常提交代码到 Git
3. 团队成员拉取代码后，会话记录中的敏感信息已被清理

### 场景 2：多机器同步

在多台机器上使用不同的 API keys：

1. 在每台机器上运行 `Setup Git Filter for Auto-Cleaning`
2. 提交会话记录到 Git
3. 在其他机器上拉取，每台机器使用自己的 API keys

### 场景 3：公开仓库

想要公开项目代码和会话记录，但不泄露个人凭证：

1. 运行 `Setup Git Filter for Auto-Cleaning`
2. 提交到公开的 Git 仓库
3. 敏感信息已被自动清理

## 配置选项

在 `settings.json` 中可以配置：

```json
{
  "claudeCodeSync.historyFolderName": ".claudeCodeSessions",
  "claudeCodeSync.autoInitialize": true
}
```

## 技术细节

### Git Filter 工作流程

1. **Clean** (提交时): 文件通过 clean filter，敏感信息被替换为 `[REDACTED]`
2. **Commit**: 清理后的内容被提交到 Git 仓库
3. **Smudge** (检出时): 文件从 Git 检出时保持清理状态

### 生成的文件

```
project/
├── .gitfilters/
│   └── clean-sessions.js         # Filter 脚本（提交到仓库）
├── .gitattributes                # Git 属性配置（提交到仓库）
├── .gitconfig                    # Git filter 配置（提交到仓库）
├── .gitignore                    # 默认注释掉会话文件夹
└── .claudeCodeSessions/          # 会话记录文件夹
```

**重要说明：**
- `.gitfilters/`、`.gitattributes`、`.gitconfig` 会被提交到 Git 仓库
- 其他用户克隆项目后，Git filter 会自动生效
- 无需在每个用户的机器上单独配置

### .gitignore 配置

初始化时，`.gitignore` 会添加以下内容（默认注释掉）：

```gitignore
# Claude Code conversation history
# Uncomment the line below to ignore session files, OR configure Git filter for safe sharing
# .claudeCodeSessions/
```

**两种使用方式：**

1. **使用 Git Filter（推荐）**：保持注释，配置 Git filter 自动清理敏感信息
2. **完全忽略**：取消注释，将会话文件排除在 Git 之外

### .gitattributes 配置

```gitattributes
# Claude Code sessions - clean sensitive data on commit
.claudeCodeSessions/*.jsonl filter=claude-clean
```

### .gitconfig 配置

```ini
[filter "claude-clean"]
    clean = node \\.git/filters/clean-sessions.js
```

## 安全建议

1. **永远不要**在清理前将包含真实 API keys 的会话记录推送到公开仓库
2. 使用 `Setup Git Filter for Auto-Cleaning` 后，先在本地测试提交
3. 检查提交的内容确保敏感信息已被清理：`git diff --cached`
4. 定期审查已提交的历史，确保没有敏感信息泄露

## 故障排除

### Filter 没有生效

1. 确认 `.gitattributes` 文件存在且包含正确的配置
2. 检查 `.git/config` 中是否配置了 filter
3. 重新添加文件到暂存区：`git add .claudeCodeSessions/`
4. 检查暂存区内容：`git diff --cached`

### 已经提交了敏感信息

如果已经将包含敏感信息的会话记录提交到 Git：

1. 首先配置 Git filter
2. 使用 `git filter-branch` 或 `git filter-repo` 重写历史
3. 强制推送到远程仓库（⚠️ 谨慎操作）

## 开发和测试

查看 [test-clean.js](test-clean.js) 了解清理函数的测试方法。

## 许可证

MIT
