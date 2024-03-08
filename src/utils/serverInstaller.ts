import { https } from 'follow-redirects';
import * as vscode from 'vscode';
import * as fs from 'fs';
import tar from 'tar';
import { getServerInstallDir } from './utils';
import { logger } from './logger';
import { ProductJson, getVSCodeProductJson } from './vsUtils';

export function downloadTarBall(url: string, outDir: string) {
    return new Promise<void>((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                logger.error("Failed to download server. Status code:", res.statusCode);
                reject(new Error("Failed to download server. Status code: " + res.statusCode));
                return;
            }
            const t = tar.x({
                strip: 1,
                cwd: outDir
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
}


function formatUrl(url: string, product: ProductJson): string {
    return url
        .replaceAll('${version}', product.version)
        .replaceAll('${release}', product.release!) // vscodium specific
        .replaceAll('${commit}', product.commit)
        .replaceAll('${quality}', product.quality)
        .replaceAll('${os}', 'linux')
        .replaceAll('${arch}', process.arch)
        .replaceAll("http://", "https://");
}

async function getDownloadUrl(): Promise<string> {
    const product = await getVSCodeProductJson();

    // this is vscodium specific and not in vscode's product.json
    // other distro's should implement this vscode is a exception here
    if (product.serverDownloadUrlTemplate) {
        return formatUrl(product.serverDownloadUrlTemplate, product);
    } else if (product.applicationName == "codium" || product.applicationName == "codium-insiders") {
        return formatUrl('https://github.com/VSCodium/vscodium/releases/download/${version}.${release}/vscodium-reh-${os}-${arch}-${version}.${release}.tar.gz', product);
    } else if (product.applicationName === "code" || product.applicationName === "code-insiders") {
        return formatUrl("https://vscode.download.prss.microsoft.com/dbazure/download/${quality}/${commit}/vscode-server-${os}-${arch}.tar.gz", product);
    }

    throw new Error("Unsupported vscode product name. Please open an issue on the github repo. with the product name and version.");
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
        logger.log("server dir exists but no file were found in it")
    }

    logger.log("Downloading server...");

    await downloadTarBall(url, installDir);

    logger.log("server downloaded")
}
