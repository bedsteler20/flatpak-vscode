import {https} from 'follow-redirects';
import * as vscode from 'vscode';
import * as fs from 'fs';
import tar, { r } from 'tar';
import { getServerInstallDir } from './utils';
import { log } from './logger';
import path from 'path';

export function downloadTarBall(url: string, outDir: string) {
    return new Promise<void>((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
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
    log("Server download url: " + url);
    const installDir = getServerInstallDir(context);

    if (!fs.existsSync(installDir)) {
        fs.mkdirSync(installDir, { recursive: true });
    } else {
        if (fs.readdirSync(installDir).length > 0) {
            log("Server already installed");
            return;
        }
        log("server dir exists but no file were found in it")
    }

    log("Downloading server...");

    await downloadTarBall(url, installDir);

    log("server downloaded")
}

let vscodeProductJson: any;
async function getVSCodeProductJson(): Promise<ProductJson> {
    if (!vscodeProductJson) {
        const productJsonStr = await fs.promises.readFile(path.join(vscode.env.appRoot, 'product.json'), 'utf8');
        vscodeProductJson = JSON.parse(productJsonStr);
    }

    return vscodeProductJson;
}

export interface ProductJson {
    version: string;
    commit: string;
    quality: string;
    applicationName: string;
    release?: string; // vscodium-like specific
    serverApplicationName: string;
    serverDataFolderName: string;
    serverDownloadUrlTemplate?: string; // vscodium-like specific
}