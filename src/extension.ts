// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { TaskProvider } from "./taskProvider";
import { TerminalProvider } from "./terminalProvider";
import { HostRemoteProvider } from "./hostRemote";
import { HostRemote } from "./services/hostRemote";
import { AppRemote } from "./appRemote";
import { logger } from "./utils/logger";
import fs from "fs/promises";
import path from "path";

declare const PATCH_PACKAGE_JSON: boolean;

export let extensionContext: vscode.ExtensionContext;

export async function activate(context: vscode.ExtensionContext) {
  extensionContext = context;

  logger.info("Extension activated");


  // This is a hacky workaround to enable API proposals in the extension.
  // the vscode marketplace does not support the `enabledApiProposals` field in package.json
  // so we patch the package.json file to enable the proposals at runtime. The user will be
  // need to fully restart vscode for the changes to take effect. the PATCH_PACKAGE_JSON
  // variable is injected by the build script to indicate if the package.json should be patched
  // it will only be true when the extension is is published to the VSCode marketplace.
  if (PATCH_PACKAGE_JSON) {
    const packageJsonPath = path.join(extensionContext.extensionPath, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    if (!packageJson.enabledApiProposals) {
      const newPackageJson = {
        ...packageJson,
        enabledApiProposals: ["resolvers", "contribViewsRemote"],
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
      console.log("Updated package.json");
      await vscode.commands.executeCommand("workbench.action.toggleDevTools");
      vscode.window.showInformationMessage(
        "Flatpak: Enabling API Proposals. Please fully restart VSCode (Not just 'Reload Window')."
      );
      // This will deactivate the extension since we need to restart
      return;

    }
  }

  // Add the wrapper scripts for flatpak and flatpak builder to the PATH
  // This is necessary because the flatpak and flatpak-builder binaries are
  // not available when running in a flatpak sandbox.
  context.environmentVariableCollection.prepend("PATH", context.asAbsolutePath("bin") + ":");

  context.subscriptions.push(
    new TaskProvider(),
    new TerminalProvider(),
    new HostRemoteProvider(),
    new AppRemote()
    //
  );
}