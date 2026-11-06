# prompt1
# Milestone 1: Build a Persistent GNOME Desktop Pet

You are building a native Linux desktop companion called **Antigravity Pet**.

## Environment

- OS: Ubuntu Linux
- Display server: Wayland
- Desktop environment: GNOME
- GNOME Shell: 50.1
- Python: 3.14.4

## Objective

Create a small animated character that remains visible on the desktop, even when the user switches between applications, terminals, browsers and workspaces.

This must NOT be a normal application window.

Implement it as a native GNOME Shell extension using GJS, GNOME Shell's St toolkit and supported extension APIs.

## 1. Project structure

Create a clean development project:

```text
antigravity-pet/
├── extension/
│   ├── metadata.json
│   ├── extension.js
│   └── stylesheet.css
├── assets/
│   └── characters/
├── scripts/
├── README.md
└── DEVELOPMENT.md
```

Install the extension into:

`~/.local/share/gnome-shell/extensions/antigravity-pet@local/`

Use a symlink from the development project where practical, so development changes can be tested without manually copying files.

## 2. Desktop integration

The pet must:

- Be rendered as a GNOME Shell actor, not a separate application window.
- Stay visible when switching applications.
- Remain visible across normal workspace changes.
- Have a transparent background.
- Have no window decorations or title bar.
- Stay above ordinary application windows.
- Be draggable using the mouse.
- Remember its last position.
- Support a configurable screen margin.
- Avoid interfering with normal desktop interaction outside its bounds.

Use GNOME Shell 50-compatible APIs. Do not copy outdated extension examples without checking API compatibility.

## 3. Initial appearance

For the first prototype:

- Display a cute pixel-art-style character.
- Put a small horizontal status indicator below it.
- Put a short status label below the indicator.

Use a temporary character asset or emoji if necessary. Keep character rendering modular so we can replace it with proper sprite animations later.

Initial layout:

```text
       [ PET CHARACTER ]

       ━━━━━━━━━━━━━━━
       ● IDLE
```

The character should be small and unobtrusive, approximately 100–130 pixels wide.

Place it initially near the bottom-right corner.

## 4. Status system

Implement these states:

| State | Indicator |
|---|---|
| IDLE | Grey |
| WORKING | Red |
| COMPLETED | Green |
| ERROR | Orange |
| WAITING | Yellow |

For now, provide a temporary way to change states through the extension's menu or a simple test control.

Do not implement Antigravity hooks yet.

## 5. Basic animation

Implement a lightweight animation system with:

- Idle: subtle breathing or floating.
- Working: gentle bouncing.
- Completed: short celebratory animation.
- Error: brief shaking.
- Waiting: occasional attention animation.

Animations should not consume excessive CPU.

Keep animation logic separate from status management.

## 6. Extension controls

Add a small menu accessible by right-clicking the pet.

Include:

- Toggle animation.
- Reset position.
- Change status (testing only).
- Hide/show pet.
- Quit/hide controls.

The pet should be movable without accidentally triggering the menu.

## 7. Settings persistence

Persist:

- Position.
- Animation enabled/disabled.
- Pet visibility.
- Pet size.

Use appropriate GNOME settings mechanisms.

## 8. Development and testing

Before implementation:

1. Inspect GNOME Shell 50 compatibility requirements.
2. Check available development tools.
3. Check whether the required GJS/GNOME tools are installed.
4. Identify missing dependencies.
5. Explain any required installation before installing anything.

Then implement the extension.

Test:

1. Extension loads without errors.
2. Pet appears on the desktop.
3. Pet remains visible when switching applications.
4. Pet remains visible when switching workspaces.
5. Dragging works.
6. Status changes update the indicator.
7. Animations work.
8. Position persists after disabling and enabling the extension.

Use `journalctl` to inspect GNOME Shell errors.

Remember that on Wayland, restarting GNOME Shell through Alt+F2 and `r` is not supported. Explain how to safely reload or restart the extension and when a logout/login is necessary.

## Important engineering rules

- Keep the implementation modular.
- Avoid deprecated GNOME Shell APIs.
- Do not modify existing system extensions.
- Do not overwrite unrelated user configurations.
- Do not install unnecessary dependencies.
- Do not claim a test passed unless it was actually executed.
- Document all setup and testing commands.

At the end, provide:
1. Files created.
2. Dependencies installed, if any.
3. How to enable the extension.
4. How to test it.
5. Known limitations.
6. Next recommended development milestone.

Do not attempt all future milestones now. Focus exclusively on getting a stable, persistent desktop pet working.

# Response 1
