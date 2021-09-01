// Re-announce the device every minute.
let heartbeatInterval = 1000 * 60;

// ESP-32
let pins = {
	// LEDS
	out1: 4,
	// Button
	in1: 13
};

let state = {
	on: false,
	brightness: 100,
};

let whoami = {
	id: 'terracebulbs2',
	name: 'Terrace bulb string',
	type: 'action.devices.types.LIGHT',
	traits: [
		'action.devices.traits.OnOff',
		'action.devices.traits.Brightness',
	],
	state: state
};