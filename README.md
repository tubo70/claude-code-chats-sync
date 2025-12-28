# Claude Code Chats Sync

[![Version](https://img.shields.io/visual-studio-marketplace/v/tubo.claude-code-chats-sync)](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/tubo.claude-code-chats-sync)](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/tubo.claude-code-chats-sync)](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)
[![License](https://img.shields.io/github/license/tubo70/claude-code-sync-extension)](LICENSE)

A VSCode extension that syncs Claude Code chat sessions within your project directory, making it easy to version control and share across machines.

## ⚠️ Important: Configure API Keys Securely

**HIGHLY RECOMMENDED**: Configure your Claude Code API key using environment variables **before** using this extension. This prevents API keys from being written to session files entirely, which is the most secure approach.

### Quick Setup

**Linux/macOS** - Add to your shell configuration (`~/.bashrc`, `~/.zshrc`, etc.):
```bash
export ANTHROPIC_AUTH_TOKEN="sk-ant-..."
export ANTHROPIC_BASE_URL="https://api.example.com"  # Optional: for third-party API
```

**Windows** - Set environment variables:

**Temporary (current session only):**
```powershell
# Command Prompt
set ANTHROPIC_AUTH_TOKEN=sk-ant-...
set ANTHROPIC_BASE_URL=https://api.example.com

# PowerShell
$env:ANTHROPIC_AUTH_TOKEN="sk-ant-..."
$env:ANTHROPIC_BASE_URL="https://api.example.com"
```

**Permanent (User-level)** - Run Command Prompt as Administrator:
```cmd
setx ANTHROPIC_AUTH_TOKEN "sk-ant-..."
setx ANTHROPIC_BASE_URL "https://api.example.com"
```

**Permanent (System-level)** - Run Command Prompt as Administrator:
```cmd
setx ANTHROPIC_AUTH_TOKEN "sk-ant-..." /M
setx ANTHROPIC_BASE_URL "https://api.example.com" /M
```

**GUI Method**:
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to the "Advanced" tab
3. Click "Environment Variables"
4. Add under "User variables" (for current user) or "System variables" (for all users)
5. Restart VSCode to apply changes

**Why this matters**: Session files store your entire conversation history, including API keys if configured in settings. Using environment variables keeps your credentials secure and out of version control.

## Features

- 🔄 **Auto-sync**: Automatically creates a symlink from Claude Code's local storage to your project folder
- 📁 **Project-local history**: Chat sessions are stored in your project, not in user home directory
- 🔒 **Sensitive data protection**: Automatically cleans API keys before committing to Git
- 🎯 **One-click setup**: Initialize sync with a single command
- 📊 **Status tracking**: See sync status and session count in the status bar
- 🌳 **Git-friendly**: Configures Git filters for safe version control
- 🔧 **Cross-platform**: Works on Windows, macOS, and Linux

## How It Works

Claude Code stores chat sessions in `~/.claude/projects/{normalized-project-path}/`. This extension creates a symbolic link to a folder in your project (default: `.claudeCodeSessions/`), so the chat history becomes part of your project.

### Example

```
Your Project/
├── src/
├── .claudeCodeSessions/      # Chat sessions (synced with ~/.claude)
│   ├── session-abc123.jsonl
│   └── session-def456.jsonl
├── .gitignore               # Auto-updated to ignore .claudeCodeSessions/
└── package.json
```

## Installation

### From VSCode Marketplace

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Claude Code Chats Sync"
4. Click Install

[Marketplace Link](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)

### From Source

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile TypeScript:
   ```bash
   npm run compile
   ```
4. Press F5 in VSCode to launch the extension in debug mode

## Usage

### Initial Setup

1. Open your project in VSCode
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Run: `Claude Code Chats Sync: Initialize Claude Code Chats Sync`
4. The extension will:
   - Create a `.claudeCodeSessions/` folder in your project
   - Create a symlink in `~/.claude/projects/`
   - Configure Git filter for automatic sensitive data cleaning
   - Add `.claudeCodeSessions/` to `.gitignore` (commented by default)

**Note:** If you have existing Claude Code session history for this project, you'll be prompted to migrate it to your project folder.

### Commands

- **Initialize Claude Code Chats Sync**: Set up the symlink and configure Git filter for safe sharing
- **Open Claude Code History Folder**: Open the history folder in your file manager
- **Check Claude Code Chats Sync Status**: Display sync status and session count
- **Setup Git Filter for Auto-Cleaning**: Configure Git to automatically remove API keys on commit
- **Clean Sensitive Data from Session Files**: Manually clean all API keys from session files

### Status Bar

The extension adds a status bar item showing:
- ✅ `Claude Code (N)` - Sync is active with N sessions
- ❌ `Claude Code` - Not initialized (click to setup)

## Configuration

You can configure the extension in your VSCode settings:

```json
{
  "claudeCodeSync.historyFolderName": ".claudeCodeSessions",
  "claudeCodeSync.autoInitialize": true
}
```

- `historyFolderName`: Name of the folder to store conversation history (default: `".claudeCodeSessions"`)
- `autoInitialize`: Prompt to initialize when opening a new workspace (default: `true`)

## Version Control

> ⚠️ **SECURITY WARNING**: Before adding `.claudeCodeSessions/` to Git, be aware that session files may contain sensitive information including:
> - API keys and authentication tokens
> - Proprietary code and business logic
> - Private conversations and internal discussions
> - System paths and environment details
>
> While this extension provides tools to clean API keys, **no automated cleaning is 100% complete**. Only commit these files if you fully understand and accept the security risks. The safest approach is to keep `.claudeCodeSessions/` in your `.gitignore`.

The extension automatically configures Git filters to protect sensitive information when committing chat sessions.

### API Key Configuration Options

**Option 1: Use Environment Variables (Recommended)**

Configure Claude Code to use API keys from environment variables, preventing them from appearing in session files entirely:

```bash
# Linux/macOS
export ANTHROPIC_AUTH_TOKEN="sk-ant-..."
export ANTHROPIC_BASE_URL="https://api.example.com"  # Optional: for third-party API

# Windows
set ANTHROPIC_AUTH_TOKEN=sk-ant-...
set ANTHROPIC_BASE_URL=https://api.example.com
```

This is the most secure approach as API keys never touch your session files. Set `ANTHROPIC_BASE_URL` if you're using a third-party API endpoint.

**Option 2: Use Git Filter**

If you store API keys in configuration files, the extension's Git filter automatically cleans them on commit.

### Automatic Sensitive Data Protection

When you initialize the extension, it automatically sets up a Git filter that:
- ✅ Removes API keys from session files before committing
- ✅ Preserves conversation structure and content
- ✅ Keeps your original files unchanged (only committed versions are cleaned)

### How It Works

```bash
# After initialization, just commit normally
git add .claudeCodeSessions/
git commit -m "Add conversation history"

# API keys are automatically replaced with [REDACTED]
# Your local files remain unchanged
```

### Manual Configuration

If you want to manually set up the Git filter:

1. Run: `Claude Code Chats Sync: Setup Git Filter for Auto-Cleaning`
2. Or manually clean files: `Claude Code Chats Sync: Clean Sensitive Data from Session Files`

### Complete Git Ignore

**RECOMMENDED**: Ignore session files entirely to avoid any risk of leaking sensitive information. Uncomment this line in `.gitignore`:

```gitignore
.claudeCodeSessions/
```

This prevents accidentally committing API keys, proprietary code, private conversations, or other sensitive data to your repository.

### Syncing Across Machines

> ⚠️ **WARNING**: Review the security warning above before committing session files to Git.

If you choose to proceed with syncing:

1. Commit the `.claudeCodeSessions/` folder (if you want to sync it)
2. Push to GitHub
3. Pull on another machine
4. Run `Claude Code Chats Sync: Initialize` to create the symlink

> 📖 **Detailed Documentation**: See [SENSITIVE_DATA.md](SENSITIVE_DATA.md) for more information about sensitive data protection and Git filter configuration.

## Troubleshooting

### Symlink Creation Failed (Windows)

Windows requires administrator privileges or Developer Mode to create symlinks. The extension uses "junction" points, which work without special permissions.

### History Not Syncing

1. Check if the symlink exists:
   - Windows: `dir %USERPROFILE%\.claude\projects`
   - macOS/Linux: `ls -la ~/.claude/projects`

2. Verify the symlink points to your project's `.claudeCodeSessions/` folder

3. Check VSCode output for error messages

### Already Initialized

If you have existing Claude Code session history before using this extension, the initialize command will automatically migrate it:

**What happens during migration:**
1. Existing session files in `~/.claude/projects/{your-project}/` are detected
2. You'll be prompted to move them to your project's `.claudeCodeSessions/` folder
3. If you confirm, files are moved and a symlink is created in their place
4. Your existing conversation history is preserved and now part of your project

**To reinitialize:**
1. Delete the symlink:
   ```bash
   # Windows
   rmdir "%USERPROFILE%\.claude\projects\{project-name}"

   # macOS/Linux
   rm ~/.claude/projects/{project-name}
   ```

2. Run the initialize command again

## Development

### Building

```bash
npm install
npm run compile
```

### Watching for Changes

```bash
npm run watch
```

### Debugging

Press F5 in VSCode to launch the extension in a new VSCode window (Extension Development Host).

## License

MIT - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Credits

Created to solve the problem of syncing Claude Code conversation history across machines and projects.

## Links

- [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=tubo.claude-code-chats-sync)
- [GitHub Repository](https://github.com/tubo70/claude-code-sync-extension)
- [Issue Tracker](https://github.com/tubo70/claude-code-sync-extension/issues)
- [Changelog](CHANGELOG.md)
