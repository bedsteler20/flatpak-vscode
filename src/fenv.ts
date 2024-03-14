import path from "path";
import vscode from "vscode";
import { Settings } from "./core/settings";
import { extensionContext } from "./extension";
import fs from "fs";

/**
 * Configuration for the Fenv tool
 */
export interface FenvConfig {
  environment: {
    root: string;
    manifest: string;
  };
}

/**
 * Loads the manifest from the fenv configuration file.
 * @returns A promise that resolves to the loaded manifest, or undefined if the configuration file does not exist.
 */
export async function loadManifest(): Promise<FenvConfig | undefined> {
  const configPath = path.join(Settings.workspaceFolder(), ".flatpak", "config.json");
  if (!fs.existsSync(configPath)) {
    return undefined;
  }
  const config = await vscode.workspace.fs.readFile(vscode.Uri.file(configPath));
  const manifest = JSON.parse(config.toString());
  return manifest;
}

/**
 * Retrieves the path of a selected manifest file.
 * If a manifest is already loaded, it returns the path of the loaded manifest.
 * Otherwise, it prompts the user to select a manifest file from the workspace.
 * @returns The path of the selected manifest file, or undefined if no manifest is selected.
 */
export async function pickManifest(): Promise<string | undefined> {
  const loaded = await loadManifest();
  if (loaded) {
    return loaded.environment.manifest;
  }
  const foundFiles = (await vscode.workspace.findFiles("**/*.*.*.json"))
    .map((uri) => uri.fsPath)
    .map((path) => path.replace(Settings.workspaceFolder() + "/", ""))
    .filter((path) => !path.startsWith(".flatpak"));
  const selected = await vscode.window.showQuickPick(foundFiles, {
    title: "Select a manifest",
  });

  if (!selected) return;

  return path.join(Settings.workspaceFolder(), selected);
}

/**
 * Executes the fenv command with the provided arguments.
 * If running inside a Flatpak environment, it uses flatpak-spawn to execute the command.
 * Otherwise, it directly executes the command.
 *
 * @param args - The arguments to pass to the fenv command.
 * @returns A `vscode.ShellExecution` object representing the execution of the fenv command.
 */
export function fenv(args: string[]): vscode.ShellExecution {
  const fenvPath = path.join(extensionContext.extensionPath, "out", `fenv`);

  if (process.env.FLATPAK_ID) {
    return new vscode.ShellExecution("flatpak-spawn", ["--host", "--watch-bus", fenvPath, ...args]);
  } else {
    return new vscode.ShellExecution(fenvPath, args);
  }
}
