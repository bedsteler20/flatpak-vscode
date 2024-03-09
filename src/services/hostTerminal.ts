import * as vscode from "vscode";
import { Settings } from "../utils/settings";

export class HostTerminal implements vscode.TerminalProfileProvider, vscode.Disposable {

    constructor(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            this,
            vscode.window.registerTerminalProfileProvider("flatpak-host", this),
            vscode.commands.registerCommand("flatpak.openHostTerminal", this.openHostTerminalCommand, this),
        );

    }

    get terminalProfile(): vscode.TerminalOptions {
        return {
            name: 'Flatpak Host',
            shellPath: '/usr/bin/flatpak-spawn',
            shellArgs: [
                "--host",
                "--env=TERM=xterm-256color",
                Settings.hostShell,
            ]
        };
    }

    openHostTerminalCommand() {
        const terminal = vscode.window.createTerminal(this.terminalProfile);
        terminal.show();
    }

    provideTerminalProfile(token: vscode.CancellationToken): vscode.ProviderResult<vscode.TerminalProfile> {
        return {
            options: this.terminalProfile,
        };
    }

    dispose() { }
}