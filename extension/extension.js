/* extension.js
 * Antigravity Pet - GNOME Shell 50 Native Desktop Pet Extension
 *
 * Implements a persistent, draggable desktop pet rendered directly
 * as a GNOME Shell St actor across workspaces and above standard windows.
 */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

// Status definitions and corresponding colors & CSS classes
export const PET_STATES = {
    IDLE: { label: 'IDLE', colorClass: 'antigravity-pet-status-idle' },
    WORKING: { label: 'WORKING', colorClass: 'antigravity-pet-status-working' },
    COMPLETED: { label: 'COMPLETED', colorClass: 'antigravity-pet-status-completed' },
    ERROR: { label: 'ERROR', colorClass: 'antigravity-pet-status-error' },
    WAITING: { label: 'WAITING', colorClass: 'antigravity-pet-status-waiting' },
};

/**
 * PetAnimationManager handles procedural, lightweight actor easing
 * based on current state without consuming excessive CPU.
 */
class PetAnimationManager {
    constructor(characterActor) {
        this._actor = characterActor;
        this._enabled = true;
        this._currentState = 'IDLE';
        this._timerId = 0;
        this._animating = false;
    }

    setEnabled(enabled) {
        this._enabled = enabled;
        if (!enabled) {
            this.stop();
            this.resetTransforms();
        } else {
            this.start();
        }
    }

    setState(state) {
        if (!PET_STATES[state]) return;
        this._currentState = state;
        if (this._enabled) {
            this.stop();
            this.resetTransforms();
            this.start();
        }
    }

    resetTransforms() {
        if (!this._actor) return;
        this._actor.remove_all_transitions();
        this._actor.translation_x = 0;
        this._actor.translation_y = 0;
        this._actor.scale_x = 1.0;
        this._actor.scale_y = 1.0;
        this._actor.rotation_angle_z = 0;
    }

