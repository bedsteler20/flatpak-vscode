import { components } from "../extension";
import { Component } from "../utils/component";
import { FlatpakBuilderManifest } from "../utils/manifestType";
import * as fs from "fs/promises";
import * as vscode from "vscode";

export class ManifestManager extends Component {

    private _manifest?: FlatpakBuilderManifest;

    public get manifest(): FlatpakBuilderManifest | undefined {
        return this._manifest;
    }

    public override async connectListeners() {
        components.manifestLocator!.manifestChanged.event(this.loadManifest, this, this.disposables);
    }

    public override async initialize() {
        if (components.manifestLocator!.selectedManifest) {
            await this.loadManifest(components.manifestLocator!.selectedManifest);
        }
    }

    private async validateManifest(manifest: FlatpakBuilderManifest) {
        if (!manifest["app-id"] && !manifest["id"]) {
            throw new Error("Missing app-id");
        }
        if (!manifest["runtime"]) {
            throw new Error("Missing runtime");
        }
        if (!manifest["sdk"]) {
            throw new Error("Missing sdk");
        }
        if (!manifest["runtime-version"]) {
            throw new Error("Missing runtime-version");
        }

    }

    private async loadManifest(uri: vscode.Uri | undefined) {
        if (!uri) return;

        try {
            const file = await fs.readFile(uri.fsPath, "utf-8");
            const manifest = JSON.parse(file) as FlatpakBuilderManifest;
            await this.validateManifest(manifest);
        } catch (e) {
            vscode.window.showErrorMessage(`Failed to load manifest: ${e}`);
        }

    }

}