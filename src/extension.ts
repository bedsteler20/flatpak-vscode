// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { FlatpakHostAuthResolver } from './hostAuthResolver';
import { FlatpakHostTerminalProvider } from './hostTerminalProvider';
import { registerCommands } from './commands';
import { log } from './logger';
import { getVscodeExtensionsDir, getVscodeUserDir } from './utils';
export function activate(context: vscode.ExtensionContext) {
    FlatpakHostAuthResolver.register(context);
    FlatpakHostTerminalProvider.register(context);
    registerCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() { 
    log("deactivate")
    FlatpakHostAuthResolver.serverProcess?.kill();
}
