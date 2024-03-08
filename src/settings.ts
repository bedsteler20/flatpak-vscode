import * as vscode from "vscode";
export class Settings {
    private static get internal() {
        return vscode.workspace.getConfiguration("bedsteler20.flatpak")
    }

    public static get hostShell(): string {
        return Settings.internal.get("hostShell") as string;
    }
}