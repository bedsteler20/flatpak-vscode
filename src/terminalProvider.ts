import * as vscode from "vscode";
import { Settings } from "./core/settings";
import { WithDisposable } from "./core/disposable";
import { TerminalFactory } from "./core/terminalFactory";
import { fenv } from "./fenv";

export class TerminalProvider extends WithDisposable {
  hostTerminal = new TerminalFactory("flatpak-host", {
    name: "Flatpak Host",
    shellPath: "/usr/bin/flatpak-spawn",
    shellArgs: ["--host", "--env=TERM=xterm-256color", Settings.hostShell],
  });

  appShell = new TerminalFactory("flatpak-app", {
    name: "Flatpak App",
    shellPath: fenv(["shell"]).command as string,
    shellArgs: [...(fenv(["shell"]).args as string[])],
  });

  sdkShell = new TerminalFactory("flatpak-sdk", {
    name: "Flatpak SDK",
    shellPath: fenv(["sdk-shell"]).command as string,
    shellArgs: [...(fenv(["sdk-shell"]).args as string[])],
  });

  constructor() {
    super();
    this.disposables.push(
      this.hostTerminal.register(),
      this.hostTerminal.command("flatpak.openHostTerminal"),
      this.appShell.register(),
      this.appShell.command("flatpak.openAppTerminal"),
      this.sdkShell.register(),
      this.sdkShell.command("flatpak.openSdkTerminal")
    );
  }
}
