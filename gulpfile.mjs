import childProcess from "child_process";
import esbuild from "esbuild";
import path from "path";
import { mkdtemp, cp, rm, readFile, writeFile } from "fs/promises";
const NODE_ENV = process.env.NODE_ENV || "development";

const VS_MARKET = process.env.VS_MARKET ? true : false;

const $ = (cmd) =>
  new Promise((resolve, reject) => {
    childProcess.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });

export const buildFenv = async () => {
  if (NODE_ENV === "development") {
    await $("cd fenv && cargo build");
    await $("cp fenv/target/debug/fenv out/fenv");
  } else {
    await $("cd fenv && cargo build --release");
    await $("cp fenv/target/release/fenv out/fenv");
  }
};

export const buildExtension = async () => {
  await esbuild({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    platform: "node",
    outfile: "out/extension.js",
    external: ["vscode"],
    sourcemap: isDev,
    minify: !isDev,
    define: {
      PATCH_PACKAGE_JSON: VS_MARKET ? "true" : "false",
    },
  });
};

export const pack = async () => {
  const tmpDir = await mkdtemp("/tmp/vscode");
  const files = (await $("vsce ls"))
    .split("\n")
    .map((line) => line.split("/")[0])
    .filter((line) => line !== "")
    .filter((line, i, arr) => arr.indexOf(line) === i);
  for (const file of files) {
    await cp(file, path.join(tmpDir, file), { recursive: true });
  }

  const packageJson = JSON.parse(await readFile(path.join(tmpDir, "package.json"), "utf-8"));

  packageJson["scripts"] = undefined;
  packageJson["devDependencies"] = undefined;
  packageJson["dependencies"] = undefined;

  if (VS_MARKET) {
    packageJson["enabledApiProposals"] = undefined;
  }

  await writeFile(path.join(tmpDir, "package.json"), JSON.stringify(packageJson, null, 2));
  await $(`cd ${tmpDir} && vsce package`);
  await $(`mv ${tmpDir}/*.vsix .`);
  await rm(tmpDir, { recursive: true });
};
