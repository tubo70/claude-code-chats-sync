# Change Log

All notable changes to the "Claude Code Chats Sync" extension will be documented in this file.

## [0.0.1] - 2025-12-28

### Initial Release

#### Features
- Initial release of Claude Code Chats Sync extension
- Sync Claude Code chat sessions within your project workspace
- Initialize sync functionality for your workspace
- Open Claude Code chats folder directly from VSCode
- Check sync status to see if sync is active
- **Migration support**: Automatically detect and migrate existing Claude Code sessions when initializing
  - When existing sessions are found in Claude's storage, users can choose to move them to the project folder
  - Handles cross-device moves (e.g., between different drives on Windows)
  - Preserves all session files and metadata
  - Works correctly with active sessions

#### Configuration
- Added `claudeCodeSync.historyFolderName` setting to customize the folder name for storing chat history (default: `.claudeCodeSessions`)
- Added `claudeCodeSync.autoInitialize` setting to automatically initialize sync when opening a workspace (default: true)

#### Commands
- `Claude Code Chats Sync: Initialize Claude Code Chats Sync` - Initialize sync for the current workspace
- `Claude Code Chats Sync: Open Claude Code Chats Folder` - Open the folder where Claude Code chat sessions are stored
- `Claude Code Chats Sync: Check Claude Code Chats Sync Status` - Check if sync is active and view the current session folder path

#### Platform Support
- Cross-platform support for Windows, Linux, and macOS
