'use strict';

const Main = imports.ui.main;
const Mainloop = imports.mainloop;

const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const ShellToolkit = imports.gi.St;
const GObject = imports.gi.GObject;

function _get_tun0() {
    // Run ifconfig and pull the ip address for tun0
    var command_output_bytes = GLib.spawn_command_line_sync("ifconfig tun0")[1];
    var command_output_string = '';

    for (var i = 0; i < command_output_bytes.length; ++i){
        var current_character = String.fromCharCode(command_output_bytes[i]);
        command_output_string += current_character;
    }

    var Re = new RegExp(/inet [^ ]+/g);
    var matches = command_output_string.match(Re);
    var tun0IpAddress;
    if (matches) {
        tun0IpAddress = matches[0].split(' ')[1];
    } else {
        tun0IpAddress = 'N/A';
    }
    return tun0IpAddress;
}


var Tun0IPAddressIndicator = class AllIPAddressIndicator extends PanelMenu.Button{

    _init() {
        // Chaining up to the super-class
        super._init(0.0, "Show tun0 IP", false);

        this.buttonText = new St.Label({
            text: 'Loading...',
            y_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(this.buttonText);
        this._updateLabel();
    }

    _updateLabel(){
        const refreshTime = 10 // in seconds

        if (this._timeout) {
                Mainloop.source_remove(this._timeout);
                this._timeout = null;
        }
        this._timeout = Mainloop.timeout_add_seconds(refreshTime, () => {this._updateLabel();});

        this.buttonText.set_text("tun0: " + _get_tun0());
    }

    _removeTimeout() {
        if (this._timeout) {
            this._timeout = null;
        }
    }

    stop() {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
        }
        this._timeout = undefined;

        this.menu.removeAll();
    }
}
// In gnome-shell >= 3.32 this class and several others became GObject
// subclasses. We can account for this change simply by re-wrapping our
// subclass in `GObject.registerClass()`
Tun0IPAddressIndicator = GObject.registerClass(
    {GTypeName: 'Tun0IPAddressIndicator'},
    Tun0IPAddressIndicator
);

let _indicator;

function init() {
}

function enable() {
    _indicator = new Tun0IPAddressIndicator();
    Main.panel.addToStatusArea('all-ip-addresses-indicator', _indicator);
    _indicator.connect('button-press-event', _toggle);
}

function disable() {
    _indicator.stop();
    _indicator.destroy();
    _indicator = null;
}

function _toggle() {
    _indicator._updateLabel();
}
