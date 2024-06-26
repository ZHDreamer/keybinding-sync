import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as process from "process";

const extensionID = "keybinding-sync";
const comment = "// This file is generated by the keybinding-sync extension\n";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand(extensionID + ".overwrite", overwrite));
    context.subscriptions.push(vscode.commands.registerCommand(extensionID + ".restore", restore));

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (!vscode.workspace.getConfiguration(extensionID).get<boolean>("autoWrite")) {
                return;
            }
            if (
                e.affectsConfiguration(extensionID + ".keybindings") ||
                e.affectsConfiguration(extensionID + ".keymap")
            ) {
                overwrite();
            }
        })
    );
}

export function deactivate() {}

enum Platform {
    Mac = "mac",
    Win = "win",
    Linux = "linux",
}

const platformMap: { [key: string]: Platform } = {
    darwin: Platform.Mac,
    win32: Platform.Win,
    linux: Platform.Linux,
};

interface PlatformConfig {
    mac: string;
    win: string;
    linux: string;
}

interface Keybinding {
    key?: string;
    mac?: string;
    win?: string;
    linux?: string;
    command: string;
    args?: any;
    when?: string;
}

interface Keymap {
    shift: PlatformConfig;
    ctrl: PlatformConfig;
    alt: PlatformConfig;
    gui: PlatformConfig;
}

function overwrite() {
    const platform = platformMap[os.platform()];
    if (!platform) {
        vscode.window.showErrorMessage("Unsupported platform: " + os.platform());
        return;
    }

    const keybindingsPath = getKeybindingsPath(platform);
    if (!keybindingsPath) {
        vscode.window.showErrorMessage("No keybindingsPath found in configuration, aborting");
        return;
    }

    let keybindings = vscode.workspace.getConfiguration(extensionID).get<Keybinding[]>("keybindings");
    if (!keybindings) {
        vscode.window.showErrorMessage("No keybindings found in configuration, aborting");
        return;
    }

    const keymap = vscode.workspace.getConfiguration(extensionID).get<Keymap>("keymap");
    if (!keymap) {
        vscode.window.showErrorMessage("No keymaps found in configuration, aborting");
        return;
    }

    keybindings = parseKeybindings(keybindings, keymap, platform);

    // Backup keybindings if not already backed up
    // Skip if already handled by this extension
    const originalKeybindings = fs.readFileSync(keybindingsPath, "utf8");
    if (!originalKeybindings.startsWith(comment)) {
        backupKeybindings(keybindingsPath);
        writeKeybindings(keybindingsPath, keybindings);
        vscode.window.showInformationMessage("Overwrote keybindings. Restore with: " + extensionID + ".restore");
    } else {
        writeKeybindings(keybindingsPath, keybindings);
    }
}

function restore() {
    const platform = platformMap[os.platform()];
    if (!platform) {
        vscode.window.showErrorMessage("Unsupported platform: " + os.platform());
        return;
    }

    const keybindingsPath = getKeybindingsPath(platform);
    if (!keybindingsPath) {
        vscode.window.showErrorMessage("No keybindingsPath found in configuration, aborting");
        return;
    }

    restoreKeybindings(keybindingsPath);

    vscode.window.showInformationMessage("Restored keybindings");
}

function parseKeybindings(keybindings: Keybinding[], keymaps: Keymap, platform: Platform): Keybinding[] {
    let newKeybindings: Keybinding[] = [];
    for (const keybinding of keybindings) {
        if (keybinding[platform]) {
            newKeybindings.push(keybinding);
        } else if (keybinding.key) {
            let key = keybinding.key.toLowerCase();
            key = key.replace(/shift|ctrl|alt|gui/g, (matched) => {
                switch (matched) {
                    case "shift":
                        return keymaps.shift[platform];
                    case "ctrl":
                        return keymaps.ctrl[platform];
                    case "alt":
                        return keymaps.alt[platform];
                    case "gui":
                        return keymaps.gui[platform];
                    default:
                        // Should never happen
                        return matched;
                }
            });
            newKeybindings.push({
                key: key,
                command: keybinding.command,
                args: keybinding.args,
                when: keybinding.when,
            });
        }
    }

    return newKeybindings;
}

function getBackupPath(keybindingsPath: string): string {
    return keybindingsPath + ".bak";
}

function backupKeybindings(keybindingsPath: string) {
    fs.rename(keybindingsPath, getBackupPath(keybindingsPath), (err) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        }
    });
}

function restoreKeybindings(keybindingsPath: string) {
    // Check if backup exists
    const backupPath = getBackupPath(keybindingsPath);
    if (!fs.existsSync(backupPath)) {
        vscode.window.showErrorMessage("No backup found, aborting");
        return;
    }

    // Restore backup
    fs.rename(backupPath, keybindingsPath, (err) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        }
    });
}

function writeKeybindings(keybindingsPath: string, keymaps: any) {
    fs.writeFile(keybindingsPath, comment + JSON.stringify(keymaps, null, 4), (err) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        }
    });
}

function getKeybindingsPath(platform: Platform): string | undefined {
    const platformPath = vscode.workspace.getConfiguration(extensionID).get<PlatformConfig>("keybindingsPath");
    if (!platformPath) {
        console.error("No keybindingsPath found in configuration");
        return;
    }

    let keybindingsPath = platformPath[platform];

    if (!keybindingsPath) {
        console.error("No keybindingsPath found in configuration for platform: " + os.platform());
        return;
    }

    // Expand ~ to home directory in Unix-based systems
    if (keybindingsPath.startsWith("~/")) {
        keybindingsPath = path.join(os.homedir(), keybindingsPath.slice(2));
    }
    // Expand %APPDATA% to home directory in Windows
    if (keybindingsPath.startsWith("%APPDATA%")) {
        return path.join(process.env.APPDATA || "", keybindingsPath.slice(9));
    }

    return keybindingsPath;
}
