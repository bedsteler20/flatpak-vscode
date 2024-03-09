// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HostRemote } from './services/hostRemote';
import { HostTerminal } from './services/hostTerminal';
import { logger } from './utils/logger';
import { AutoUpdater } from './services/autoUpdater';
import { ManifestLocator } from './services/mainfestLocater';

export let services: {
    hostRemote?: HostRemote,
    hostTerminal?: HostTerminal,
    autoUpdater?: AutoUpdater,
    manifestLocator?: ManifestLocator
};

export function activate(context: vscode.ExtensionContext) {
    logger.log("activate")

    services = {
        hostRemote: new HostRemote(context),
        hostTerminal: new HostTerminal(context),
        autoUpdater: new AutoUpdater(context),
        manifestLocator: new ManifestLocator(context)
    };
}

export function deactivate() {
    logger.log("deactivate")
}
