import * as vscode from 'vscode';
import { logger } from '../utils/logger';

export class ManifestLocator implements vscode.Disposable {
    manifestFiles: vscode.Uri[] = [];

    public selectedManifest: vscode.Uri | undefined;

    constructor(readonly extensionContext: vscode.ExtensionContext) {
        extensionContext.subscriptions.push(
            this,
            this.createFileWatcher(),
            vscode.commands.registerCommand("flatpak.selectManifest", this.selectManifestCommand, this)
        );
        this.findManifests();
    }



    private async findManifests() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        for (const folder of workspaceFolders) {
            const manifestFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*.*.*.json'));
            this.manifestFiles = manifestFiles;
            if (manifestFiles.length === 1) {
                logger.log("Only one manifest found using:", manifestFiles[0].fsPath);
            } else if (manifestFiles.length > 1) {
                logger.log("Multiple manifest files found:", manifestFiles.map(uri => uri.fsPath));
                this.promptSelectManifest();
            } else {
                logger.log("No manifest files found");
            }
        }
    }

    private promptSelectManifest() {
        if (this.manifestFiles.length > 1) {
            vscode.window.showInformationMessage("Multiple manifest files found. Select a manifest file", "Select Manifest").then(selection => {
                if (selection === "Select Manifest") {
                    this.selectManifestCommand();
                }
            });
        }
    }

    private selectManifestCommand() {
        const manifestItems = this.manifestFiles.map(uri => {
            return {
                label: uri.fsPath,
                uri: uri
            };
        });

        vscode.window.showQuickPick(manifestItems, {
            placeHolder: "Select a manifest file"
        }).then(selected => {
            if (selected) {
                this.selectedManifest = selected.uri;
            }
        });
    }

    private createFileWatcher() {
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.*.*.[json,yaml,yml]');
        watcher.onDidCreate(this.findManifests, this);
        watcher.onDidDelete(this.findManifests, this);
        return watcher;
    }

    dispose() {

    }
}