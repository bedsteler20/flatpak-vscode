import * as vscode from 'vscode';
import * as fs from 'fs';
import { logger } from '../utils/logger';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import { getServerInstallDir } from '../utils/utils';
import { downloadServer } from '../utils/serverInstaller';
import { Component } from '../utils/component';
import { Command } from '../utils/command';

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
        this._serverProcess = new Command(path.join(serverDir, "node"), [
            path.join(serverDir, "out", "server-main.js"),
            "--accept-server-license-terms",
            "--without-connection-token",
            "--disable-telemetry"
        ], {
            useHost: true
        }).spawn();
    }

    openCurrentFolderOnHostCommand() {
        const currentDir = vscode.workspace.workspaceFolders?.at(0)?.uri.path;
        const url = vscode.Uri.parse(`vscode-remote://${REMOTE_HOST_AUTHORITY}+${currentDir}`)
        vscode.commands.executeCommand("vscode.openFolder", url);
    }

    openHostRemoteCommand() {
        vscode.commands.executeCommand('vscode.newWindow', {
            remoteAuthority: `${REMOTE_HOST_AUTHORITY}+`,
            reuseWindow: true
        });
    }

    dispose() {
        super.dispose();
        this._resourceLabelDisposable?.dispose();
        this._serverProcess?.kill();
    }
}