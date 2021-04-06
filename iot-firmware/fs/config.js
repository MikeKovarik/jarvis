let wifi = {
	ssid: 'Oskar',
	pass: '000000000001'
};

let hostbase = 'jarvis-iot-';
let hostname = hostbase + whoami.id;

// Re-announce the device every minute.
let heartbeatInterval = 1000 * 60;