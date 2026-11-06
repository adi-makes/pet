# Development Guide - Antigravity Pet

## Environment & Compatibility

- **GNOME Shell**: 50.1
- **Mutter**: 50.1
- **GJS**: 1.84+ (ECMAScript Modules / ESM format)
- **Display Server**: Wayland
- **OS**: Ubuntu Linux (Noble / 26.x series)

---

## Technical Architecture

### 1. Actor Tree & UI Placement
Standard Wayland desktop clients are isolated and cannot force themselves above all windows or position themselves arbitrarily without special compositor protocols. GNOME Shell extensions run in-process with the compositor.

Antigravity Pet uses:
```javascript
Main.layoutManager.addChrome(this._pet.container, {
    trackFullscreen: false,
    affectsStruts: false,
});
```
- `affectsStruts: false`: Ensures the pet does not reserve screen space or shrink maximized windows.
- `trackFullscreen: false`: Keeps the pet rendering cleanly.
- `uiGroup` child attachment via `addChrome` ensures the actor persists across workspace shifts and stays above client window surfaces.

### 2. State & Animation Decoupling
- `PetAnimationManager`: Completely encapsulates `Clutter.Actor.ease` transitions and timer chains. It listens to state updates and executes easing curves (e.g. `EASE_IN_OUT_SINE`, `EASE_OUT_QUAD`, `EASE_IN_QUAD`).
- No infinite tight loops or CPU polling; animations use event-driven transition completions (`onComplete`) and `GLib.timeout_add` timers.
- When `animation-enabled` is set to `false`, transforms (`translation_x`, `translation_y`, `scale_x`, `scale_y`, `rotation_angle_z`) are cleared cleanly.

### 3. Mouse Interaction & Dragging
- Uses pointer event handlers (`button-press-event`, `motion-event`, `button-release-event`).
- To prevent dragging from accidentally triggering right-click actions or minor jitter clicks, a threshold of 3px displacement is required before coordinate updates take effect.
- Movement is clamped within monitor bounds (`Main.layoutManager.primaryMonitor`) respecting `screen-margin` (default 20px) and top panel height.

### 4. Settings Persistence
Using GSettings schema `org.gnome.shell.extensions.antigravity-pet`:
- `position-x`, `position-y`: Double precision coordinates (`-1.0` defaults to bottom-right).
- `animation-enabled`: Boolean.
- `pet-visible`: Boolean.
- `pet-size`: Integer (default 110px).
- `screen-margin`: Integer (default 20px).
- `pet-state`: String enum (`IDLE`, `WORKING`, `COMPLETED`, `ERROR`, `WAITING`).

---

## Reloading & Debugging on Wayland

1. **Why `Alt+F2` + `r` fails on Wayland**:
   On X11, GNOME Shell can restart itself without killing client windows. Under Wayland, GNOME Shell is the display server itself; restarting it would terminate all running applications.

2. **First-time Extension Loading**:
   GNOME Shell scans extension directories at session startup. Because this is a brand new extension UUID, a **log out and log in** is necessary once to load the extension object into GNOME Shell's extension manager.

3. **Subsequent Code Changes**:
   Because the extension is symlinked directly from the development repository (`ln -sfn .../extension ~/.local/share/gnome-shell/extensions/antigravity-pet@local`), JS/CSS changes are reflected automatically whenever the extension is toggled:
   ```bash
   gnome-extensions disable antigravity-pet@local
   gnome-extensions enable antigravity-pet@local
   ```

4. **Monitoring Logs**:
   To monitor errors, warnings, or debug statements in real time:
   ```bash
   journalctl -f -o cat /usr/bin/gnome-shell
   ```
