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

#### Configuration
- Added `claudeCodeSync.historyFolderName` setting to customize the folder name for storing chat history (default: `.claudeCodeSessions`)
- Added `claudeCodeSync.autoInitialize` setting to automatically initialize sync when opening a workspace (default: true)

#### Commands
- `Claude Code Chats Sync: Initialize Claude Code Chats Sync` - Initialize sync for the current workspace
- `Claude Code Chats Sync: Open Claude Code Chats Folder` - Open the folder where Claude Code chat sessions are stored
- `Claude Code Chats Sync: Check Claude Code Chats Sync Status` - Check if sync is active and view the current session folder path

#### Platform Support
- Cross-platform support for Windows, Linux, and macOS
