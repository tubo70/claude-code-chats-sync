import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execSync } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Code Sync extension is now active!');

    // Register commands
    const initializeCommand = vscode.commands.registerCommand(
        'claudeCodeSync.initialize',
        async () => {
            await initializeClaudeSync();
        }
    );

    const openFolderCommand = vscode.commands.registerCommand(
        'claudeCodeSync.openFolder',
        () => {
            openHistoryFolder();
        }
    );

    const checkStatusCommand = vscode.commands.registerCommand(
        'claudeCodeSync.checkStatus',
        () => {
            checkSyncStatus();
        }
    );

    const setupFilterCommand = vscode.commands.registerCommand(
        'claudeCodeSync.setupFilter',
        async () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }
            await setupGitFilter(workspaceFolder.uri.fsPath);
        }
    );

    const cleanSessionsCommand = vscode.commands.registerCommand(
        'claudeCodeSync.cleanSessions',
        async () => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }

            const answer = await vscode.window.showWarningMessage(
                'This will clean sensitive data (API keys) from all session files in your project.\n\n' +
                'The original files will be modified. Make sure you have a backup if needed.\n\n' +
                'Continue?',
                'Clean',
                'Cancel'
            );

            if (answer === 'Clean') {
                await cleanSessionFiles(workspaceFolder.uri.fsPath);
            }
        }
    );

    context.subscriptions.push(initializeCommand, openFolderCommand, checkStatusCommand, setupFilterCommand, cleanSessionsCommand);

    // Auto-initialize on workspace open if enabled
    const config = vscode.workspace.getConfiguration('claudeCodeSync');
    if (config.get('autoInitialize', true)) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            autoInitializeIfNeeded(workspaceFolder.uri.fsPath);
        }
    }

    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'claudeCodeSync.checkStatus';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Update status bar
    updateStatusBar(statusBarItem);
}

/**
 * Normalize project path to Claude Code format
 *
 * Windows:   D:\Projects\MyProject -> d--Projects-MyProject
 * Linux/Mac: /home/user/projects/my-project -> home-user-projects-my-project
 */
