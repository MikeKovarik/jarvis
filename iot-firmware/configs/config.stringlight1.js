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
	id: 'stringlight1',
	name: 'String light',
	type: 'action.devices.types.LIGHT',
	traits: [
		'action.devices.traits.OnOff',
		'action.devices.traits.Brightness',
	],
	state: state
};