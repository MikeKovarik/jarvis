load('ghome-core.js');

// todo get pins from config
//let hw.pin1 = 4;
//let hw.pin2 = 5;
//let hw.pin3 = 14;

let brightness = 100;

//let on = false;
//let colorR = 0;
//let colorG = 0;
//let colorB = 0;
let colorR = 1;
let colorG = 0.6;
let colorB = 0.1;

let badRequestReponse = {error: -1, message: 'Bad request'};

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
			states.brightness = arg.brightness;
		}
	}

};


let traits = {};
for (let i = 0; i < info.traits.length; i++) {
	traits[info.traits[i]] = true
}
print('traits', JSON.stringify(traits));

function handleCommand(cmd, data) {
	print('handleCommand', data);
	if (typeof(data) === 'object' && cmd.validate(data)) {
		cmd.handle(data)
		setPins();
		return states;
	} else {
		return badRequestReponse;
	}
}

function setupCommand(traitName, commandName) {
	if (traits[traitName] === true) {
		/*
		MQTT.sub('/devices/' + deviceId + '/commands/' + commandName, function(conn, topic, val) {
			print('MQTT', commandName, val);
			handleCommand(JSON.parse(val));
		}, null);
		*/
	}
}


if (traits.OnOff) {
	GPIO.set_mode(hw.pin1, GPIO.MODE_OUTPUT);
	RPC.addHandler('commands.OnOff', function(data) {
		handleCommand(commands.OnOff, data)
	});
}


if (traitBrightness) {
	GPIO.set_mode(hw.pin1, GPIO.MODE_OUTPUT);
	MQTT.sub('/devices/' + deviceId + '/brightness', function(conn, topic, val) {
		parseBrightnessCommand(val);
		setPins();
	}, null);
}

if (traitColorSetting) {
	GPIO.set_mode(hw.pin1, GPIO.MODE_OUTPUT);
	GPIO.set_mode(hw.pin2, GPIO.MODE_OUTPUT);
	GPIO.set_mode(hw.pin3, GPIO.MODE_OUTPUT);
	MQTT.sub('/devices/' + deviceId + '/color', function(conn, topic, val) {
		parseColorCommand(val)
		setPins();
	}, null);
}

function parseBrightnessCommand(str) {
	brightness = JSON.parse(str);
}

function parseColorCommand(str) {
	colorR = getSingleColor(str, 0, 1) / 255;
	colorG = getSingleColor(str, 2, 3) / 255;
	colorB = getSingleColor(str, 4, 5) / 255;
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

function calculatePerceivedBrightness(val) {
	return (val * val) / 100;
}

let pwmFreq = 100;
function setPins() {
	//print('states.on', states.on, 'brightness', brightness);
	if (traitBrightness) {
		let duty = states.on ? calculatePerceivedBrightness(brightness) / 100 : 0;
		print('states.on', states.on, 'brightness', brightness, 'duty', duty);
		if (traitColorSetting) {
			PWM.set(hw.pin1, pwmFreq, duty * colorR);
			PWM.set(hw.pin2, pwmFreq, duty * colorG);
			PWM.set(hw.pin3, pwmFreq, duty * colorB);
		} else {
			PWM.set(hw.pin1, pwmFreq, duty);
		}
	} else {
		GPIO.write(hw.pin1, states.on ? 1 : 0);
		if (traitColorSetting) {
			GPIO.write(hw.pin1, states.on ? 1 : 0);
			GPIO.write(hw.pin2, states.on ? 1 : 0);
			GPIO.write(hw.pin3, states.on ? 1 : 0);
		} else {
			GPIO.write(hw.pin1, states.on ? 1 : 0);
		}
	}
}
