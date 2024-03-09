import { ChildProcessWithoutNullStreams as Process, SpawnOptions, SpawnOptionsWithoutStdio, spawn } from "node:child_process";
import { Settings } from "./settings";

export const isInFlatpak = process.env.FLATPAK_ID !== undefined;

export function spawnHostFlatpak(args: string[], options?: SpawnOptionsWithoutStdio): Process {
    return spawn("flatpak-spawn", ["--watch-bus", "--host", ...args], options);
}


export function flatpakBuilder(args: string[], options?: SpawnOptionsWithoutStdio): Process {
    if (Settings.useFlatpakedFlatpakBuilder) {
        return flatpak.run("org.flatpak.Builder", args);
    }
    if (isInFlatpak) {
        return spawnHostFlatpak(["flatpak-builder", ...args], options);
    } else {
        return spawn("flatpak-builder", args, options);
    }
}


module flatpak {
    function base(args: string[]): Process {
        if (isInFlatpak) {
            return spawnHostFlatpak(args);
        } else {
            return spawn("flatpak", args);
        }
    }

    export function run(app: string, args: string[], runArgs?: string[]): Process {
        return base(["run", ...(runArgs ?? []), app, ...args]);
    }

    export function buildInit(options: {
        sdk: string;
        platform: string;
        platformVersion: string;
        buildDir: string;
        appID: string;
    }): Process {

        return base(["build-init", options.buildDir, options.appID, options.sdk, options.platform, options.platformVersion]);
    }

}