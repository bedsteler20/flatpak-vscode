import { spawnSync } from "node:child_process";
import { buildSync } from "esbuild";
import { cpSync } from "node:fs";
import { parseArgs } from "node:util";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const isDev = process.env.NODE_ENV === "development";

const parsed = parseArgs({
  args: process.argv.slice(2),
  options: {
    vsMarket: {
      type: "boolean",
      default: false,
    },
    pack: {
      type: "boolean",
      default: false,
    },
    buildFenv: {
      type: "boolean",
      default: true,
    },
    buildExtension: {
      type: "boolean",
      default: true,
    },
  },
});

function buildExtension() {
  buildSync({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    platform: "node",
    outfile: "out/extension.js",
    external: ["vscode"],
    sourcemap: isDev,
    minify: !isDev,
    define: {
      PATCH_PACKAGE_JSON: parsed.values.vsMarket ? "true" : "false",
    },
  });
}

function buildFenv() {
  if (isDev) {
    spawnSync("cargo", ["build"], { stdio: "inherit", cwd: "fenv" });
    cpSync("fenv/target/debug/fenv", "out/fenv");
  } else {
    spawnSync("cargo", ["build", "--release"], { stdio: "inherit", cwd: "fenv" });
    cpSync("fenv/target/release/fenv", "out/fenv");
  }
}

if (parsed.values.buildExtension) buildExtension();
if (parsed.values.buildFenv) buildFenv();
