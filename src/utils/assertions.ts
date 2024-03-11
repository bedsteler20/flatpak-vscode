import * as vscode from "vscode";
import { Settings } from "./settings";
import path from "path";
import fs from "fs";

export function ensureWorkspaceOpen() {
    if (!isWorkspaceOpen()) {
        throw new Error("No workspace open");
    }
}


export function ensureBuildDirInitialized() {
    if (!isBuildDirInitialized()) {
        throw new Error("Build directory not initialized");
    }
}

export function isBuildDirInitialized() {
    const buildDir = path.join(Settings.metadataDir, "repo", "metadata");
    return fs.existsSync(buildDir);
}

export function isWorkspaceOpen() {
    return vscode.workspace.workspaceFolders !== undefined;
}
