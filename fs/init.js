print('#################################################');
load('api_config.js');
load('api_gpio.js');
load('api_sys.js');
load('api_timer.js');
load('api_events.js');
load('api_mqtt.js');
load('api_rpc.js');
load('api_net.js');
load('api_pwm.js');

let advertiseDnsSd = ffi('void mgos_dns_sd_advertise(void)');

print('--------------------------------------------------');

// ------------------------- CONFIG & BOOTSTRAP --------------------------------

// Re-announce the device every hour.
let heartbeat = 1000 * 60 * 60;

let deviceId = Cfg.get('device.id');
let hostname = 'jarvis-iot-' + deviceId;

let traitOnOff        = Cfg.get('ghome.traits.OnOff');
let traitBrightness   = Cfg.get('ghome.traits.Brightness');
let traitColorSetting = Cfg.get('ghome.traits.ColorSetting');

let traits = '';
/*
if (traitOnOff)        traits += '"OnOff",';
if (traitBrightness)   traits += '"Brightness",';
if (traitColorSetting) traits += '"ColorSetting",';
*/
//traits = '[' + traits + ']';

let mdnsTxt = 'name=' + Cfg.get('ghome.name') + ','
	        + 'type=' + Cfg.get('ghome.type') + ','
	        + 'heartbeat=' + JSON.stringify(heartbeat) + ','
	        + 'traits=' + traits;
	        //+ 'traits=' + JSON.stringify(traits);

print('deviceId        ', deviceId);
print('hostname        ', hostname);
print('dns_sd.host_name', Cfg.get('dns_sd.host_name'));
print(mdnsTxt);

if (Cfg.get('dns_sd.host_name').indexOf('jarvis') === -1) {
	print('CHANGING CONF');
	Cfg.set({
		dns_sd: {
			enable: true,
			adv_only: true,
			host_name: hostname,
			txt: mdnsTxt
		}
	});
	Cfg.set({wifi: {sta: {dhcp_hostname: hostname}}});
	print('--- REBOOTING ---');
	Sys.reboot(0)
}

// heartbeat
Timer.set(heartbeat, Timer.REPEAT, function() {
	advertiseDnsSd();
}, null);

Event.addHandler(Net.STATUS_CONNECTED, function(ev, evdata, ud) {
	print("WIFI CONNECTED");
}, null);
Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	print("GOT IP");
	advertiseDnsSd();
}, null);


// ------------------------- LOGIC --------------------------------

// todo get pins from config
//let pin1 = 4;
//let pin2 = 5;
//let pin3 = 14;

let brightness = 100;

let pin1 = Cfg.get('pin1');
let pin2 = Cfg.get('pin2');
let pin3 = Cfg.get('pin3');

//let on = false;
//let colorR = 0;
//let colorG = 0;
//let colorB = 0;
let on = true;
let colorR = 1;
let colorG = 0.6;
let colorB = 0.1;

if (traitOnOff) {
	GPIO.set_mode(pin1, GPIO.MODE_OUTPUT);
	MQTT.sub('/devices/' + deviceId + '/on', function(conn, topic, val) {
		parseOnOffCommand(val);
		setPins();
	}, null);
}

if (traitBrightness) {
	GPIO.set_mode(pin1, GPIO.MODE_OUTPUT);
	MQTT.sub('/devices/' + deviceId + '/brightness', function(conn, topic, val) {
		parseBrightnessCommand(val);
		setPins();
	}, null);
}

if (traitColorSetting) {
	GPIO.set_mode(pin1, GPIO.MODE_OUTPUT);
	GPIO.set_mode(pin2, GPIO.MODE_OUTPUT);
	GPIO.set_mode(pin3, GPIO.MODE_OUTPUT);
	MQTT.sub('/devices/' + deviceId + '/color', function(conn, topic, val) {
		parseColorCommand(val)
		setPins();
	}, null);
}

function parseOnOffCommand(str) {
	on = str === 'true';
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
	//print('on', on, 'brightness', brightness);
	if (traitBrightness) {
		let duty = on ? calculatePerceivedBrightness(brightness) / 100 : 0;
		print('on', on, 'brightness', brightness, 'duty', duty);
		if (traitColorSetting) {
			PWM.set(pin1, pwmFreq, duty * colorR);
			PWM.set(pin2, pwmFreq, duty * colorG);
			PWM.set(pin3, pwmFreq, duty * colorB);
		} else {
			PWM.set(pin1, pwmFreq, duty);
		}
	} else {
		GPIO.write(pin1, on ? 1 : 0);
		if (traitColorSetting) {
			GPIO.write(pin1, on ? 1 : 0);
			GPIO.write(pin2, on ? 1 : 0);
			GPIO.write(pin3, on ? 1 : 0);
		} else {
			GPIO.write(pin1, on ? 1 : 0);
		}
	}
}


// ------------------------- MQTT --------------------------------

MQTT.setEventHandler(function(conn, ev, edata) {
  if (ev !== 0) print('MQTT event handler: got', ev);
}, null);