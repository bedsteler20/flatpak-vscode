import { components } from "../extension";
import { isBuildDirInitialized, isManifestSelected } from "../utils/assertions";
import { fenv } from "../utils/command";
import { Component } from "../utils/component";
import * as vscode from 'vscode';

export class TaskProvider extends Component implements vscode.TaskProvider {
    public override async register() {
        super.register();

        this.registerCommand("flatpak.initBuildDir", this.initBuildDirCommand);
        this.disposables.push(vscode.tasks.registerTaskProvider("flatpak", this));
    }


    private getBuildTask(descriptor?: any, scope?: any): vscode.Task {
        return new vscode.Task(
            descriptor ?? {
                type: "flatpak",
                target: "build",
                group: {
                    kind: "build",
                    isDefault: true
                },
            },
            scope ?? vscode.TaskScope.Workspace,
            "Build",
            "Flatpak",
            fenv(["build"]).shellExecution()
        );
    }

    private getBuildInitTask(descriptor?: any, scope?: any): vscode.Task {
        const manifestPath = components.manifestLocator!.selectedManifest!.fsPath;

        return new vscode.Task(
            descriptor ?? {
                type: "flatpak",
                target: "build-init"
            },
            scope ?? vscode.TaskScope.Workspace,
            "Initialize Build Directory",
            "Flatpak",
            isBuildDirInitialized() ?
                new vscode.ShellExecution("echo Build directory already initialized") :
                fenv(["gen", manifestPath]).shellExecution()
        )
    }

    provideTasks(token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
        if (!isManifestSelected()) {
            return undefined;
        }
        return [
            this.getBuildTask(),
            this.getBuildInitTask()
        ]
    }
    async resolveTask(_task: vscode.Task, token: vscode.CancellationToken) {
        const definition = <any>_task.definition;

        if (!isManifestSelected()) {
            vscode.window.showErrorMessage("No manifest selected");
            return undefined;
        }

        if (definition.target === "build") {
            if (!isBuildDirInitialized()) {
                await vscode.tasks.executeTask(this.getBuildInitTask());
            }
            return this.getBuildTask(definition, _task.scope);
        } else if (definition.target === "build-init") {
            return this.getBuildInitTask(definition, _task.scope);
        }

    }

    initBuildDirCommand() {
        vscode.tasks.executeTask(this.getBuildInitTask());
    }
}