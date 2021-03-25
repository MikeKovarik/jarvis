print('--------------------------------------------------');
load('polyfill.js');
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

RPC.addHandler('whoami', function() {
	return whoami;
});

RPC.addHandler('states', function() {
	return states;
});

print('dns_sd.host_name', Cfg.get('dns_sd.host_name'))

if (Cfg.get('dns_sd.host_name').indexOf('jarvis') === -1) {
	print('CHANGING CONF');
	Cfg.set({
		dns_sd: {
			host_name: hostname,
			txt: 'heartbeatInterval=' + JSON.stringify(heartbeatInterval)
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