function normalizeProjectPath(projectPath: string): string {
    if (process.platform === 'win32') {
        // Windows: Replace backslashes and colons with dashes, preserve case
        return projectPath
            .replace(/\\/g, '-')
            .replace(/:/g, '-');
    } else {
        // Linux/Mac: Replace forward slashes with dashes, preserve case
        return projectPath
            .replace(/^\//, '')      // Remove leading slash
            .replace(/\//g, '-');    // Replace remaining slashes with dashes
    }
}

/**
 * Get Claude Code projects directory
 */
function getClaudeProjectsDir(): string {
    const homeDir = os.homedir();
    return path.join(homeDir, '.claude', 'projects');
}

/**
 * Get history folder path in the project
 */
function getHistoryFolderPath(projectPath: string): string {
    const config = vscode.workspace.getConfiguration('claudeCodeSync');
    const folderName = config.get('historyFolderName', '.claudeCodeSessions');
    return path.join(projectPath, folderName);
}

/**
 * Initialize Claude Code Chats Sync for current workspace
 */
async function initializeClaudeSync(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    const projectPath = workspaceFolder.uri.fsPath;
    const historyFolder = getHistoryFolderPath(projectPath);
    const claudeProjectsDir = getClaudeProjectsDir();
    const normalizedPath = normalizeProjectPath(projectPath);
    const symlinkPath = path.join(claudeProjectsDir, normalizedPath);

    try {
        // Check if symlink already exists
        if (fs.existsSync(symlinkPath)) {
            const stats = fs.lstatSync(symlinkPath);
            if (stats.isSymbolicLink()) {
                // Already initialized with a symlink
                vscode.window.showInformationMessage('Claude Code Chats Sync already initialized');
                return;
            } else if (stats.isDirectory()) {
                // Existing real directory - user has used Claude Code before
                const files = fs.readdirSync(symlinkPath);
                const sessionFiles = files.filter(f => f.endsWith('.jsonl'));

                if (sessionFiles.length > 0) {
                    const answer = await vscode.window.showWarningMessage(
                        `Found ${sessionFiles.length} existing Claude Code session(s) in Claude's storage.\n\n` +
                        `Move them to your project folder?`,
                        'Move to Project',
                        'Cancel'
                    );

                    if (answer === 'Move to Project') {
                        // Move existing directory to project folder
                        await moveDirectorySync(symlinkPath, historyFolder);
                        vscode.window.showInformationMessage(
                            `✅ Moved ${sessionFiles.length} session(s) to project folder!`
                        );
                    } else {
                        return;
                    }
                } else {
                    // Empty directory, just remove it
                    fs.rmSync(symlinkPath, { recursive: true, force: true });
                }
            } else {
                // It's a file, not a directory - error
                vscode.window.showErrorMessage(
                    `A file exists at Claude Code location: ${symlinkPath}`
                );
                return;
            }
        }

        // Create history folder if it doesn't exist
        if (!fs.existsSync(historyFolder)) {
            fs.mkdirSync(historyFolder, { recursive: true });
            vscode.window.showInformationMessage(`Created folder: ${historyFolder}`);
        }

        // Ensure .claude/projects directory exists
        if (!fs.existsSync(claudeProjectsDir)) {
            fs.mkdirSync(claudeProjectsDir, { recursive: true });
        }

        // Create symbolic link from Claude location to project folder
        const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';
        fs.symlinkSync(historyFolder, symlinkPath, symlinkType);

        vscode.window.showInformationMessage(
            `✅ Claude Code Chats Sync initialized!\n` +
            `History folder: ${historyFolder}\n` +
            `Linked to: ${symlinkPath}`
        );

        // Add to .gitignore if not present
        await addToGitIgnore(projectPath);

        // Setup Git filter for automatic cleaning
        await setupGitFilter(projectPath, false); // false = don't show success message again

    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Failed to initialize Claude Code Chats Sync: ${error.message}`
        );
    }
}

/**
 * Auto-initialize if needed
 */
async function autoInitializeIfNeeded(projectPath: string): Promise<void> {
    const historyFolder = getHistoryFolderPath(projectPath);
    const claudeProjectsDir = getClaudeProjectsDir();
    const normalizedPath = normalizeProjectPath(projectPath);
    const symlinkPath = path.join(claudeProjectsDir, normalizedPath);

    // Check if already initialized
    if (fs.existsSync(symlinkPath) || fs.existsSync(historyFolder)) {
        return;
    }

    // Ask user if they want to initialize
    const answer = await vscode.window.showInformationMessage(
        'Claude Code Chats Sync: This project is not initialized. Would you like to sync conversation history within the project?',
        'Initialize',
        'Not now',
        'Never'
    );

    if (answer === 'Initialize') {
        await initializeClaudeSync();
    } else if (answer === 'Never') {
        const config = vscode.workspace.getConfiguration('claudeCodeSync');
        config.update('autoInitialize', false, vscode.ConfigurationTarget.Global);
    }
}

/**
 * Open the history folder
 */
function openHistoryFolder(): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    const historyFolder = getHistoryFolderPath(workspaceFolder.uri.fsPath);

    if (!fs.existsSync(historyFolder)) {
        vscode.window.showInformationMessage('History folder does not exist. Please initialize first.');
        return;
    }

    vscode.env.openExternal(vscode.Uri.file(historyFolder));
}

/**
 * Check and display sync status
 */
function checkSyncStatus(): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    const projectPath = workspaceFolder.uri.fsPath;
    const historyFolder = getHistoryFolderPath(projectPath);
    const claudeProjectsDir = getClaudeProjectsDir();
    const normalizedPath = normalizeProjectPath(projectPath);
    const symlinkPath = path.join(claudeProjectsDir, normalizedPath);

    const status: string[] = [];
    status.push('**Claude Code Chats Sync Status**\n');

    // Check history folder
    if (fs.existsSync(historyFolder)) {
        const files = fs.readdirSync(historyFolder).filter(f => f.endsWith('.jsonl'));
        status.push(`✅ History folder: ${historyFolder}`);
        status.push(`   Sessions: ${files.length}`);
    } else {
        status.push(`❌ History folder not found`);
    }

    // Check symlink
    if (fs.existsSync(symlinkPath)) {
        status.push(`✅ Symlink created: ${symlinkPath}`);
    } else {
        status.push(`❌ Symlink not created`);
    }

    vscode.window.showInformationMessage(status.join('\n'), 'OK');
}

/**
 * Update status bar
 */
function updateStatusBar(statusBarItem: vscode.StatusBarItem): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        statusBarItem.text = '$(circle-slash) Claude Code';
        statusBarItem.tooltip = 'No workspace folder';
        return;
    }

    const projectPath = workspaceFolder.uri.fsPath;
    const historyFolder = getHistoryFolderPath(projectPath);
    const claudeProjectsDir = getClaudeProjectsDir();
    const normalizedPath = normalizeProjectPath(projectPath);
    const symlinkPath = path.join(claudeProjectsDir, normalizedPath);

    if (fs.existsSync(symlinkPath) && fs.existsSync(historyFolder)) {
        const files = fs.readdirSync(historyFolder).filter(f => f.endsWith('.jsonl'));
        statusBarItem.text = `$(sync) Claude Code (${files.length})`;
        statusBarItem.tooltip = `Synced: ${files.length} sessions`;
    } else {
        statusBarItem.text = '$(circle-slash) Claude Code';
        statusBarItem.tooltip = 'Not initialized. Click to setup.';
    }
}

/**
 * Add history folder to .gitignore with comment about Git filter
 *
 * Always adds the folder to .gitignore (commented by default).
 * Users can uncomment if they want to ignore session files,
 * or leave commented if using Git filter for safe sharing.
 */
async function addToGitIgnore(projectPath: string): Promise<void> {
    const gitignorePath = path.join(projectPath, '.gitignore');
    const config = vscode.workspace.getConfiguration('claudeCodeSync');
    const folderName = config.get('historyFolderName', '.claudeCodeSessions');

    try {
        let content = '';
        if (fs.existsSync(gitignorePath)) {
            content = fs.readFileSync(gitignorePath, 'utf-8');
        }

        const ignoreEntry = `# Claude Code conversation history
# Uncomment the line below to ignore session files, OR configure Git filter for safe sharing
# ${folderName}/`;

        // Only add if not already present
        if (!content.includes(`# ${folderName}/`) && !content.includes(`${folderName}/`)) {
            if (content && !content.endsWith('\n')) {
                content += '\n';
            }
            content += `\n${ignoreEntry}\n`;
            fs.writeFileSync(gitignorePath, content, 'utf-8');
        }
    } catch (error) {
        // Ignore errors (no .git or no write permission)
    }
}

/**
 * Move directory recursively (handles cross-device moves)
 */
async function moveDirectorySync(src: string, dest: string): Promise<void> {
    // Create destination directory
    fs.mkdirSync(dest, { recursive: true });

    // Recursively copy all files and subdirectories
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            // Recursively move subdirectory
            await moveDirectorySync(srcPath, destPath);
        } else {
            // Copy file
            fs.copyFileSync(srcPath, destPath);
        }
    }

    // Remove source directory after successful copy
    fs.rmSync(src, { recursive: true, force: true });
}

