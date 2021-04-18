// Re-announce the device every minute.
let heartbeatInterval = 1000 * 60;

let pins = {
	// LEDS
	out1: 4,
	out2: 5,
	out3: 14,
	// Button
	in1: 0
};

let state = {
	on: false,
	brightness: 100,
	color: {
		spectrumRGB: 0xFF00FF
	}
};

let whoami = {
	id: 'growlight',
	type: 'action.devices.types.LIGHT',
	name: 'Grow light',
	traits: [
		'action.devices.traits.OnOff',
		'action.devices.traits.Brightness',
		'action.devices.traits.ColorSetting'
	],
	attributes: {
		colorModel: 'rgb'
	},
	state: state
};