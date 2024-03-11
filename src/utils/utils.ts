import * as vscode from 'vscode';
import * as path from 'path';
import { https } from 'follow-redirects';

export function getNormalizedAppNames() {
    return vscode.env.appName.replace(/ /g, "-").toLowerCase();
}

export function getServerInstallDir(context: vscode.ExtensionContext) {
    const dirname = `${getNormalizedAppNames()}-${vscode.env.appQuality}-${vscode.env.appCommit}-server`;
    return path.join(context.globalStorageUri.fsPath, "servers", dirname);
}
