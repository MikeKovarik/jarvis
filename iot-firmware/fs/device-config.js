let pins = {
	// LEDS
	out1: 4,
	out2: 5,
	out3: 14,
	// Button
	in1: 0
};

let states = {
	on: false,
	brightness: 100,
	color: {
		spectrumRGB: 0xFF00FF
	}
};

let whoami = {
	id: 'growlight',
	type: 'action.devices.types.LIGHT',
	name: 'String light',
	traits: [
		'action.devices.commands.OnOff',
		'action.devices.commands.Brightness',
		'action.devices.commands.ColorSetting'
	],
	attributes: {
		colorModel: 'rgb'
	},
	states: states
};

let wifi = {
	ssid: 'Oskar',
	pass: '000000000001'
};

let hostbase = 'jarvis-iot-';
let hostname = hostbase + whoami.id;

// Re-announce the device every hour.
let heartbeatInterval = 1000 * 60 * 60;