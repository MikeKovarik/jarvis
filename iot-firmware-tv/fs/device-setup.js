// https://github.com/mongoose-os-libs/mjs/pull/15
let MGOS_EVENT_TIME_CHANGED = Event.SYS + 3;

let hostbase = 'jarvis-';
let hostname = hostbase + whoami.id;

whoami.mac          = ffi('char *get_mac_address()')();
whoami.arch         = ffi('char *get_arch()')();
whoami.fw_version   = ffi('char *get_fw_version()')();
whoami.fw_timestamp = ffi('char *get_fw_timestamp()')();
whoami.fw_id        = ffi('char *get_fw_id()')();
//whoami.otaUpdate    = whoami.arch === 'esp32' || Cfg.get('board.btn1.pin') !== undefined;

let floor = ffi('double floor(double)');

console.log('--------------------------------------------------');

console.log('device.id             ', Cfg.get('device.id'));
console.log('wifi.sta.dhcp_hostname', Cfg.get('wifi.sta.dhcp_hostname'));
console.log('wifi.sta.ssid         ', Cfg.get('wifi.sta.ssid'));
console.log('mac                   ', whoami.mac);
console.log('arch                  ', whoami.arch);
console.log('fw_version            ', whoami.fw_version);
console.log('fw_timestamp          ', whoami.fw_timestamp);
console.log('fw_id                 ', whoami.fw_id);
//console.log('otaUpdate             ', whoami.otaUpdate);
console.log('board.led1.pin        ', Cfg.get('board.led1.pin'));
console.log('board.btn1.pin        ', Cfg.get('board.btn1.pin'));

Event.addHandler(Net.STATUS_DISCONNECTED, function(ev, evdata, ud) {
	console.log('Net.STATUS_DISCONNECTED');
}, null);

Event.addHandler(Net.STATUS_CONNECTING, function(ev, evdata, ud) {
	console.log('Net.STATUS_CONNECTING');
}, null);

Event.addHandler(Net.STATUS_CONNECTED, function(ev, evdata, ud) {
	console.log('Net.STATUS_CONNECTED');
}, null);

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
		console.log('Net.STATUS_GOT_IP', resp.wifi.sta_ip);
		//console.log('Response:', JSON.stringify(resp));
	}, null);
}, null);

Event.addHandler(MGOS_EVENT_TIME_CHANGED, function (ev, evdata, ud) {
	console.log('GOT TIME', Timer.now());
}, null);

// ------------ DEVICE SETUP -------------------------

let needsReboot = false;

if (Cfg.get('device.id') !== whoami.id) {
	needsReboot = true;
	Cfg.set({
		device: {id: whoami.id}
	});
}

if (Cfg.get('wifi.sta.ssid') !== wifi.ssid) {
	needsReboot = true;
	Cfg.set({
		wifi: {
			sta: {
				dhcp_hostname: hostname,
				ssid: wifi.ssid,
				pass: wifi.pass
			}
		}
	});
}

if (needsReboot) {
	console.log('CONF CHANGED');
	console.log('--- REBOOTING ---');
	Sys.reboot(0);
}
