import * as vscode from "vscode";

export class TaskFactory {
    /**
     * Represents a TaskFactory that creates tasks based on the provided parameters.
     */
    constructor(
        private readonly params: {
            type: string;
            target: string;
            name: string;
            execution: () =>
                | Promise<vscode.ShellExecution | undefined>
                | vscode.ShellExecution
                | undefined;
            group?: { kind: string; isDefault: boolean };
        }
    ) {}

    /**
     * Creates a partial task with the specified parameters. The partial task does not include the execution.
     * @returns A new vscode.Task object representing the partial task.
     */
    public partialTask(): vscode.Task {
        return new vscode.Task(
            {
                type: this.params.type,
                target: this.params.target,
                group: this.params.group,
            },
            vscode.TaskScope.Workspace,
            this.params.name,
            "Flatpak"
        );
    }

    /**
     * Creates a full task with the given parameters.
     * @returns A new vscode.Task object.
     */
    public async fullTask(): Promise<vscode.Task> {
        return new vscode.Task(
            {
                type: this.params.type,
                target: this.params.target,
                group: this.params.group,
            },
            vscode.TaskScope.Workspace,
            this.params.name,
            "Flatpak",
            await this.params.execution()
        );
    }

    /**
     * Registers a command with the given ID and associates it with a task.
     * @param id The ID of the command.
     * @returns A disposable object that can be used to unregister the command.
     */
    public  command(id: string): vscode.Disposable {
        return vscode.commands.registerCommand(
            id,
            async () => {
                this.execute();
            },
            this
        );
    }

    public async execute(): Promise<void> {
        const task = await this.fullTask();
        await vscode.tasks.executeTask(task);
    }
}



export function joinTask(task: vscode.Task, override?: vscode.Task): vscode.Task {
    return new vscode.Task(
        override?.definition ?? task.definition,
        override?.scope ?? task.scope!,
        task.name,
        task.source,
        task.execution,
        override?.problemMatchers ?? task.problemMatchers
    );
}