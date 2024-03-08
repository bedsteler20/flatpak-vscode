// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { FlatpakHostAuthResolver } from './services/hostAuthResolver';
import { FlatpakHostTerminalProvider } from './services/hostTerminalProvider';
import { registerCommands } from './commands';
import {  logger } from './utils/logger';
import { AutoUpdater } from './services/autoUpdater';

export function activate(context: vscode.ExtensionContext) {
    logger.log("activate")
    FlatpakHostAuthResolver.register(context);
    FlatpakHostTerminalProvider.register(context);
    AutoUpdater.register(context);
    registerCommands(context);
}

export function deactivate() {
    logger.log("deactivate")
    FlatpakHostAuthResolver.serverProcess?.kill();
}
