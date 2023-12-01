# Keymapping Sync 💻

This extension syncs keybindings between multiple OSs. Currently, it can sync between Windows, Linux and MacOS.

## Features ✨

- Sync keybindings between multiple OSs with **customizable modifier key mapping**.
- Define **OS specific keybindings** for the same command.

## Extension Settings ⚙️

- `keybindingSync.modifierMapping`: Defines the modifier key mapping between different OSs when syncing. For example, if you want `ctrl` in config file to be mapped to `Cmd` in MacOS, you can set the mapping as follows:

    ```json
    "keybindingSync.modifierMapping": {
        "shift": {
            "mac": "Shift",
            "win": "Shift",
            "linux": "Shift"
        },
        "ctrl": {
            "mac": "Cmd",
            "win": "Ctrl",
            "linux": "Ctrl"
        },
        "alt": {
            "mac": "Alt",
            "win": "Alt",
            "linux": "Alt"
        },
        "gui": {
            "mac": "Ctrl",
            "win": "Win",
            "linux": "Meta"
        }
    }
    ```

    For `"key": "ctrl+o"`, it will be mapped `"key": "ctrl+o"` on Windows and Linux, it will be mapped to `"key": "cmd+o"` on MacOS.

    The name of modifier keys can be found [here](https://code.visualstudio.com/docs/getstarted/keybindings#_accepted-keys).

- `keybindingSync.keybindings`: Defines the keybindings for different OSs using [VSCode Keybinding rules](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-rules). But this extension add the ability to set keymapping for specific OS. For example, if you want to use `ctrl+o` in Windows and Linux, but `cmd+o` in MacOS, you can set the keybindings as follows:

    ```json
    "keybindingSync.keybindings": {
        {
            "key": "ctrl+o",
            "mac": "cmd+o",
            "command": "workbench.action.quickOpen"
        }
    }
    ```

    Only the `key` field is synced. So, if you just define `mac`, `win` or `linux` keybinding, it will be used for that particular OS. And they have higher priority that `key` field don't overwrite them.

- `keybindingSync.keybindingsPath`: because VSCode doesn't support reading and writing keybindings from and to `keybindings.json` file, or dynamically register keybindings. So this extension overwrite the `keybindings.json` file with the keybindings defined in this setting. I know this is not a good solution, but it's the only way I can think of to make this extension work.

    ```json
    "keybindingSync.keybindingsPath": {
        "mac": "~/Library/Application Support/Code/User/keybindings.json",
        "win": "%APPDATA%\\Code\\User\\keybindings.json",
        "linux": "~/.config/Code/User/keybindings.json"
    }
    ```

    The default value is the default path of `keybindings.json` file for each OS. For now it only support `~/` and `%APPDATA%` environment variables.

- `keybinding-sync.autoWrite`: If set to `true`, the extension will automatically overwrite the `keybindings.json` file when the extension is activated. Default is `false`.

## Usage 🔨

Before you overwrite the `keybinding.json` file, this extension will make a backup of the original file in `keybinding.json.bak` file.

Run command `keybinding-sync.overwrite` to sync keybindings, and `keybinding-sync.restore` if you accidentally overwrite your `keybinding.json` file.

---

## Contributing ❤️

Welcome to open issues and pull requests, or any suggestions.

## TODO 📝

- [ ] Add support to read keybindings from `keybindings.json` file.
- [x] Maybe add support to auto overwrite `keybindings.json`.
