// https://github.com/mongoose-os-libs/mjs/pull/15
let MGOS_EVENT_TIME_CHANGED = Event.SYS + 3;

let floor = ffi('double floor(double)');

console.log('--------------------------------------------------');

console.log('device.id             ', Cfg.get('device.id'));
console.log('wifi.sta.dhcp_hostname', Cfg.get('wifi.sta.dhcp_hostname'));
console.log('wifi.sta.ssid         ', Cfg.get('wifi.sta.ssid'));

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	console.log("GOT IP");
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
