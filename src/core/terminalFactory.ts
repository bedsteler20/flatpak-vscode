import * as vscode from "vscode";
import { WithDisposable } from "./disposable";
export class TerminalFactory implements vscode.TerminalProfileProvider {
  constructor(
    private readonly name: string,
    private readonly profile: vscode.TerminalOptions) {
  }

  provideTerminalProfile(token: vscode.CancellationToken): vscode.TerminalProfile {
    return {
      options: this.profile,
    };
  }

  public register(): vscode.Disposable {
    return vscode.window.registerTerminalProfileProvider(this.name, this);
  }

  public openTerminal() {
    const terminal = vscode.window.createTerminal(this.profile);
    terminal.show();
  }

  public command(id: string): vscode.Disposable {
    return vscode.commands.registerCommand(id, () => {
      this.openTerminal();
    });
  }
}
