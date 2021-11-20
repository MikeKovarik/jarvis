// https://github.com/mongoose-os-libs/mjs/pull/15
let MGOS_EVENT_TIME_CHANGED = Event.SYS + 3;

let floor = ffi('double floor(double)');


let hostbase = 'jarvis-';
let hostname = hostbase + whoami.name;

whoami.hostname     = hostname
whoami.id           = Cfg.get('device.id');
whoami.mac          = ffi('char *get_mac_address()')();
whoami.arch         = ffi('char *get_arch()')();
whoami.fw_version   = ffi('char *get_fw_version()')();
whoami.fw_timestamp = ffi('char *get_fw_timestamp()')();
whoami.fw_id        = ffi('char *get_fw_id()')();

mqtt.rootTopic            = 'jarvis';

function createMqttTopics() {
	mqtt.devicesAnnounceTopic = mqtt.rootTopic + '/hub/devices/announce';
	mqtt.devicesScanTopic     = mqtt.rootTopic + '/hub/devices/scan';
	mqtt.deviceTopic          = mqtt.rootTopic + '/' + whoami.id;
	mqtt.getTopic             = mqtt.deviceTopic + '/get';
	mqtt.availabilityTopic    = mqtt.deviceTopic + '/availability';
	mqtt.uptimeTopic          = mqtt.deviceTopic + '/uptime';
	mqtt.ipTopic              = mqtt.deviceTopic + '/ip';
}

createMqttTopics();

console.log('--------------------------------------------------');

console.log('id                    ', whoami.id);
console.log('mac                   ', whoami.mac);
console.log('arch                  ', whoami.arch);
console.log('fw_version            ', whoami.fw_version);
console.log('fw_timestamp          ', whoami.fw_timestamp);
console.log('fw_id                 ', whoami.fw_id);
console.log('wifi.sta.dhcp_hostname', Cfg.get('wifi.sta.dhcp_hostname'));
console.log('wifi.sta.ssid         ', Cfg.get('wifi.sta.ssid'));
/*
console.log('mqtt.enable           ', Cfg.get('mqtt.enable'));
console.log('mqtt.server           ', Cfg.get('mqtt.server'));
console.log('mqtt.will_topic       ', Cfg.get('mqtt.will_topic'));
console.log('mqtt.will_message     ', Cfg.get('mqtt.will_message'));
*/
//console.log('otaUpdate             ', whoami.otaUpdate);
console.log('board.led1.pin        ', Cfg.get('board.led1.pin'));
console.log('board.btn1.pin        ', Cfg.get('board.btn1.pin'));

// ------------ DEVICE SETUP -------------------------

let needsReboot = false;

// reset ID on boards previously flashed with old FW
let defaultId = whoami.arch + '_' + whoami.mac.slice(-6);
if (Cfg.get('device.id') !== defaultId) {
	console.log('Changing Device ID')
	Cfg.set({
		device: {id: defaultId}
	});
	// recreate MQTT topics with new ID.
	whoami.id = defaultId;
	createMqttTopics();
	needsReboot = true;
}

if (
	(Cfg.get('wifi.sta.enable') !== true) ||
	(Cfg.get('wifi.sta.ssid') !== wifi.ssid) ||
	(Cfg.get('wifi.sta.pass') !== wifi.pass) ||
	(Cfg.get('wifi.sta.dhcp_hostname') !== hostname)
) {
	console.log('Changing WIFI settings')
	Cfg.set({
		wifi: {
			sta: {
				enable: true,
				ssid: wifi.ssid,
				pass: wifi.pass,
				dhcp_hostname: hostname
			}
		}
	});
	needsReboot = true;
}
/*
if (
	(Cfg.get('mqtt.enable') !== true) ||
	(Cfg.get('mqtt.server') !== mqtt.server) ||
	(Cfg.get('mqtt.will_topic') !== mqtt.availabilityTopic)
) {
	console.log('Changing MQTT settings')
	Cfg.set({
		mqtt: {
			enable: true,
			server: mqtt.server,
			will_topic: mqtt.availabilityTopic,
  			will_message: 'offline',
		}
	});
	needsReboot = true;
}
*/
if (needsReboot) {
	console.log('CONF CHANGED');
	console.log('--- REBOOTING ---');
	Sys.reboot(0);
}
