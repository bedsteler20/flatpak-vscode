import { spawnSync } from "child_process";
import esbuild from "esbuild";


await esbuild.build({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    platform: "node",
    outfile: "out/extension.js",
    external: ["vscode"],
});

spawnSync("")