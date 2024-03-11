import { https } from "follow-redirects";
import * as vscode from "vscode";
import * as fs from "fs";
import tar from "tar";
import { logger } from "../utils/logger";
import { ProductJson, getVSCodeProductJson } from "./product";
import path from "path";

async function getDownloadUrl(): Promise<string> {
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
  return url
    .replaceAll("${version}", product.version)
    .replaceAll("${release}", product.release!) // vscodium specific
    .replaceAll("${commit}", product.commit)
    .replaceAll("${quality}", product.quality)
    .replaceAll("${os}", "linux")
    .replaceAll("${arch}", process.arch)
    .replaceAll("http://", "https://");
}

export function getServerInstallDir(context: vscode.ExtensionContext) {
  const appName = vscode.env.appName.replace(/ /g, "-").toLowerCase();
  const dirname = `${appName}-${vscode.env.appQuality}-${vscode.env.appCommit}-server`;
  return path.join(context.globalStorageUri.fsPath, "servers", dirname);
}

export async function downloadServer(context: vscode.ExtensionContext) {
  const url = await getDownloadUrl();
  logger.log("Server download url: " + url);
  const installDir = getServerInstallDir(context);

  if (!fs.existsSync(installDir)) {
    fs.mkdirSync(installDir, { recursive: true });
  } else {
    if (fs.readdirSync(installDir).length > 0) {
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
        cwd: installDir,
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
