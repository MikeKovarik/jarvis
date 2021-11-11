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
	name: 'terrace-small-lights',
	type: 'action.devices.types.LIGHT',
	traits: [
		'action.devices.traits.OnOff',
		'action.devices.traits.Brightness',
	],
	state: state
};