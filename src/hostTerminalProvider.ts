import * as vscode from "vscode";
import { Settings } from "./settings";

export class FlatpakHostTerminalProvider implements vscode.TerminalProfileProvider, vscode.Disposable {
    provideTerminalProfile(token: vscode.CancellationToken): vscode.ProviderResult<vscode.TerminalProfile> {
        return {
            options: {
                name: 'Flatpak Host',
                shellPath: '/usr/bin/flatpak-spawn',
                shellArgs: [
                    "--host",
                    "--env=TERM=xterm-256color",
                    Settings.hostShell,
                ]
            }
        };
    }

    dispose() { }

    public static register(context: vscode.ExtensionContext) {
        const self = new FlatpakHostTerminalProvider();
        const disposable = vscode.window.registerTerminalProfileProvider("flatpak-host", self);
        context.subscriptions.push(self);
        context.subscriptions.push(disposable)
    }
}