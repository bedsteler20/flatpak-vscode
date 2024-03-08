import * as vscode from 'vscode';
import * as path from 'path';

export function getVscodeUserDir(context: vscode.ExtensionContext) {
    return path.join(context.globalStorageUri.fsPath, "..", "..", "..");
}

export function getVscodeExtensionsDir(context: vscode.ExtensionContext) {
    return path.join(path.join(context.extensionUri.fsPath, ".."));
}

export function getNormalizedAppNames() {
    return vscode.env.appName.replace(/ /g, "-").toLowerCase();
}

export function getServerInstallDir(context: vscode.ExtensionContext) {
    const dirname = `${getNormalizedAppNames()}-${vscode.env.appQuality}-${vscode.env.appCommit}-server`;
    return path.join(context.globalStorageUri.fsPath, "servers", dirname);
}