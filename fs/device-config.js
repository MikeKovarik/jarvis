let hw = {
	pin1: 4,
	pin2: 5,
	pin3: 14
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
		'OnOff',
		'Brightness',
		'ColorSetting'
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