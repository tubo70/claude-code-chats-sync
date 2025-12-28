import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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

    context.subscriptions.push(initializeCommand, openFolderCommand, checkStatusCommand);

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
 * Add history folder to .gitignore
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

        const ignoreLine = `${folderName}/`;

        if (!content.includes(ignoreLine)) {
            if (content && !content.endsWith('\n')) {
                content += '\n';
            }
            content += `\n# Claude Code conversation history\n${ignoreLine}\n`;
            fs.writeFileSync(gitignorePath, content);
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

export function deactivate() {
    console.log('Claude Code Sync extension is now deactivated!');
}
