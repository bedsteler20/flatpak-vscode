import { spawnSync } from "child_process";
import esbuild from "esbuild";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const isDev = process.env.NODE_ENV === "development";

const start = Date.now();
await esbuild.build({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    platform: "node",
    outfile: "out/extension.js",
    external: ["vscode"],
    sourcemap: isDev,
    minify: !isDev,
});
const end = Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    (Date.now() - start) / 1000
);
console.log(
    `    \x1b[1m\x1b[32mFinished\x1b[0m esbuild [extension.js + ${process.env.NODE_ENV}] target(s) in ${end}s`
);

if (isDev) {
    spawnSync("cargo", ["build"], { stdio: "inherit", cwd: "fenv" });
    spawnSync("cp", ["fenv/target/debug/fenv", "out/fenv-x64"], {
        stdio: "inherit",
    });
} else {
    spawnSync("cargo", ["build", "--release"], {
        stdio: "inherit",
        cwd: "fenv",
    });
    spawnSync("cp", ["fenv/target/release/fenv", "out"], { stdio: "inherit" });
}