/**
 * Clean sensitive information from session file content
 *
 * This removes API keys and other sensitive data while preserving
 * the conversation structure for safe Git sharing.
 */
function cleanSensitiveData(content: string): string {
    // Pattern for Anthropic API keys (normal format)
    const apiKeyPattern = /"primaryApiKey"\s*:\s*"sk-ant-[^"]*"/g;

    // Pattern for API keys within escaped JSON strings (like in tool results)
    const apiKeyPatternEscaped = /\\"primaryApiKey\\":\s*\\"sk-ant-[^"]*\\"/g;

    // Pattern for ANTHROPIC_AUTH_TOKEN (escaped format: \"ANTHROPIC_AUTH_TOKEN\": \"token\")
    const authTokenPatternEscaped = /\\"ANTHROPIC_AUTH_TOKEN\\"\\s*:\\s*\\"[^"]*\\"/g;

    // Pattern for other API keys
    const genericApiKeyPattern = /"(apiKey|api_key|authorization|token|bearer)"\s*:\s*"[^"]*"/gi;

    // Clean Anthropic API keys (normal format)
    let cleaned = content.replace(apiKeyPattern, '"primaryApiKey": "[REDACTED]"');

    // Clean Anthropic API keys (escaped format in nested JSON)
    cleaned = cleaned.replace(apiKeyPatternEscaped, '\\"primaryApiKey\\": \\"[REDACTED]\\"');

    // Clean ANTHROPIC_AUTH_TOKEN (escaped format)
    cleaned = cleaned.replace(authTokenPatternEscaped, '\\"ANTHROPIC_AUTH_TOKEN\\": \\"[REDACTED]\\"');

    // Clean other API keys
    cleaned = cleaned.replace(genericApiKeyPattern, '"$1": "[REDACTED]"');

    return cleaned;
}

