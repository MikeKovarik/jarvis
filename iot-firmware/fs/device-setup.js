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

// ------------ UDP BROADCAST ADVERTISEMENT -------------------------


let broadcastIp = '230.185.192.108';
let broadcastPort = 1609;
let broadcastAddr = 'udp://' + broadcastIp + ':' + JSON.stringify(broadcastPort);

let gotIp = false;
let gotTime = false;

function startBroadcasting() {
	broadcastHeartbeat();
	setInterval(broadcastHeartbeat, heartbeatInterval);
}

function broadcastHeartbeat() {
	console.log('will send heartbeat');
	Net.connect({
		addr: broadcastAddr,
		onconnect: function(conn) {
			console.log('heartbeat socket connected');
			let uptime = Sys.uptime();
			let data = {
				id: whoami.id,
				bootTime: floor(Timer.now() - uptime) * 1000,
				upTime: floor(uptime) * 1000,
				heartbeatInterval: heartbeatInterval,
			};
			Net.send(conn, JSON.stringify(data));
			Net.close(conn);
		},
		onclose: function(conn) {
			console.log('heartbeat socket closed');
		},
		onerror: function(conn) {
			console.log('heartbeat socket error');
		},
	});
}

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	gotIp = true;
	if (gotIp && gotTime) {
		startBroadcasting();
	}
}, null);

Event.addHandler(MGOS_EVENT_TIME_CHANGED, function (ev, evdata, ud) {
	gotTime = true;
	if (gotIp && gotTime) {
		startBroadcasting();
	}
}, null);