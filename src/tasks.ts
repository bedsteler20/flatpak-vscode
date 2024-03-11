import * as vscode from "vscode";
import { fenv, pickManifest } from "./fenv";

export class TaskProvider implements vscode.TaskProvider, vscode.Disposable {
    disposables: vscode.Disposable[] = [];

    public async init() {
        vscode.tasks.executeTask((await this.getInitTask())!);
    }

    public async build() {
        vscode.tasks.executeTask(this.getBuildTask());
    }

    private getBuildTask(): vscode.Task {
        return new vscode.Task(
            {
                type: "flatpak",
                target: "build",
                group: { kind: "build", isDefault: true },
            },
            vscode.TaskScope.Workspace,
            "Build",
            "Flatpak",
            fenv(["build"])
        );
    }

    private async getInitTask() {
        const manifest = await pickManifest();
        if (!manifest) {
            vscode.window.showErrorMessage("No manifest found");
            return;
        }

        return new vscode.Task(
            { type: "flatpak", target: "init" },
            vscode.TaskScope.Workspace,
            "Initialize Build Directory",
            "Flatpak",
            fenv(["gen", manifest])
        );
    }

    constructor() {
        this.disposables.push(
            vscode.tasks.registerTaskProvider("flatpak", this),
            vscode.commands.registerCommand("flatpak.build", this.build, this),
            vscode.commands.registerCommand("flatpak.init", this.init, this)
        );
    }

    public async provideTasks(token: vscode.CancellationToken) {
        return [this.getBuildTask(), (await this.getInitTask())!];
    }

    public resolveTask(
        task: vscode.Task,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Task> {
        switch (task.definition.target) {
            case "build":
                return this.getBuildTask();
            case "init":
                return this.getInitTask();
            default:
                return null;
        }
    }

    public dispose() {
        this.disposables.forEach((d) => d.dispose());
    }

    private joinTask(task: vscode.Task, override: vscode.Task): vscode.Task {
        return new vscode.Task(
            override.definition ?? task.definition,
            override.scope ?? task.scope!,
            task.name,
            task.source,
            task.execution,
            override.problemMatchers ?? task.problemMatchers
        );
    }
}
