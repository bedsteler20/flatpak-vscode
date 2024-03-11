import path from "path";
import vscode from "vscode";
import { Settings } from "./utils/settings";
import { extensionContext } from "./extension";
import fs from "fs";
export interface FenvConfig {
    environment: {
        root: string;
        manifest: string;
    };
}

export async function loadManifest(): Promise<FenvConfig | undefined> {
    const configPath = path.join(
        Settings.workspaceFolder(),
        ".flatpak",
        "config.json"
    );
    if (!fs.existsSync(configPath)) {
        return undefined;
    }
    const config = await vscode.workspace.fs.readFile(
        vscode.Uri.file(configPath)
    );
    const manifest = JSON.parse(config.toString());
    return manifest;
}

export async function pickManifest() {
    const loaded = await loadManifest();
    if (loaded) {
        return loaded.environment.manifest;
    }
    const foundFiles = (await vscode.workspace.findFiles("**/*.*.*.json"))
        .map((uri) => uri.fsPath)
        .map((path) => path.replace(Settings.workspaceFolder() + "/", ""))
        .filter((path) => !path.startsWith(".flatpak"));
    const selected = await vscode.window.showQuickPick(foundFiles, {
        title: "Select a manifest",
    });

    if (!selected) return;

    return path.join(Settings.workspaceFolder(), selected);
}

export function fenv(args: string[]): vscode.ShellExecution {
    const fenvPath = path.join(
        extensionContext.extensionPath,
        "out",
        `fenv-${process.arch}`
    );

    if (process.env.FLATPAK_ID) {
        return new vscode.ShellExecution("flatpak-spawn", [
            "--host",
            "--watch-bus",
            fenvPath,
            ...args,
        ]);
    } else {
        return new vscode.ShellExecution(fenvPath, args);
    }
}