    stop() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }
        if (this._actor) {
            this._actor.remove_all_transitions();
        }
        this._animating = false;
    }

    start() {
        if (!this._enabled || !this._actor) return;
        this.stop();

        switch (this._currentState) {
            case 'IDLE':
                this._runIdleLoop();
                break;
            case 'WORKING':
                this._runWorkingLoop();
                break;
            case 'COMPLETED':
                this._runCompletedLoop();
                break;
            case 'ERROR':
                this._runErrorLoop();
                break;
            case 'WAITING':
                this._runWaitingLoop();
                break;
            default:
                this._runIdleLoop();
                break;
        }
    }

    // IDLE: Subtle breathing / floating (smooth vertical bobbing & gentle scale)
    _runIdleLoop() {
        if (!this._enabled || !this._actor) return;
        this._actor.ease({
            translation_y: -6,
            scale_x: 1.03,
            scale_y: 0.97,
            duration: 1200,
            mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
            onComplete: () => {
                if (!this._enabled || this._currentState !== 'IDLE' || !this._actor) return;
                this._actor.ease({
                    translation_y: 0,
                    scale_x: 1.0,
                    scale_y: 1.0,
                    duration: 1200,
                    mode: Clutter.AnimationMode.EASE_IN_OUT_SINE,
                    onComplete: () => {
                        if (this._enabled && this._currentState === 'IDLE') {
                            this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
                                this._timerId = 0;
                                if (this._enabled && this._currentState === 'IDLE') {
                                    this._runIdleLoop();
                                }
                                return GLib.SOURCE_REMOVE;
                            });
                        }
                    },
                });
            },
        });
    }

    // WORKING: Gentle bouncing with cadence
    _runWorkingLoop() {
        if (!this._enabled || !this._actor) return;
        this._actor.ease({
            translation_y: -14,
            scale_y: 1.08,
            duration: 280,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                if (!this._enabled || this._currentState !== 'WORKING' || !this._actor) return;
                this._actor.ease({
                    translation_y: 0,
                    scale_y: 0.94,
                    duration: 250,
                    mode: Clutter.AnimationMode.EASE_IN_QUAD,
                    onComplete: () => {
                        if (!this._enabled || this._currentState !== 'WORKING' || !this._actor) return;
                        this._actor.ease({
                            scale_y: 1.0,
                            duration: 120,
                            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                            onComplete: () => {
                                if (this._enabled && this._currentState === 'WORKING') {
                                    this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 180, () => {
                                        this._timerId = 0;
                                        this._runWorkingLoop();
                                        return GLib.SOURCE_REMOVE;
                                    });
                                }
                            },
                        });
                    },
                });
            },
        });
    }

    // COMPLETED: Short celebratory hops and mini spins
    _runCompletedLoop() {
        if (!this._enabled || !this._actor) return;
        let hops = 0;
        const doHop = () => {
            if (!this._enabled || this._currentState !== 'COMPLETED' || !this._actor) return;
            hops++;
            this._actor.ease({
                translation_y: -18,
                rotation_angle_z: hops % 2 === 1 ? 6 : -6,
                duration: 220,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    if (!this._enabled || this._currentState !== 'COMPLETED' || !this._actor) return;
                    this._actor.ease({
                        translation_y: 0,
                        rotation_angle_z: 0,
                        duration: 200,
                        mode: Clutter.AnimationMode.EASE_IN_QUAD,
                        onComplete: () => {
                            if (hops < 4) {
                                this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                                    this._timerId = 0;
                                    doHop();
                                    return GLib.SOURCE_REMOVE;
                                });
                            } else {
                                // Pause then repeat celebratory hop sequence
                                this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1800, () => {
                                    this._timerId = 0;
                                    hops = 0;
                                    doHop();
                                    return GLib.SOURCE_REMOVE;
                                });
                            }
                        },
                    });
                },
            });
        };
        doHop();
    }

    // ERROR: Brief horizontal shaking
    _runErrorLoop() {
        if (!this._enabled || !this._actor) return;
        const offsets = [-8, 8, -6, 6, -3, 3, 0];
        let idx = 0;
        const shakeStep = () => {
            if (!this._enabled || this._currentState !== 'ERROR' || !this._actor) return;
            if (idx >= offsets.length) {
                // Wait before shaking again
                this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
                    this._timerId = 0;
                    idx = 0;
                    shakeStep();
                    return GLib.SOURCE_REMOVE;
                });
                return;
            }
            const offset = offsets[idx++];
            this._actor.ease({
                translation_x: offset,
                duration: 60,
                mode: Clutter.AnimationMode.LINEAR,
                onComplete: shakeStep,
            });
        };
        shakeStep();
    }

    // WAITING: Occasional curious tilting / attention peek
    _runWaitingLoop() {
        if (!this._enabled || !this._actor) return;
        this._actor.ease({
            rotation_angle_z: 12,
            translation_y: -4,
            duration: 500,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                if (!this._enabled || this._currentState !== 'WAITING' || !this._actor) return;
                this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 800, () => {
                    this._timerId = 0;
                    if (!this._enabled || this._currentState !== 'WAITING' || !this._actor) return GLib.SOURCE_REMOVE;
                    this._actor.ease({
                        rotation_angle_z: -12,
                        translation_y: -4,
                        duration: 600,
                        mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
                        onComplete: () => {
                            if (!this._enabled || this._currentState !== 'WAITING' || !this._actor) return;
                            this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 800, () => {
                                this._timerId = 0;
                                if (!this._enabled || this._currentState !== 'WAITING' || !this._actor) return GLib.SOURCE_REMOVE;
                                this._actor.ease({
                                    rotation_angle_z: 0,
                                    translation_y: 0,
                                    duration: 400,
                                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                                    onComplete: () => {
                                        this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2500, () => {
                                            this._timerId = 0;
                                            this._runWaitingLoop();
                                            return GLib.SOURCE_REMOVE;
                                        });
                                    },
                                });
                                return GLib.SOURCE_REMOVE;
                            });
                        },
                    });
                    return GLib.SOURCE_REMOVE;
                });
            },
        });
    }

    destroy() {
        this.stop();
        this.resetTransforms();
        this._actor = null;
    }
}

/**
 * AntigravityPet is the main desktop actor component.
 */
