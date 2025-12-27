# Claude Code Chats Sync

A VSCode extension that syncs Claude Code chat sessions within your project directory, making it easy to version control and share across machines.

## Features

- 🔄 **Auto-sync**: Automatically creates a symlink from Claude Code's local storage to your project folder
- 📁 **Project-local history**: Chat sessions are stored in your project, not in user home directory
- 🎯 **One-click setup**: Initialize sync with a single command
- 📊 **Status tracking**: See sync status and session count in the status bar
- 🌳 **Git-friendly**: Automatically adds history folder to `.gitignore`
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

### From VSCode Marketplace (Coming Soon)

Search for "Claude Code Chats Sync" in the VSCode extensions marketplace.

## Usage

### Initial Setup

1. Open your project in VSCode
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Run: `Claude Code Chats Sync: Initialize Claude Code Chats Sync`
4. The extension will:
   - Create a `.claudeCodeSessions/` folder in your project
   - Create a symlink in `~/.claude/projects/`
   - Add `.claudeCodeSessions/` to `.gitignore`

### Commands

- **Initialize Claude Code Chats Sync**: Set up the symlink for the current project
- **Open Claude Code History Folder**: Open the history folder in your file manager
- **Check Claude Code Chats Sync Status**: Display sync status and session count

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

By default, the extension adds the history folder to `.gitignore` to avoid committing conversation history.

### If you want to commit history:

1. Remove the ignore rule from `.gitignore`:
   ```
   # .claudeCodeSessions/
   ```

2. Commit the folder:
   ```bash
   git add .claudeCodeSessions/
   git commit -m "Add Claude Code conversation history"
   ```

### Syncing Across Machines

1. Commit the `.claudeCodeSessions/` folder (if you want to sync it)
2. Push to GitHub
3. Pull on another machine
4. Run `Claude Code Chats Sync: Initialize` to create the symlink

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

If you see "Claude Code sync already initialized", the symlink already exists. To reinitialize:

1. Delete the old symlink:
   ```bash
   # Windows
   rmdir "%USERPROFILE%\.claude\projects\{project-name}"
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

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Credits

Created to solve the problem of syncing Claude Code conversation history across machines and projects.
