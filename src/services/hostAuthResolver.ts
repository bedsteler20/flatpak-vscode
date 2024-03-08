import * as vscode from 'vscode';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import { getServerInstallDir, getVscodeUserDir } from '../utils/utils';
import { downloadServer } from '../utils/serverInstaller';

export const REMOTE_HOST_AUTHORITY = "flatpak-host"

export class FlatpakHostAuthResolver implements vscode.RemoteAuthorityResolver, vscode.Disposable {
    private _resourceLabel?: vscode.Disposable;
    public static serverProcess?: ChildProcessWithoutNullStreams;
    constructor(readonly extensionContext: vscode.ExtensionContext) { }


    resolve(authority: string, context: vscode.RemoteAuthorityResolverContext): vscode.ResolverResult | Thenable<vscode.ResolverResult> {
        logger.log(`Resolving authority: ${authority}`);
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Flatpak Host Authentication",
            cancellable: false
        }, async () => {
            this._resourceLabel?.dispose();
            this._resourceLabel = vscode.workspace.registerResourceLabelFormatter({
                scheme: 'vscode-remote',
                authority: `${REMOTE_HOST_AUTHORITY}+*`,
                formatting: {
                    label: '${path}',
                    separator: '/',
                    tildify: true,
                    workspaceSuffix: ` (flatpak-host)`,
                }
            });

            await downloadServer(this.extensionContext);
            await this.runServer();
            const resolvedResult: vscode.ResolverResult = new vscode.ResolvedAuthority('localhost', 8000);

            return resolvedResult;

        });
    }

    async getCanonicalURI(uri: vscode.Uri) {
        return vscode.Uri.parse(uri.path)
    }

    private async runServer() {
        const serverDir = getServerInstallDir(this.extensionContext);
        logger.log("Starting server")
        if (FlatpakHostAuthResolver.serverProcess) {
            logger.log("server process exists")
            return
        }
        FlatpakHostAuthResolver.serverProcess = spawn("flatpak-spawn", [
            "--watch-bus",
            "--host",
            path.join(serverDir, "node"),
            path.join(serverDir, "out", "server-main.js"),
            "--accept-server-license-terms",
            "--without-connection-token",
            "--disable-telemetry"

        ])
    }

    dispose() {
        this._resourceLabel?.dispose()
    }

    public static register(context: vscode.ExtensionContext) {
        const self = new FlatpakHostAuthResolver(context);
        const disposable = vscode.workspace.registerRemoteAuthorityResolver(REMOTE_HOST_AUTHORITY, self);
        const disposable2 = vscode.workspace.registerResourceLabelFormatter({
            scheme: 'vscode-remote',
            authority: `${REMOTE_HOST_AUTHORITY}+*`,
            formatting: {
                label: '${path}',
                separator: '/',
                tildify: true,
                workspaceSuffix: ` (flatpak-host)`,
            }
        });
        context.subscriptions.push(disposable2);
        context.subscriptions.push(self);
        context.subscriptions.push(disposable)

    }
}