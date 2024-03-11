import * as vscode from "vscode";
export abstract class WithDisposable implements vscode.Disposable {
    disposables: vscode.Disposable[] = [];

    public dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}
