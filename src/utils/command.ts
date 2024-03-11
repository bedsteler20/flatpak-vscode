import { ChildProcessWithoutNullStreams as Process, SpawnOptions, SpawnOptionsWithoutStdio, SpawnSyncReturns, spawn, spawnSync } from "node:child_process";
import { Settings } from "./settings";
import * as vscode from "vscode";
import path from "node:path";
import { extensionContext } from "../extension";

export const isInFlatpak = process.env.FLATPAK_ID !== undefined;

export interface CommandOptions {
    cwd?: string;
    useHost?: boolean;
}

export class Command {
    constructor(
        private readonly executable: string,
        private readonly args: string[],
        private readonly options: CommandOptions = {}
    ) { }

    private getExec() {
        if (this.options.useHost && isInFlatpak) {
            return "flatpak-spawn";
        } else {
            return this.executable;
        }
    }

    private getArgs() {
        if (this.options.useHost && isInFlatpak) {
            return ["--watch-bus", "--host", this.executable, ...this.args];
        } else {
            return this.args;
        }
    }

    spawn(options?: SpawnOptionsWithoutStdio): Process {
        return spawn(this.getExec(), this.getArgs(), {
            cwd: this.options.cwd,
            ...options
        });
    }

    spawnSync(options?: SpawnOptions): SpawnSyncReturns<string | Buffer> {
        return spawnSync(this.getExec(), this.getArgs(), {
            cwd: this.options.cwd,
            ...options
        });
    }

    runInTerminal(terminalName: string): vscode.Terminal {
        return vscode.window.createTerminal(terminalName, this.getExec(), this.getArgs());
    }

    shellExecution(): vscode.ShellExecution {
        return new vscode.ShellExecution(`${this.getExec()} ${this.getArgs().join(" ")}`, {
            cwd: this.options.cwd
        });
    }
}

export function fenv(args: string[]) {
    const fsPath = extensionContext.extensionPath;
    const fenvPath = path.join(fsPath, "node_modules", "fenv", "target", "release", "fenv");

    return new Command(fenvPath, args, {
        cwd: Settings.workspaceFolder(),
        useHost: true,
    });
}