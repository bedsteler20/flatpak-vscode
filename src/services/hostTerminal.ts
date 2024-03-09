import * as vscode from "vscode";
import { Settings } from "../utils/settings";
import { Component } from "../utils/component";

export class HostTerminal extends Component implements vscode.TerminalProfileProvider {

     public override async register() {
        super.register();
        this.registerCommand("flatpak.openHostTerminal", this.openHostTerminalCommand);
        this.disposables.push(
            vscode.window.registerTerminalProfileProvider("flatpak-host", this),
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
}