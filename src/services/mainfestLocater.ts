import * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { Component } from '../utils/component';

export class ManifestLocator extends Component {
    manifestFiles: vscode.Uri[] = [];

    private _selectedManifest: vscode.Uri | undefined;

    public get selectedManifest(): vscode.Uri | undefined {
        return this._selectedManifest ?? this.manifestFiles[0];
    }

    public set selectedManifest(uri: vscode.Uri | undefined) {
        this.extensionContext.workspaceState.update("selectedManifest", this._selectedManifest);
        this._selectedManifest = uri;
        this.manifestChanged.fire(uri);
    }

    public override async register() {
        super.register();
        this.registerCommand("flatpak.selectManifest", this.selectManifestCommand);
        
        // Exclude .flatpak directory from file watching
        const config = vscode.workspace.getConfiguration("files");
        const excludes = config.get<Record<string, boolean>>("watcherExclude") ?? {};
        excludes["**/.flatpak"] = true;
        await config.update("watcherExclude", excludes);
        
    }

    public override async initialize() {
        await this.findManifests(true);
    }

    public override async connectListeners() {
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.*.*.json');
        watcher.onDidCreate(() => this.findManifests(), this);
        watcher.onDidDelete(() => this.findManifests(), this);
        this.disposables.push(watcher);
    }

    public override async restoreState() {
        const savedManifest = this.extensionContext.workspaceState.get<vscode.Uri>("selectedManifest");
        if (savedManifest && this.manifestFiles.includes(savedManifest)) {
            logger.log("Using saved manifest:", savedManifest.fsPath);
            this.selectedManifest = savedManifest;
        } else {
            logger.log("No saved manifest found");
            if (this.manifestFiles.length > 1) {
                this.promptSelectManifest();
            }
        }
    }

    public manifestChanged = new vscode.EventEmitter<vscode.Uri | undefined>();

    private async findManifests(noPrompt: boolean = false) {
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
                if (!noPrompt) {
                    this.promptSelectManifest();
                }
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


    dispose() {
        this.manifestChanged.dispose();
        super.dispose();
    }
}