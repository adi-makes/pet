#!/usr/bin/env bash
# install.sh - Links and compiles the Antigravity Pet GNOME Shell extension

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
EXT_DIR="$PROJECT_ROOT/extension"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/antigravity-pet@local"
SCHEMA_DIR="$HOME/.local/share/glib-2.0/schemas"

echo "=== Installing Antigravity Pet Extension ==="

# 1. Compile schemas locally
echo "[1/4] Compiling GSettings schemas..."
glib-compile-schemas "$EXT_DIR/schemas"
mkdir -p "$SCHEMA_DIR"
cp "$EXT_DIR/schemas/org.gnome.shell.extensions.antigravity-pet.gschema.xml" "$SCHEMA_DIR/"
glib-compile-schemas "$SCHEMA_DIR"

# 2. Setup symlink
echo "[2/4] Symlinking extension..."
mkdir -p "$HOME/.local/share/gnome-shell/extensions"
ln -sfn "$EXT_DIR" "$TARGET_DIR"

# 3. Add to enabled-extensions in GSettings
echo "[3/4] Enabling extension in GNOME settings..."
python3 - << 'EOF'
import gi
gi.require_version('Gio', '2.0')
from gi.repository import Gio, GLib

settings = Gio.Settings.new('org.gnome.shell')
enabled = list(settings.get_strv('enabled-extensions'))
uuid = 'antigravity-pet@local'
if uuid not in enabled:
    enabled.append(uuid)
    settings.set_strv('enabled-extensions', enabled)
    print(f"Added {uuid} to enabled-extensions.")
else:
    print(f"{uuid} already in enabled-extensions.")
EOF

echo "[4/4] Installation completed successfully!"
echo ""
echo "NOTE ON WAYLAND:"
echo "GNOME Shell on Wayland does not support restarting via Alt+F2 + 'r'."
echo "To initialize a newly installed extension for the first time, log out of your GNOME session and log back in."
