#!/usr/bin/env python3
"""
Test and control CLI for Antigravity Pet GNOME Shell Extension.
Allows querying and modifying pet status, animation, position, and visibility
via GSettings and DBus.
"""

import argparse
import sys
import gi

gi.require_version('Gio', '2.0')
from gi.repository import Gio, GLib

SCHEMA_ID = 'org.gnome.shell.extensions.antigravity-pet'
UUID = 'antigravity-pet@local'
VALID_STATES = ['IDLE', 'WORKING', 'COMPLETED', 'ERROR', 'WAITING']

def get_settings():
    schema_source = Gio.SettingsSchemaSource.get_default()
    if not schema_source or not schema_source.lookup(SCHEMA_ID, True):
        print(f"Error: Schema {SCHEMA_ID} not found in system or user schema paths.", file=sys.stderr)
        print("Run `glib-compile-schemas ~/.local/share/glib-2.0/schemas` or ensure schemas are compiled.", file=sys.stderr)
        sys.exit(1)
    return Gio.Settings.new(SCHEMA_ID)

def cmd_status(args):
    settings = get_settings()
    current_state = settings.get_string('pet-state')
    anim_enabled = settings.get_boolean('animation-enabled')
    visible = settings.get_boolean('pet-visible')
    pos_x = settings.get_double('position-x')
    pos_y = settings.get_double('position-y')
    size = settings.get_int('pet-size')
    margin = settings.get_int('screen-margin')

    print("=== Antigravity Pet Configuration ===")
    print(f"  State:             {current_state}")
    print(f"  Animation Enabled: {anim_enabled}")
    print(f"  Visible:           {visible}")
    print(f"  Position:          ({pos_x:.1f}, {pos_y:.1f})")
    print(f"  Character Size:    {size}px")
    print(f"  Screen Margin:     {margin}px")

def cmd_set_state(args):
    state = args.state.upper()
    if state not in VALID_STATES:
        print(f"Error: Invalid state '{state}'. Valid states are: {', '.join(VALID_STATES)}", file=sys.stderr)
        sys.exit(1)
    settings = get_settings()
    settings.set_string('pet-state', state)
    print(f"Pet state updated to: {state}")

def cmd_toggle_anim(args):
    settings = get_settings()
    current = settings.get_boolean('animation-enabled')
    new_val = not current if args.enabled is None else (args.enabled.lower() in ('true', '1', 'yes'))
    settings.set_boolean('animation-enabled', new_val)
    print(f"Pet animation enabled: {new_val}")

def cmd_toggle_visibility(args):
    settings = get_settings()
    current = settings.get_boolean('pet-visible')
    new_val = not current if args.visible is None else (args.visible.lower() in ('true', '1', 'yes'))
    settings.set_boolean('pet-visible', new_val)
    print(f"Pet visible: {new_val}")

def cmd_reset_pos(args):
    settings = get_settings()
    settings.set_double('position-x', -1.0)
    settings.set_double('position-y', -1.0)
    print("Pet position reset flag set (-1.0, -1.0). The extension will place the pet at the bottom-right corner.")

def cmd_cycle_states(args):
    import time
    settings = get_settings()
    delay = args.delay
    print(f"Cycling through states with {delay}s interval (Press Ctrl+C to stop)...")
    try:
        while True:
            for s in VALID_STATES:
                print(f" -> Setting state: {s}")
                settings.set_string('pet-state', s)
                time.sleep(delay)
    except KeyboardInterrupt:
        print("\nCycle interrupted. Resetting state to IDLE.")
        settings.set_string('pet-state', 'IDLE')

def main():
    parser = argparse.ArgumentParser(description="Antigravity Pet GNOME Extension Controller")
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # status
    p_status = subparsers.add_parser('status', help='Print current pet status and settings')
    p_status.set_defaults(func=cmd_status)

    # set-state
    p_state = subparsers.add_parser('set-state', help='Set pet state (IDLE, WORKING, COMPLETED, ERROR, WAITING)')
    p_state.add_argument('state', choices=VALID_STATES, help='State to set')
    p_state.set_defaults(func=cmd_set_state)

    # anim
    p_anim = subparsers.add_parser('anim', help='Toggle or set animation state')
    p_anim.add_argument('--enabled', choices=['true', 'false'], default=None, help='Explicitly enable or disable')
    p_anim.set_defaults(func=cmd_toggle_anim)

    # visibility
    p_vis = subparsers.add_parser('visibility', help='Toggle or set pet visibility')
    p_vis.add_argument('--visible', choices=['true', 'false'], default=None, help='Explicitly show or hide')
    p_vis.set_defaults(func=cmd_toggle_visibility)

    # reset-pos
    p_pos = subparsers.add_parser('reset-pos', help='Reset pet coordinates to bottom right default')
    p_pos.set_defaults(func=cmd_reset_pos)

    # cycle
    p_cycle = subparsers.add_parser('cycle', help='Test helper: automatically cycle through all states')
    p_cycle.add_argument('--delay', type=float, default=2.0, help='Delay in seconds between states')
    p_cycle.set_defaults(func=cmd_cycle_states)

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(0)

    args.func(args)

if __name__ == '__main__':
    main()
