// Re-announce the device every minute.
let heartbeatInterval = 1000 * 60;

// ESP-32
let pins = {
	// LEDS
	out1: 4,
	out2: 5,
	out3: 14,
	// Button
	in1: 0 // ESP8266 flash button
};

let state = {
	on: false,
	brightness: 100,
};

let whoami = {
	id: 'testlight',
	name: 'Test String',
	type: 'action.devices.types.LIGHT',
	traits: [
		'action.devices.traits.OnOff',
		'action.devices.traits.Brightness',
	],
	state: state
};