/**
 * Clean all session files in the history folder
 *
 * This creates a cleaned version of all session files that can be
 * safely committed to Git while keeping the original files intact.
 */
async function cleanSessionFiles(projectPath: string): Promise<void> {
    const historyFolder = getHistoryFolderPath(projectPath);

    if (!fs.existsSync(historyFolder)) {
        vscode.window.showErrorMessage('History folder does not exist');
        return;
    }

    const files = fs.readdirSync(historyFolder).filter(f => f.endsWith('.jsonl'));

    if (files.length === 0) {
        vscode.window.showInformationMessage('No session files to clean');
        return;
    }

    let cleanedCount = 0;
    const withProgress = vscode.window.withProgress;

    await withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Cleaning session files...',
            cancellable: false
        },
        async () => {
            for (const file of files) {
                const filePath = path.join(historyFolder, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const cleaned = cleanSensitiveData(content);

                // Write cleaned content back to file
                fs.writeFileSync(filePath, cleaned, 'utf-8');
                cleanedCount++;
            }
        }
    );

    vscode.window.showInformationMessage(
        `✅ Cleaned ${cleanedCount} session file(s). Sensitive data has been redacted.`
    );
}

/**
 * Setup Git filter for automatic cleaning on commit
 *
 * This configures Git to automatically clean sensitive data from
 * session files when they are committed.
 *
 * @param projectPath - The project root path
 * @param showMessage - Whether to show success message (default: true)
 */
