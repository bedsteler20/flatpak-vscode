import * as vscode from "vscode";
import { fenv, pickManifest } from "./fenv";
import { TaskFactory, joinTask } from "./core/taskFactory";
import { WithDisposable } from "./core/disposable";

export class TaskProvider extends WithDisposable implements vscode.TaskProvider {
  disposables: vscode.Disposable[] = [];

  buildTask = new TaskFactory({
    type: "flatpak",
    target: "build",
    name: "Build",
    group: { kind: "build", isDefault: true },
    execution: () => fenv(["build"]),
  });

  initTask = new TaskFactory({
    type: "flatpak",
    target: "init",
    name: "Initialize Build Directory",
    execution: async () => {
      const manifest = await pickManifest();
      if (!manifest) {
        vscode.window.showErrorMessage("No manifest found");
        return;
      }
      return fenv(["gen", manifest]);
    },
  });

  runTask = new TaskFactory({
    type: "flatpak",
    target: "run",
    name: "Run",
    group: { kind: "test", isDefault: true },
    execution: () => fenv(["run"]),
  });

  constructor() {
    super();
    this.disposables.push(
      vscode.tasks.registerTaskProvider("flatpak", this),
      this.buildTask.command("flatpak.build"),
      this.initTask.command("flatpak.init"),
      this.runTask.command("flatpak.run")
    );
  }

  public async provideTasks() {
    return [this.buildTask.partialTask(), this.initTask.partialTask(), this.runTask.partialTask()];
  }

  public async resolveTask(task: vscode.Task) {
    switch (task.definition.target) {
      case "build":
        return joinTask(task, await this.buildTask.fullTask());
      case "init":
        return joinTask(task, await this.initTask.fullTask());
      case "run":
        return joinTask(task, await this.runTask.fullTask());
      default:
        return null;
    }
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
