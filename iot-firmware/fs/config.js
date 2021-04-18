// Re-announce the device every minute.
let heartbeatInterval = 1000 * 60;

let pins = {
	// LEDS
	out1: 4, // ESP32 GPIO4 corresponds to number 4
	// Button
	in1: 0
};

let state = {
	on: false,
	brightness: 100,
};

let whoami = {
	id: 'esp01test',
	type: 'action.devices.types.LIGHT',
	name: 'esp01test',
	traits: [
		'action.devices.traits.OnOff',
	],
	state: state
};