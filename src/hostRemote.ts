import { WithDisposable } from "./core/disposable";
import vscode from "vscode";
import { isInFlatpak } from "./utils/command";
import { RemoteFactory } from "./core/remoteFactory";
import { ChildProcess, spawn } from "child_process";
import path from "path";
import { logger } from "./utils/logger";

export class HostRemoteProvider extends RemoteFactory<string> {
  openCurrentFolderOnHostCommand() {
    if (!isInFlatpak) {
      vscode.window.showErrorMessage("You are not running inside a flatpak.");
      return;
    }
    const currentDir = vscode.workspace.workspaceFolders?.at(0)?.uri.path;
    if (!currentDir) {
      vscode.window.showErrorMessage("No workspace folder is open.");
      return;
    }
    const url = vscode.Uri.parse(`vscode-remote://flatpak-host+${currentDir}`);
    vscode.commands.executeCommand("vscode.openFolder", url);
  }

  openHostRemoteCommand() {
    if (!isInFlatpak) {
      vscode.window.showErrorMessage("You are not running inside a flatpak.");
      return;
    }
    vscode.commands.executeCommand("vscode.newWindow", {
      remoteAuthority: `flatpak-host+uwu`,
      reuseWindow: true,
    });
  }

  constructor() {
    super("flatpak-host");
    logger.log("HostRemoteProvider constructor");
    this.disposables.push(
      vscode.commands.registerCommand("flatpak.openCurrentFolderOnHost", this.openCurrentFolderOnHostCommand, this),
      vscode.commands.registerCommand("flatpak.openHostRemote", this.openHostRemoteCommand, this)
    );
  }

  protected parseData(data: string): string {
    return data;
  }

  protected async runServer(): Promise<ChildProcess> {
    return spawn("flatpak-spawn", [
      "--host",
      path.join(this.installDir, "node"),
      path.join(this.installDir, "out", "server-main.js"),
      "--accept-server-license-terms",
      "--without-connection-token",
      "--disable-telemetry",
    ]);
  }

  protected getResourceLabel(data?: string | undefined): vscode.ResourceLabelFormatter {
    return {
      scheme: "vscode-remote",
      authority: `flatpak-host+*`,
      formatting: {
        label: "${path}",
        separator: "/",
        tildify: true,
        workspaceSuffix: ` (flatpak-host)`,
      },
    };
  }
}
