When setting up the flatpak envierment for a app that vscode will run in we can use 
```bash
flatpak run --app-path=${workspaceFolder}/.flatpak/repo/files --command=${serverExec} ${sdk}
```

app path will be read olny to vscode but flatpak builder will update the contence of the folder from outside the flatpak envierment. 
