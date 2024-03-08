yes | vsce package
flatpak run com.vscodium.codium --uninstall-extension bedsteler20.flatpak
flatpak run com.vscodium.codium --install-extension *.vsix
flatpak run com.vscodium.codium --wait --new-window $@