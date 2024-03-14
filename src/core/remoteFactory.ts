import { ChildProcess } from "child_process";
import { WithDisposable } from "./disposable";
import vscode from "vscode";
import path from "path";
import { extensionContext } from "../extension";
import { logger } from "../utils/logger";
import fs from "fs";
import { getVSCodeProductJson } from "./product";
import { https } from "follow-redirects";
import tar from "tar";

export abstract class RemoteFactory<T> extends WithDisposable implements vscode.RemoteAuthorityResolver {
  private _resourceLabelDisposable?: vscode.Disposable;
  private _serverProcess?: ChildProcess;

  public readonly installDir: string = path.join(
    extensionContext.globalStorageUri.fsPath,
    "servers",
    vscode.env.appCommit!
  );

  protected path?: string;

  protected abstract runServer(data: T): Promise<ChildProcess>;
  protected abstract getResourceLabel(data?: T): vscode.ResourceLabelFormatter;
  protected abstract parseData(data: string): T;

  constructor(public readonly authority: string) {
    super();
    logger.log("RemoteFactory constructor");
    logger.log("Authority: " + authority);
    this.disposables.push(
      vscode.workspace.registerRemoteAuthorityResolver(authority, this),
      vscode.workspace.registerResourceLabelFormatter(this.getResourceLabel())
    );
  }

  public resolve(authority: string) {
    logger.log("Path:", this.path);
    logger.log(`Resolving authority: ${authority}`);
    const data = this.parseData(authority.split("+")[1]);

    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Connecting to server...",
        cancellable: false,
      },
      async () => {
        this._resourceLabelDisposable?.dispose();
        this._resourceLabelDisposable = vscode.workspace.registerResourceLabelFormatter(this.getResourceLabel(data));

        await this.downloadServer();
        if (this._serverProcess === undefined || this._serverProcess.killed) {
          logger.log("Starting server process");
          this._serverProcess = await this.runServer(data);
        }

        return await new Promise<vscode.ResolverResult>((resolve) => {
          this._serverProcess!.stdout?.on("data", (data) => {
            if (data.toString().includes("Extension host agent started")) {
              logger.log("Server started");
              resolve(new vscode.ResolvedAuthority("localhost", 8000));
            }
          });
        });
      }
    );
  }

  async getCanonicalURI(uri: vscode.Uri) {
    this.path = uri.path;
    logger.log("getCanonicalURI", JSON.stringify(uri.toJSON(), null, 2));
    return vscode.Uri.parse(uri.path);
  }

  public dispose(): void {
    super.dispose();
    this._resourceLabelDisposable?.dispose();
    this._serverProcess?.kill();
  }

  private async downloadServer() {
    const product = await getVSCodeProductJson();

    let url: string;
    // this is vscodium specific and not in vscode's product.json
    // other distro's should implement this vscode is a exception here
    if (product.serverDownloadUrlTemplate) {
      url = product.serverDownloadUrlTemplate;
    } else {
      switch (product.applicationName) {
        case "vscode":
        case "vscode-insiders":
        case "code":
        case "code-insiders":
          url =
            "https://vscode.download.prss.microsoft.com/dbazure/download/${quality}/${commit}/vscode-server-${os}-${arch}.tar.gz";
          break;
        case "codium":
        case "codium-insiders":
          url =
            "https://github.com/VSCodium/vscodium/releases/download/${version}.${release}/vscodium-reh-${os}-${arch}-${version}.${release}.tar.gz";
          break;
        default:
          throw new Error("Unknown application name: " + product.applicationName);
      }
    }
    url = url
      .replaceAll("${version}", product.version)
      .replaceAll("${release}", product.release!) // vscodium specific
      .replaceAll("${commit}", product.commit)
      .replaceAll("${quality}", product.quality)
      .replaceAll("${os}", "linux")
      .replaceAll("${arch}", process.arch)
      .replaceAll("http://", "https://");

    logger.log("Server download url: " + url);

    if (!fs.existsSync(this.installDir)) {
      fs.mkdirSync(this.installDir, { recursive: true });
    } else {
      if (fs.readdirSync(this.installDir).length > 0) {
        logger.log("Server already installed");
        return;
      }
      logger.log("server dir exists but no file were found in it");
    }

    logger.log("Downloading server...");

    await new Promise<void>((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          logger.error("Failed to download server. Status code:", res.statusCode);
          reject(new Error("Failed to download server. Status code: " + res.statusCode));
          return;
        }
        const t = tar.x({
          strip: 1,
          cwd: this.installDir,
        });
        res.pipe(t);
        res.on("error", (err) => {
          reject(err);
        });
        t.on("error", (err) => {
          reject(err);
        });

        res.on("end", () => {
          resolve();
        });
      });
    });

    logger.log("server downloaded");
  }
}
