import * as vscode from 'vscode';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import { getServerInstallDir, getVscodeUserDir } from '../utils/utils';
import { downloadServer } from '../utils/serverInstaller';
import { spawnHostFlatpak } from '../utils/flatpak';
import { Component } from '../utils/component';

export const REMOTE_HOST_AUTHORITY = "flatpak-host"

export class HostRemote extends Component implements vscode.RemoteAuthorityResolver, vscode.Disposable {
    private _resourceLabelDisposable?: vscode.Disposable;
    private _serverProcess?: ChildProcessWithoutNullStreams;

    private _resourceLabel: vscode.ResourceLabelFormatter = {
        scheme: 'vscode-remote',
        authority: `${REMOTE_HOST_AUTHORITY}+*`,
        formatting: {
            label: '${path}',
            separator: '/',
            tildify: true,
            workspaceSuffix: ` (flatpak-host)`,
        }
    };

    public override async register() {
        super.register();
        this.registerCommand("flatpak.openHostRemote", this.openHostRemoteCommand);
        this.registerCommand("flatpak.openCurrentFolderOnHost", this.openCurrentFolderOnHostCommand);
        this.disposables.push(
            vscode.workspace.registerRemoteAuthorityResolver(REMOTE_HOST_AUTHORITY, this),
            vscode.workspace.registerResourceLabelFormatter(this._resourceLabel),
        );
    }


    resolve(authority: string, context: vscode.RemoteAuthorityResolverContext): vscode.ResolverResult | Thenable<vscode.ResolverResult> {
        logger.log(`Resolving authority: ${authority}`);
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Flatpak Host Authentication",
            cancellable: false
        }, async () => {
            this._resourceLabelDisposable?.dispose();
            this._resourceLabelDisposable = vscode.workspace.registerResourceLabelFormatter(this._resourceLabel);

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
        if (this._serverProcess) {
            logger.log("server process exists")
            return
        }
        this._serverProcess = spawnHostFlatpak([
            path.join(serverDir, "node"),
            path.join(serverDir, "out", "server-main.js"),
            "--accept-server-license-terms",
            "--without-connection-token",
            "--disable-telemetry"

        ])
    }

    openCurrentFolderOnHostCommand() {
        const currentDir = vscode.workspace.workspaceFolders?.at(0)?.uri.path;
        const url = vscode.Uri.parse(`vscode-remote://${HostRemote}+${currentDir}`)
        vscode.commands.executeCommand("vscode.openFolder", url);
    }

    openHostRemoteCommand() {
        vscode.commands.executeCommand('vscode.newWindow', {
            remoteAuthority: `${HostRemote}+`,
            reuseWindow: true
        });
    }

    dispose() {
        super.dispose();
        this._resourceLabelDisposable?.dispose();
        this._serverProcess?.kill();
    }
}