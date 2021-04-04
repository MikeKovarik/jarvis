console.log('--------------------------------------------------');

console.log('device.id             ', Cfg.get('device.id'));
console.log('dns_sd.host_name      ', Cfg.get('dns_sd.host_name'));
console.log('wifi.sta.dhcp_hostname', Cfg.get('wifi.sta.dhcp_hostname'));
console.log('wifi.sta.ssid         ', Cfg.get('wifi.sta.ssid'));

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	console.log("GOT IP");
}, null);

// ------------ DEVICE SETUP -------------------------

let needsReboot = false;

if (Cfg.get('device.id') !== whoami.id) {
	needsReboot = true;
	Cfg.set({
		device: {id: whoami.id}
	});
}

if (Cfg.get('dns_sd.host_name') !== hostname) {
	needsReboot = true;
	// DNS Simple Discovery basic device info
	Cfg.set({
		dns_sd: {
			host_name: hostname,
			txt: 'heartbeatInterval=' + JSON.stringify(heartbeatInterval)
		}
	});
	// DHCP hostname (translatable to ip)
	Cfg.set({
		wifi: {
			sta: {dhcp_hostname: hostname}
		}
	});
}

if (Cfg.get('wifi.sta.ssid') !== wifi.ssid) {
	needsReboot = true;
	Cfg.set({
		wifi: {
			sta: {
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

// ------------ DNS-SD ADVERTISEMENT -------------------------

let advertiseDnsSd = ffi('void mgos_dns_sd_advertise(void)');

setInterval(advertiseDnsSd, heartbeatInterval);

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	advertiseDnsSd();
}, null);







