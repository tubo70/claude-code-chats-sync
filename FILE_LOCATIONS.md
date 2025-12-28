# Git Filter 文件位置说明

## 当前设计

### 生成的文件位置
```
project/
├── .gitfilters/
│   └── clean-sessions.js      ✅ 提交到仓库
├── .gitattributes             ✅ 提交到仓库
├── .gitconfig                 ✅ 提交到仓库
└── .claudeCodeSessions/       ⚠️  由用户决定是否提交
```

### 重要说明

**`.gitconfig` 的限制：**
- 虽然文件会被提交到仓库
- 但 Git **不会自动读取**项目根目录的 `.gitconfig`
- Git 只读取以下位置的配置：
  1. `/etc/gitconfig` (系统级)
  2. `~/.gitconfig` (用户全局)
  3. `.git/config` (仓库本地，不提交)

## 解决方案

### 方案 1: 使用 `git config --local`（当前实现）

扩展在初始化时执行：
```typescript
execSync(`git config filter.claude-clean.clean "node .gitfilters/clean-sessions.js"`);
```

**优点：**
- 配置写入 `.git/config`（本地）
- 立即生效

**缺点：**
- 不会被提交到仓库
- 其他用户克隆后需要重新运行初始化命令

### 方案 2: 在 README 中说明

在文档中明确说明，克隆项目后需要运行初始化命令。

**优点：**
- 简单直接
- 用户明确知道需要做什么

**缺点：**
- 需要手动操作

## 当前实现

目前使用**方案 1**（需要恢复 `execSync`）：
- 创建 `.gitfilters/clean-sessions.js`（可提交）
- 创建 `.gitattributes`（可提交）
- 创建 `.gitconfig`（可提交，仅作为参考）
- 运行 `git config --local` 配置（立即生效，不提交）

这意味着：
- ✅ 脚本和 `.gitattributes` 会被共享
- ✅ 初始化用户立即可用
- ⚠️ 其他用户克隆后也需要运行一次初始化命令
