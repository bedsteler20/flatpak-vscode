import path from 'path';
import fs from 'fs';
import vscode from 'vscode';


let vscodeProductJson: any;
export  function getVSCodeProductJson(): Promise<ProductJson> {
    if (!vscodeProductJson) {
        const productJsonStr =  fs.readFileSync(path.join(vscode.env.appRoot, 'product.json'), 'utf8');
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
    dataFolderName: string;
    serverDownloadUrlTemplate?: string; // vscodium-like specific
}

export async function getVsCodeExec(): Promise<string> {
    const appPfx = path.join(vscode.env.appRoot, "..", "..");
    const product = await getVSCodeProductJson();
    const appName = product.applicationName;
    return path.join(appPfx, "bin", appName);
}