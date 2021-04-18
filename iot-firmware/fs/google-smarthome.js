load('config.js');


let badRequestReponse = {error: -1, message: 'Bad request'};

let traitNameStem   = 'action.devices.traits.';

let traits = {};
for (let i = 0; i < whoami.traits.length; i++) {
	let fullName = whoami.traits[i];
	let shortName = fullName.slice(traitNameStem.length);
	traits[shortName] = true
}

let commands = {

	OnOff: {
		fullName: 'action.devices.commands.OnOff',
		validate: function(arg) {
			return typeof(arg.on) === 'boolean'
		},
		handle: function(arg) {
			state.on = arg.on;
		}
	},

	BrightnessAbsolute: {
		fullName: 'action.devices.commands.BrightnessAbsolute',
		validate: function(arg) {
			return typeof(arg.brightness) === 'number'
		},
		handle: function(arg) {
			// range 0 - 100
			state.brightness = arg.brightness;
		}
	},

	ColorAbsolute: {
		fullName: 'action.devices.commands.ColorAbsolute',
		validate: function(arg) {
			return typeof(arg.color) === 'object'
				&& typeof(arg.color.spectrumRGB) === 'number'
		},
		handle: function(arg) {
			// single unsigned integer representing hex color.
			state.color.spectrumRGB = arg.color.spectrumRGB;
		}
	}

};

function handleCommand(cmd, data) {
	if (typeof(data) === 'object' && cmd.validate(data)) {
		cmd.handle(data)
		setPins();
		return state;
	} else {
		return badRequestReponse;
	}
}


if (traits.OnOff) {
	GPIO.set_mode(pins.out1, GPIO.MODE_OUTPUT);
	RPC.addHandler(commands.OnOff.fullName, function(data) {
		return handleCommand(commands.OnOff, data)
	});
}


if (traits.Brightness) {
	RPC.addHandler(commands.BrightnessAbsolute.fullName, function(data) {
		return handleCommand(commands.BrightnessAbsolute, data)
	});
}


if (traits.ColorSetting) {
	GPIO.set_mode(pins.out1, GPIO.MODE_OUTPUT);
	GPIO.set_mode(pins.out2, GPIO.MODE_OUTPUT);
	GPIO.set_mode(pins.out3, GPIO.MODE_OUTPUT);
	RPC.addHandler(commands.ColorAbsolute.fullName, function(data) {
		return handleCommand(commands.ColorAbsolute, data)
	});
}


if (pins.in1 !== undefined) {
	GPIO.set_button_handler(pins.in1, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 50, function(x) {
		console.log('Button pressed')
		state.on = !state.on;
		setPins();
		broadcastStatus();
	}, true);
}


// Compensate perceived brightness exponentially 
function compensatePerceivedBrightness(val) {
	return (val * val) / 100;
}

let pwmFreq = 100;
function setPins() {
	let duty = 0;
	if (traits.Brightness) {
		duty = state.on ? compensatePerceivedBrightness(state.brightness) / 100 : 0;
	} else {
		duty = state.on ? 1 : 0;
	}
	if (traits.ColorSetting) {
		let rgb = hexNumToRgb(state.color.spectrumRGB);
		PWM.set(pins.out1, pwmFreq, duty * (rgb.r / 255));
		PWM.set(pins.out2, pwmFreq, duty * (rgb.g / 255));
		PWM.set(pins.out3, pwmFreq, duty * (rgb.b / 255));
	} else {
		PWM.set(pins.out1, pwmFreq, duty);
	}
}


function hexNumToRgb(num) {
	return {
		r: (num >> 16) & 255,
		g: (num >> 8) & 255,
		b: num & 255
	}
}

/*
OLD CODE FOR HANDLING HEX COLOR

function hexStringToRgb(str) {
	return {
		r: getSingleColor(str, 0, 1) / 255,
		g: getSingleColor(str, 2, 3) / 255,
		b: getSingleColor(str, 4, 5) / 255
	}
}

function getSingleColor(hexStr, indexA, indexB) {
	let a = getCharValue(hexStr, indexA);
	let b = getCharValue(hexStr, indexB);
	return a << 4 | b;
}

function getCharValue(hexStr, index) {
	let code = hexStr.at(index);
	if (code >= 48 && code <= 57) {
		return code - 48;
	} else if (code >= 97 && code <= 102) {
		return code - 87;
	} else if (code >= 65 && code <= 70) {
		return code - 55;
	}
}
*/