class AntigravityPetComponent {
    constructor(extension) {
        this._extension = extension;
        this._settings = extension.getSettings();
        this._currentState = 'IDLE';

        // Dragging tracking state
        this._isDragging = false;
        this._dragStartX = 0;
        this._dragStartY = 0;
        this._actorStartX = 0;
        this._actorStartY = 0;
        this._hasDraggedPastThreshold = false;

        this._buildUI();
        this._connectSettings();
        this._setupDragging();
        this._buildContextMenu();
    }

    _buildUI() {
        // Main container widget
        this.container = new St.Widget({
            name: 'antigravity-pet-container',
            style_class: 'antigravity-pet-container',
            reactive: true,
            can_focus: false,
            track_hover: true,
        });

        // Vertical content box
        this._contentBox = new St.BoxLayout({
            vertical: true,
            style_class: 'antigravity-pet-box',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.container.add_child(this._contentBox);

        // Character wrapper (so animations translate the inner sprite without disturbing root position)
        this._characterWrapper = new St.Bin({
            style_class: 'antigravity-pet-character',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._contentBox.add_child(this._characterWrapper);

        // Character icon sprite
        const petIconPath = GLib.build_filenamev([this._extension.path, 'assets', 'characters', 'pet.svg']);
        const petFile = Gio.File.new_for_path(petIconPath);
        const petGIcon = new Gio.FileIcon({ file: petFile });

        const petSize = this._settings.get_int('pet-size') || 110;
        this._characterIcon = new St.Icon({
            gicon: petGIcon,
            icon_size: petSize,
        });
        this._characterIcon.set_pivot_point(0.5, 0.5);
        this._characterWrapper.set_child(this._characterIcon);

        // Horizontal status indicator line / divider
        this._divider = new St.Widget({
            style_class: 'antigravity-pet-divider',
            x_expand: true,
        });
        this._contentBox.add_child(this._divider);

        // Status row containing indicator dot & status label
        this._statusRow = new St.BoxLayout({
            vertical: false,
            style_class: 'antigravity-pet-status-row',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._contentBox.add_child(this._statusRow);

        this._statusDot = new St.Widget({
            style_class: 'antigravity-pet-dot antigravity-pet-status-idle',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._statusRow.add_child(this._statusDot);

        this._statusLabel = new St.Label({
            text: 'IDLE',
            style_class: 'antigravity-pet-label',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._statusRow.add_child(this._statusLabel);

        // Animation Manager
        this._animator = new PetAnimationManager(this._characterIcon);
        const animEnabled = this._settings.get_boolean('animation-enabled');
        this._animator.setEnabled(animEnabled);

        // Initial state from settings
        const savedState = this._settings.get_string('pet-state') || 'IDLE';
        this.setStatus(savedState);
    }

    _setupDragging() {
        // Dragging using pointer events on container
        this.container.connect('button-press-event', (actor, event) => {
            const button = event.get_button();
            if (button === Clutter.BUTTON_PRIMARY) {
                const [stageX, stageY] = event.get_coords();
                this._isDragging = true;
                this._hasDraggedPastThreshold = false;
                this._dragStartX = stageX;
                this._dragStartY = stageY;
                this._actorStartX = this.container.x;
                this._actorStartY = this.container.y;

                // Close context menu if open
                if (this._menu && this._menu.isOpen) {
                    this._menu.close();
                }
                return Clutter.EVENT_STOP;
            } else if (button === Clutter.BUTTON_SECONDARY) {
                // Right-click: trigger context menu
                this._openContextMenu(event);
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });

        this.container.connect('motion-event', (actor, event) => {
            if (!this._isDragging) return Clutter.EVENT_PROPAGATE;

            const [stageX, stageY] = event.get_coords();
            const dx = stageX - this._dragStartX;
            const dy = stageY - this._dragStartY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                this._hasDraggedPastThreshold = true;
            }

            if (this._hasDraggedPastThreshold) {
                const newX = this._actorStartX + dx;
                const newY = this._actorStartY + dy;
                this._clampAndSetPosition(newX, newY);
            }
            return Clutter.EVENT_STOP;
        });

        this.container.connect('button-release-event', (actor, event) => {
            if (this._isDragging) {
                this._isDragging = false;
                if (this._hasDraggedPastThreshold) {
                    // Save new position into settings
                    this._settings.set_double('position-x', this.container.x);
                    this._settings.set_double('position-y', this.container.y);
                }
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        });
    }

    _clampAndSetPosition(targetX, targetY) {
        const monitorIndex = Main.layoutManager.primaryIndex >= 0 ? Main.layoutManager.primaryIndex : 0;
        const monitor = Main.layoutManager.monitors[monitorIndex] || Main.layoutManager.primaryMonitor;
        const margin = this._settings.get_int('screen-margin') || 20;

        const [minW, natW] = this.container.get_preferred_width(-1);
        const [minH, natH] = this.container.get_preferred_height(-1);
        const width = natW > 0 ? natW : 120;
        const height = natH > 0 ? natH : 140;

        let clampedX = targetX;
        let clampedY = targetY;

        if (monitor) {
            const minX = monitor.x + margin;
            const maxX = monitor.x + monitor.width - width - margin;
            const minY = monitor.y + margin + Main.panel.height;
            const maxY = monitor.y + monitor.height - height - margin;

            clampedX = Math.max(minX, Math.min(clampedX, maxX));
            clampedY = Math.max(minY, Math.min(clampedY, maxY));
        }

        this.container.set_position(Math.round(clampedX), Math.round(clampedY));
    }

    resetPosition() {
        const monitorIndex = Main.layoutManager.primaryIndex >= 0 ? Main.layoutManager.primaryIndex : 0;
        const monitor = Main.layoutManager.monitors[monitorIndex] || Main.layoutManager.primaryMonitor;
        const margin = this._settings.get_int('screen-margin') || 20;

        const [minW, natW] = this.container.get_preferred_width(-1);
        const [minH, natH] = this.container.get_preferred_height(-1);
        const width = natW > 0 ? natW : 120;
        const height = natH > 0 ? natH : 140;

        if (monitor) {
            const defaultX = monitor.x + monitor.width - width - margin - 40;
            const defaultY = monitor.y + monitor.height - height - margin - 40;
            this.container.set_position(Math.round(defaultX), Math.round(defaultY));
            this._settings.set_double('position-x', defaultX);
            this._settings.set_double('position-y', defaultY);
        }
    }

    restorePosition() {
        const savedX = this._settings.get_double('position-x');
        const savedY = this._settings.get_double('position-y');

        if (savedX < 0 || savedY < 0) {
            this.resetPosition();
        } else {
            this._clampAndSetPosition(savedX, savedY);
        }
    }

    setStatus(stateKey) {
        const state = PET_STATES[stateKey] || PET_STATES.IDLE;
        this._currentState = stateKey;

        // Clear existing status styling on dot
        for (const key of Object.keys(PET_STATES)) {
            this._statusDot.remove_style_class_name(PET_STATES[key].colorClass);
        }
        this._statusDot.add_style_class_name(state.colorClass);
        this._statusLabel.text = state.label;

        // Update animation
        if (this._animator) {
            this._animator.setState(stateKey);
        }

        this._settings.set_string('pet-state', stateKey);
    }

    _buildContextMenu() {
        // Use PopupMenu associated with pet container
        this._menu = new PopupMenu.PopupMenu(this.container, 0.5, St.Side.BOTTOM);
        this._menu.actor.add_style_class_name('antigravity-pet-menu');

        // Manage through PopupMenuManager
        this._menuManager = new PopupMenu.PopupMenuManager(this.container);
        this._menuManager.addMenu(this._menu);

        // Add menu to uiGroup so it renders properly above other actors
        Main.uiGroup.add_child(this._menu.actor);
        this._menu.actor.hide();

        // 1. Status submenu (Testing controls)
        const statusSubMenu = new PopupMenu.PopupSubMenuMenuItem('Change Status');
        for (const [key, val] of Object.entries(PET_STATES)) {
            const item = new PopupMenu.PopupMenuItem(`${val.label}`);
            item.connect('activate', () => {
                this.setStatus(key);
            });
            statusSubMenu.menu.addMenuItem(item);
        }
        this._menu.addMenuItem(statusSubMenu);

        // 2. Toggle Animation
        const animItem = new PopupMenu.PopupMenuItem(
            this._animator._enabled ? 'Disable Animation' : 'Enable Animation'
        );
        animItem.connect('activate', () => {
            const newVal = !this._animator._enabled;
            this._settings.set_boolean('animation-enabled', newVal);
            animItem.label.text = newVal ? 'Disable Animation' : 'Enable Animation';
        });
        this._menu.addMenuItem(animItem);
        this._animToggleItem = animItem;

        // 3. Reset Position
        const resetPosItem = new PopupMenu.PopupMenuItem('Reset Position');
        resetPosItem.connect('activate', () => {
            this.resetPosition();
        });
        this._menu.addMenuItem(resetPosItem);

        // Separator
        this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // 4. Hide / Show Pet
        const hideItem = new PopupMenu.PopupMenuItem('Hide Pet');
        hideItem.connect('activate', () => {
            this.container.visible = false;
            this._settings.set_boolean('pet-visible', false);
        });
        this._menu.addMenuItem(hideItem);
    }

    _openContextMenu(event) {
        if (!this._menu) return;
        if (this._menu.isOpen) {
            this._menu.close();
        } else {
            // Update toggle label based on current state
            if (this._animToggleItem) {
                this._animToggleItem.label.text = this._animator._enabled
                    ? 'Disable Animation'
                    : 'Enable Animation';
            }
            this._menu.open(true);
        }
    }

    _connectSettings() {
        this._settingsChangedId = this._settings.connect('changed', (settings, key) => {
            switch (key) {
                case 'animation-enabled':
                    const animEnabled = settings.get_boolean('animation-enabled');
                    this._animator.setEnabled(animEnabled);
                    if (this._animToggleItem) {
                        this._animToggleItem.label.text = animEnabled ? 'Disable Animation' : 'Enable Animation';
                    }
                    break;
                case 'pet-visible':
                    this.container.visible = settings.get_boolean('pet-visible');
                    break;
                case 'pet-size':
                    const size = settings.get_int('pet-size');
                    this._characterIcon.icon_size = size;
                    break;
                case 'pet-state':
                    const state = settings.get_string('pet-state');
                    if (state !== this._currentState) {
                        this.setStatus(state);
                    }
                    break;
                case 'position-x':
                case 'position-y':
                    // If changed externally, re-clamp
                    this.restorePosition();
                    break;
            }
        });
    }

    destroy() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        if (this._animator) {
            this._animator.destroy();
            this._animator = null;
        }

        if (this._menu) {
            this._menu.destroy();
            this._menu = null;
        }

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}

/**
 * Extension entry point
 */
export default class AntigravityPetExtension extends Extension {
    enable() {
        this._pet = new AntigravityPetComponent(this);

        // Add pet container directly to Main.layoutManager
        // This ensures the pet stays visible across workspace changes and above normal windows
        Main.layoutManager.addChrome(this._pet.container, {
            trackFullscreen: false,
            affectsStruts: false,
        });

        // Ensure visibility according to settings
        const isVisible = this.getSettings().get_boolean('pet-visible');
        this._pet.container.visible = isVisible;

        // Position on desktop (using next idle tick so sizes are calculated)
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            if (this._pet && this._pet.container) {
                this._pet.restorePosition();
            }
            return GLib.SOURCE_REMOVE;
        });

        // Listen for screen resolution / monitor geometry changes
        this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', () => {
            if (this._pet && this._pet.container) {
                this._pet.restorePosition();
            }
        });
    }

    disable() {
        if (this._monitorsChangedId) {
            Main.layoutManager.disconnect(this._monitorsChangedId);
            this._monitorsChangedId = 0;
        }

        if (this._pet) {
            if (this._pet.container) {
                Main.layoutManager.removeChrome(this._pet.container);
            }
            this._pet.destroy();
            this._pet = null;
        }
    }
}
