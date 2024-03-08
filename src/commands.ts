import * as vscode from "vscode";

function openFlatpakHost() {
    vscode.commands.executeCommand('vscode.newWindow', {
        remoteAuthority: "flatpak-host+",
        reuseWindow: true
    });
}

function openCurrentFolderOnHost() {
    const currentDir = vscode.workspace.workspaceFolders?.at(0)?.uri.path;
    const url = vscode.Uri.parse(`vscode-remote://flatpak-host+${currentDir}`)

    vscode.commands.executeCommand("vscode.openFolder", url);
}


export function registerCommands(context: vscode.ExtensionContext) {
    const commands = [
        vscode.commands.registerCommand("flatpak.openHostRemote", openFlatpakHost),
        vscode.commands.registerCommand("flatpak.openCurrentFolderOnHost", openCurrentFolderOnHost)
    ];
    
    commands.forEach((command) => context.subscriptions.push(command))
}