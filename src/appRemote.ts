import { ChildProcess, spawn } from "child_process";
import { ResourceLabelFormatter } from "vscode-remote-shim";
import { RemoteFactory } from "./core/remoteFactory";
import { fenv } from "./fenv";
import path from "path";
import vscode from "vscode";
import { logger } from "./utils/logger";

export class AppRemote extends RemoteFactory<string> {
  constructor() {
    super("flatpak-app");
    this.disposables.push(vscode.commands.registerCommand("flatpak.openAppRemote", this.openAppRemoteCommand, this));
  }

  openAppRemoteCommand() {
    const currentDir = vscode.workspace.workspaceFolders?.at(0)?.uri.path;
    if (!currentDir) {
      vscode.window.showErrorMessage("No workspace folder is open.");
      return;
    }

    const url = vscode.Uri.parse(`vscode-remote://flatpak-app+${currentDir}`);
    logger.log("Opening app remote: " + url);
    vscode.commands.executeCommand("vscode.openFolder", url);
  }

  protected async runServer(): Promise<ChildProcess> {
    const exec = fenv(["start-server", `--server-dir=${this.installDir}`]);
    logger.log("Running server: " + exec.command + " " + exec.args.join(" "));
    const cp = spawn(exec.command as string, exec.args as string[], {
      cwd: this.path,
    });

    cp.on("exit", (code, signal) => {
      if (code !== 0) {
        vscode.window.showErrorMessage("Server exited with code " + code);
        logger.log("Server exited with code " + code);
      }
  });

    logger.logProcess(cp, "AppRemote.log");

    return cp;
  }
  protected getResourceLabel(data?: string | undefined): ResourceLabelFormatter {
    return {
      scheme: "vscode-remote",
      authority: `flatpak-app+`,
      formatting: {
        label: "${path}",
        separator: "/",
        tildify: true,
        workspaceSuffix: ` (flatpak-app)`,
      },
    };
  }
  protected parseData(data: string): string {
    return data;
  }
}
