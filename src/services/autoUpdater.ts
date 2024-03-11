import { https } from "follow-redirects";
import { createWriteStream } from "fs";
import { exec, execSync } from "child_process";
import * as vscode from "vscode";
import { getVsCodeExec } from "../core/product";
import path from "path";
import os from "os";
import { Component } from "../utils/component";

interface GithubRelease {
  tag_name: string;
  assets: {
    browser_download_url: string;
    name: string;
  }[];
}

export class AutoUpdater extends Component {
  private static readonly GITHUB_API = "https://api.github.com/repos/bedsteler20/flatpak-vscode/releases";

  public override async register() {
    super.register();
    this.registerCommand("flatpak.checkForUpdates", this.checkForUpdatesCommand);
  }

  public override async initialize() {
    this.runUpdateCheck(false);
  }

  private get currentVersion(): string {
    return this.extensionContext.extension.packageJSON.version;
  }

  public async runUpdateCheck(showUpToDate: boolean): Promise<void> {
    const release = await this.checkForUpdates();
    if (release) {
      const response = await vscode.window.showInformationMessage(
        "A new version of Flatpak VSCode is available.",
        "Download",
        "Ignore"
      );
      if (response === "Download") {
        const tmpFile = path.join(os.tmpdir(), "flatpak-vscode-update.visx");
        await this.downloadUpdate(release, tmpFile);
        await this.installUpdate(tmpFile);
      }
    } else if (showUpToDate) {
      vscode.window.showInformationMessage("Flatpak VSCode is up to date.");
    }
  }

  public async checkForUpdates(): Promise<GithubRelease | null> {
    const response = await fetch(AutoUpdater.GITHUB_API);
    const releases = (await response.json()) as GithubRelease[];

    const latestRelease = releases[0];
    if (latestRelease.tag_name.replace("v", "") !== this.currentVersion) {
      return latestRelease;
    }

    return null;
  }

  public async installUpdate(filePath: string): Promise<void> {
    vscode.window.showInformationMessage("Updating Flatpak VSCode...");
    const execPath = await getVsCodeExec();
    exec(`${execPath} --uninstall-extension bedsteler20.flatpak-vscode`).on("exit", () => {
      exec(`${execPath} --install-extension ${filePath}`).on("exit", () => {
        vscode.window.showInformationMessage(
          "Flatpak VSCode has been updated. Please restart VSCode to apply the changes."
        );
      });
    });
  }

  public downloadUpdate(release: GithubRelease, downloadPath: string): Promise<void> {
    const asset = release.assets.find((asset) => asset.name.endsWith(".visx"));
    if (!asset) {
      throw new Error("No asset found");
    }

    const file = createWriteStream(downloadPath);
    const request = https.get(asset.browser_download_url, (response) => {
      response.pipe(file);
    });

    return new Promise((resolve, reject) => {
      file.on("finish", () => {
        file.close();
        resolve();
      });

      request.on("error", (err) => {
        file.close();
        reject(err);
      });
    });
  }

  private checkForUpdatesCommand(): void {
    this.runUpdateCheck(true);
  }
}
