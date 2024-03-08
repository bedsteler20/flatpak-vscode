import * as vscode from "vscode";

function getNormalizedAppName(): string {
    return vscode.env.appName.replaceAll(" ", "-").toLowerCase();
}

function getDownloadUrl(): string {
    if (vscode.env.appName === "VS Code") {
        return `https://vscode.download.prss.microsoft.com/dbazure/download/${vscode.env.appQuality}/${vscode.env.appCommit}/vscode-server-linux-x64.tar.gz`
    } else {
        throw new Error("Unsupported vscode distro")
    } 
}

function getInstallDir(): string {
    return `$HOME/.local/share/vscode-flatpak/servers/${getNormalizedAppName()}/${vscode.env.appQuality}/${vscode.env.appCommit}/`
}


function getInstallScript(): string {
    return `
    INSTALL_DIR="${getInstallDir()}"
    mkdir -p $INSTALL_DIR
    curl -s -L ${getDownloadUrl()} | tar xvz - -C $INSTALL_DIR
    `;
}

function getRunScript(): string {
    
    return `
    INSTALL_DIR="${getInstallDir()}"
    exec $INSTALL_DIR/node $INSTALL_DIR/out/server-main.js \\
        --accept-server-license-terms \\
        --port 8000 \\
        --without-connection-token \\
        --disable-telemetry
    `;
}

