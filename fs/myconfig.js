let hw = {
	pin1: 4,
	pin2: 5,
	pin3: 14
};

let info = {
	traits: [
		'OnOff',
		'Brightness',
		'ColorSetting'
	],
	attributes: {
		colorModel: 'rgb'
	}
};

let states = {
	on: false,
	brightness: 100,
	color: {
		spectrumRgb: 0xFF00FF
	}
};