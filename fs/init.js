print('--------------------------------------------------');
load('api_config.js');
load('api_gpio.js');
load('api_sys.js');
load('api_timer.js');
load('api_events.js');
load('api_mqtt.js');
load('api_rpc.js');
load('api_net.js');
load('api_pwm.js');
load('myconfig.js');
load('ghome-commands.js');


let advertiseDnsSd = ffi('void mgos_dns_sd_advertise(void)');

// ------------------------- CONFIG & BOOTSTRAP --------------------------------

// Re-announce the device every hour.
let heartbeatInterval = 1000 * 60 * 60;

let mdnsTxt = 'heartbeatInterval=' + JSON.stringify(heartbeatInterval) + ','
	        + 'name=' + Cfg.get('ghome.name') + ','
	        + 'type=' + Cfg.get('ghome.type');

print('deviceId        ', deviceId);
print('hostname        ', hostname);
print('dns_sd.host_name', Cfg.get('dns_sd.host_name'));
print(mdnsTxt);

RPC.addHandler('info', function() {
	return info;
});

RPC.addHandler('states', function() {
	return states;
});

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

Timer.set(heartbeatInterval, Timer.REPEAT, function() {
	advertiseDnsSd();
}, null);

Event.addHandler(Net.STATUS_CONNECTED, function(ev, evdata, ud) {
	print("WIFI CONNECTED");
}, null);

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	print("GOT IP");
	advertiseDnsSd();
}, null);

/*
MQTT.setEventHandler(function(conn, ev, edata) {
  if (ev !== 0) print('MQTT event handler: got', ev);
}, null);
*/