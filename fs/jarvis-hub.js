load('api_mqtt.js');

let hubHost = '';
let hubPort = 0;

let mqttConnect = ffi('bool mgos_mqtt_global_connect(void)');
let mqttDisconnect = ffi('void mgos_mqtt_global_disconnect(void)');

RPC.addHandler('setHub', function(data) {
	print('setHub', JSON.stringify(data));
	mqttDisconnect();
	Cfg.set({
		mqtt: {
			//pass: 'TODO',
			//user: 'TODO',
			server: 'test.mosquitto.org',
			enable: true
		}
	});
	mqttConnect();
	return {}
});

let mqttConnected = false;

console.log('mqtt.server', Cfg.get('mqtt.server'));

MQTT.setEventHandler(function(conn, ev, edata) {
	if (ev !== 0) {
		print('MQTT event handler: got', ev);
	}
	if (ev === MQTT.EV_CONNACK) {
		print('MQTT CONNECTED!');
		mqttConnected = true;
	}
	if (ev === MQTT.EV_CLOSE) {
		print('MQTT CONNECTED!');
		mqttConnected = false;
	}
}, null);


/*
RPC.addHandler('setHub', function(data) {
	print('setHub', JSON.stringify(data));
	hubHost = data.host;
	hubPort = data.port;
	print('hubHost', hubHost);
	print('hubPort', hubPort);
	Net.connect({
		addr: 'tcp://' + hubHost + ':' + JSON.stringify(hubPort),
		onconnect: function(conn) {
			print('tcp onconnect');
			Net.send(conn, JSON.stringify(states));
			Net.close(conn);
		},
		onclose: function(conn) {
			print('tcp onclose');
		},
		onerror: function(conn) {
			print('tcp onerror');
		},
	});
	return {}
});
*/