async function setupGitFilter(projectPath: string, showMessage: boolean = true): Promise<void> {
    const config = vscode.workspace.getConfiguration('claudeCodeSync');
    const folderName = config.get('historyFolderName', '.claudeCodeSessions');

    try {
        // Check if we're in a Git repository
        const gitDir = path.join(projectPath, '.git');
        if (!fs.existsSync(gitDir)) {
            vscode.window.showWarningMessage(
                'Not a Git repository. Git filter will not be configured.'
            );
            return;
        }

        // Create the clean filter script in workspace (committed to repo)
        const filterScriptPath = path.join(projectPath, '.gitfilters', 'clean-sessions.js');
        const filterDir = path.dirname(filterScriptPath);

        if (!fs.existsSync(filterDir)) {
            fs.mkdirSync(filterDir, { recursive: true });
        }

        const filterScript = `#!/usr/bin/env node
const fs = require('fs');

// Pattern for Anthropic API keys (normal format)
const apiKeyPattern = /"primaryApiKey"\\s*:\\s*"sk-ant-[^"]*"/g;

// Pattern for API keys within escaped JSON strings
const apiKeyPatternEscaped = /\\\\\\"primaryApiKey\\\\\\"\\\\s*:\\\\\\s*\\\\\\"sk-ant-[^"]*\\\\\\"/g;

// Pattern for ANTHROPIC_AUTH_TOKEN (escaped format: \\"ANTHROPIC_AUTH_TOKEN\\": \\"token\\")
const authTokenPatternEscaped = /\\\\"ANTHROPIC_AUTH_TOKEN\\\\"\\\\s*:\\\\\\s*\\\\"[^"]*\\\\"/g;

// Pattern for other API keys
const genericApiKeyPattern = /"(apiKey|api_key|authorization|token|bearer)"\\s*:\\s*"[^"]*"/gi;

let data = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
    data += chunk;
});

process.stdin.on('end', () => {
    let cleaned = data.replace(apiKeyPattern, '"primaryApiKey": "[REDACTED]"');
    cleaned = cleaned.replace(apiKeyPatternEscaped, '\\\\\\"primaryApiKey\\\\\\": \\\\"[REDACTED]\\\\"');
    cleaned = cleaned.replace(authTokenPatternEscaped, '\\\\\\"ANTHROPIC_AUTH_TOKEN\\\\\\": \\\\"[REDACTED]\\\\"');
    cleaned = cleaned.replace(genericApiKeyPattern, '"$1": "[REDACTED]"');
    process.stdout.write(cleaned);
});
`;

        fs.writeFileSync(filterScriptPath, filterScript, 'utf-8');

        // Make it executable on Unix-like systems
        if (process.platform !== 'win32') {
            try {
                fs.chmodSync(filterScriptPath, 0o755);
            } catch (e) {
                // Ignore permission errors
            }
        }

        // Configure Git to use the filter in .gitconfig (project-level, committed to repo)
        const gitConfigPath = path.join(projectPath, '.gitconfig');

        let gitConfig = '';
        if (fs.existsSync(gitConfigPath)) {
            gitConfig = fs.readFileSync(gitConfigPath, 'utf-8');
        }

        if (!gitConfig.includes('[filter "claude-clean"]')) {
            if (gitConfig && !gitConfig.endsWith('\n')) {
                gitConfig += '\n';
            }
            gitConfig += `[filter "claude-clean"]
\tclean = node .gitfilters/clean-sessions.js
`;
            fs.writeFileSync(gitConfigPath, gitConfig, 'utf-8');
        }

        // Configure the filter in local Git config (this actually makes it work)
        try {
            execSync(
                `git config filter.claude-clean.clean "node .gitfilters/clean-sessions.js"`,
                { cwd: projectPath, stdio: 'pipe' }
            );
        } catch (error: any) {
            vscode.window.showWarningMessage(
                `Failed to configure local Git filter: ${error.message}`
            );
            // Don't return here, as .gitconfig was created successfully
        }

        // Configure Git to use the filter
        const gitAttributesPath = path.join(projectPath, '.gitattributes');

        let gitAttributes = '';
        if (fs.existsSync(gitAttributesPath)) {
            gitAttributes = fs.readFileSync(gitAttributesPath, 'utf-8');
        }

        const filterLine = `${folderName}/*.jsonl filter=claude-clean`;

        if (!gitAttributes.includes(filterLine)) {
            if (gitAttributes && !gitAttributes.endsWith('\n')) {
                gitAttributes += '\n';
            }
            gitAttributes += `\n# Claude Code sessions - clean sensitive data on commit\n${filterLine}\n`;
            fs.writeFileSync(gitAttributesPath, gitAttributes, 'utf-8');
        }

        if (showMessage) {
            vscode.window.showInformationMessage(
                '✅ Git filter configured. Session files will be automatically cleaned on commit.\n\n' +
                'Note: Original files remain unchanged. Only committed versions are cleaned.'
            );
        }

    } catch (error: any) {
        vscode.window.showErrorMessage(
            `Failed to setup Git filter: ${error.message}`
        );
    }
}

export function deactivate() {
    console.log('Claude Code Sync extension is now deactivated!');
}
