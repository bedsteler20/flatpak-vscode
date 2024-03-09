import * as vscode from 'vscode';
export abstract class Component implements vscode.Disposable {
    disposables: vscode.Disposable[] = [];

    constructor(readonly extensionContext: vscode.ExtensionContext) {
    }

    async register() {
        this.extensionContext.subscriptions.push(this);
    }

    async  connectListeners() {}
    
    async restoreState() {}

    async initialize() {}

    async registerCommand(command: string, callback: (...args: any[]) => any) {
        this.disposables.push(vscode.commands.registerCommand(command, callback, this));
    }

    public  async runLifecycle() {
        await this.register();
        await this.initialize();
        await this.connectListeners();
        await this.restoreState();
    }


    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}