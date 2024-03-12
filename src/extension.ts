// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { TaskProvider } from "./taskProvider";
import { TerminalProvider } from "./terminalProvider";
import { HostRemoteProvider } from "./hostRemote";
import { HostRemote } from "./services/hostRemote";
import { AppRemote } from "./appRemote";
import { logger } from "./utils/logger";
import * as remoteApi from "vscode-remote-shim";

export let extensionContext: vscode.ExtensionContext;

export async function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  addPathToTerminal(context);
  logger.info("Extension activated");
  console.log("Extension activated UwU");
  //   const old = new HostRemote(context);
  //   await old.runLifecycle();
  await remoteApi.activate();
  context.subscriptions.push(
    new TaskProvider(),
    new TerminalProvider(),
    new HostRemoteProvider(),
    new AppRemote()
    //
  );
}

function addPathToTerminal(context: vscode.ExtensionContext) {
  context.environmentVariableCollection.prepend("PATH", context.asAbsolutePath("bin") + ":");
}
