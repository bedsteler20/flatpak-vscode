// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { TaskProvider } from "./taskProvider";
import { TerminalProvider } from "./terminalProvider";
import { HostRemoteProvider } from "./remote";
import { HostRemote } from "./services/hostRemote";

export let extensionContext: vscode.ExtensionContext;

export async function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
//   const old = new HostRemote(context);
//   await old.runLifecycle();

  context.subscriptions.push(new TaskProvider(), new TerminalProvider(), new HostRemoteProvider());
}
