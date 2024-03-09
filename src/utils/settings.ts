import * as vscode from "vscode";
export class Settings {
    private static get internal() {
        return vscode.workspace.getConfiguration("bedsteler20.flatpak")
    }

    public static workspaceFolder(): string {
        return vscode.workspace.workspaceFolders![0].uri.fsPath;
    }

    public static get hostShell(): string {
        return Settings.internal.get("hostShell") as string;
    }

    public static get useFlatpakedFlatpakBuilder(): boolean {
        return Settings.internal.get("useFlatpakedFlatpakBuilder") as boolean;
    }

    public static get metadataDir(): string {
        return (Settings.internal.get("metadataDir") as string)
            .replace("${workspaceFolder}", Settings.workspaceFolder());
    }
}