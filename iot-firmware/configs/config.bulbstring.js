// Re-announce the device every minute.
let heartbeatInterval = 1000 * 60;

let pins = {
	// LEDS
	out1: 3, // RX because ESP-01 has limited pins
	// Button
	in1: 0
};

let state = {
	on: false,
	brightness: 100,
};

let whoami = {
	id: 'bulbstring',
	name: 'Bulb string',
	type: 'action.devices.types.LIGHT',
	traits: [
		'action.devices.traits.OnOff',
		'action.devices.traits.Brightness',
	],
	state: state
};