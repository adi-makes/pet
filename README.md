# Antigravity Pet (GNOME Shell Extension)

A persistent, animated desktop companion built specifically as a native GNOME Shell extension using GJS, Mutter/Clutter, and St widgets.

Unlike standard application windows, **Antigravity Pet** lives directly inside GNOME Shell's compositor UI hierarchy (`Main.layoutManager.addChrome`). This gives it native capabilities:
- Zero window borders, titlebars, or taskbar / dock clutter.
- Stays above ordinary desktop application windows.
- Stays visible across multiple workspaces and monitor spaces.
- Smooth mouse dragging with coordinate persistence.
- Context menu controls and dynamic status indicators.

---

## Architecture & Layout

```text
       [ PET CHARACTER ]      (Retro Pixel-Art Robot SVG with Pivot Animation)

       ━━━━━━━━━━━━━━━        (Divider)
       ● IDLE                 (State Dot Indicator + State Label)
```

The pet is rendered inside a transparent St container actor (`AntigravityPetComponent`) and supports five distinct states:

| State | Indicator Color | Motion Behavior |
|---|---|---|
| **IDLE** | Grey (`#a6adc8`) | Gentle floating & rhythmic breathing |
| **WORKING** | Red (`#f38ba8`) | Rapid, energetic bouncing |
| **COMPLETED** | Green (`#a6e3a1`) | Celebratory vertical hops & tilt |
| **ERROR** | Orange (`#fab387`) | Horizontal shake |
| **WAITING** | Yellow (`#f9e2af`) | Occasional curious peek and head tilt |

---

## Directory Structure

```text
pet/
├── extension/
│   ├── metadata.json                                          # Extension metadata & shell versions
│   ├── extension.js                                           # Main GJS ES Module extension logic
│   ├── stylesheet.css                                         # St styling for pet & context menu
│   ├── assets/characters/pet.svg                              # Pixel-art companion graphic
│   └── schemas/
│       ├── org.gnome.shell.extensions.antigravity-pet.gschema.xml
│       └── gschemas.compiled
├── assets/
│   └── characters/pet.svg                                     # Source character graphics
├── scripts/
│   ├── install.sh                                             # Automated symlink & schema setup script
│   └── pet_control.py                                         # Testing and CLI controller
├── README.md
└── DEVELOPMENT.md
```

---

## Installation & Setup

1. Run the installation script to build the schemas and set up the extension symlink in `~/.local/share/gnome-shell/extensions/antigravity-pet@local`:

   ```bash
   ./scripts/install.sh
   ```

2. **Reload GNOME Shell (Wayland requirement)**:
   Under Wayland, restarting the compositor in-place via `Alt+F2` -> `r` is disabled by GNOME. For GNOME Shell to discover and initialize a newly added extension directory for the first time:
   - **Log out** of your Ubuntu session and **log back in**.
   - Upon logging in, `antigravity-pet@local` is loaded directly by the shell manager.

3. To check or toggle the extension via CLI:

   ```bash
   gnome-extensions list
   gnome-extensions enable antigravity-pet@local
   gnome-extensions disable antigravity-pet@local
   ```

---

## Extension Controls

### Right-Click Menu
Right-click anywhere on the pet character or indicator to open the context menu:
- **Change Status**: Switch between `IDLE`, `WORKING`, `COMPLETED`, `ERROR`, and `WAITING`.
- **Toggle Animation**: Pause or resume the procedural animation loops.
- **Reset Position**: Snap the pet back to its default bottom-right margin.
- **Hide Pet**: Hide the pet actor from view.

### Command-Line Controller (`pet_control.py`)
A helper CLI is included in `scripts/pet_control.py` for testing and programmatic automation:

```bash
# Check current pet settings and coordinates
python3 scripts/pet_control.py status

# Change state
python3 scripts/pet_control.py set-state WORKING
python3 scripts/pet_control.py set-state COMPLETED

# Toggle animation or visibility
python3 scripts/pet_control.py anim --enabled false
python3 scripts/pet_control.py visibility --visible true

# Cycle through all states (demo mode)
python3 scripts/pet_control.py cycle --delay 2.0
```
