load('ghome-core.js');


let badRequestReponse = {error: -1, message: 'Bad request'};

let traits = {};
for (let i = 0; i < info.traits.length; i++) {
	traits[info.traits[i]] = true
}

let commands = {

	OnOff: {
		validate: function(arg) {
			return typeof(arg.on) === 'boolean'
		},
		handle: function(arg) {
			states.on = arg.on;
		}
	},

	BrightnessAbsolute: {
		validate: function(arg) {
			return typeof(arg.brightness) === 'number'
		},
		handle: function(arg) {
			// range 0 - 100
			states.brightness = arg.brightness;
		}
	},

	ColorAbsolute: {
		validate: function(arg) {
			return typeof(arg.color) === 'object'
				&& typeof(arg.color.spectrumRGB) === 'number'
		},
		handle: function(arg) {
			// single unsigned integer representing hex color.
			states.color.spectrumRGB = arg.color.spectrumRGB;
		}
	}

};

function handleCommand(cmd, data) {
	if (typeof(data) === 'object' && cmd.validate(data)) {
		cmd.handle(data)
		setPins();
		return states;
	} else {
		return badRequestReponse;
	}
}

function getMqttTopic(commandName) {
	return '/devices/' + deviceId + '/commands/' + commandName;
}


if (traits.OnOff) {
	GPIO.set_mode(hw.pin1, GPIO.MODE_OUTPUT);
	RPC.addHandler('commands.OnOff', function(data) {
		return handleCommand(commands.OnOff, data)
	});
	MQTT.sub(getMqttTopic('OnOff'), function(conn, topic, val) {
		handleCommand(commands.OnOff, JSON.parse(val));
	}, null);
}


if (traits.Brightness) {
	RPC.addHandler('commands.BrightnessAbsolute', function(data) {
		return handleCommand(commands.BrightnessAbsolute, data)
	});
	MQTT.sub(getMqttTopic('BrightnessAbsolute'), function(conn, topic, val) {
		handleCommand(commands.BrightnessAbsolute, JSON.parse(val));
	}, null);
}


if (traits.ColorSetting) {
	GPIO.set_mode(hw.pin1, GPIO.MODE_OUTPUT);
	GPIO.set_mode(hw.pin2, GPIO.MODE_OUTPUT);
	GPIO.set_mode(hw.pin3, GPIO.MODE_OUTPUT);
	RPC.addHandler('commands.ColorAbsolute', function(data) {
		return handleCommand(commands.ColorAbsolute, data)
	});
	MQTT.sub(getMqttTopic('ColorAbsolute'), function(conn, topic, val) {
		handleCommand(commands.ColorAbsolute, JSON.parse(val));
	}, null);
}


// Compensate perceived brightness exponentially 
function compensatePerceivedBrightness(val) {
	return (val * val) / 100;
}

let pwmFreq = 100;
function setPins() {
	let duty = 0;
	if (traitBrightness) {
		duty = states.on ? compensatePerceivedBrightness(states.brightness) / 100 : 0;
	} else {
		duty = states.on ? 1 : 0;
	}
	if (traitColorSetting) {
		let rgb = hexNumToRgb(states.color.spectrumRGB);
		PWM.set(hw.pin1, pwmFreq, duty * (rgb.r / 255));
		PWM.set(hw.pin2, pwmFreq, duty * (rgb.g / 255));
		PWM.set(hw.pin3, pwmFreq, duty * (rgb.b / 255));
	} else {
		if (duty === 1 || duty === 0) {
			GPIO.write(hw.pin1, duty);
		} else {
			PWM.set(hw.pin1, pwmFreq, duty);
		}
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