load('api_mqtt.js');

let canNotifyHub = false;
let hubHost = '';
let hubPort = 0;

RPC.addHandler('linkToHub', function(data) {
	print('linkToHub', JSON.stringify(data));
	canNotifyHub = true;
	hubHost = data.host;
	hubPort = data.port;
	print('hubHost', hubHost);
	print('hubPort', hubPort);
	notifyHub();
	return {}
});

RPC.addHandler('whoami', function() {
	return whoami;
});

RPC.addHandler('states', function() {
	return states;
});

function notifyHub() {
	if (canNotifyHub) {
		print('Trying to notify hub');
		Net.connect({
			addr: 'tcp://' + hubHost + ':' + JSON.stringify(hubPort),
			onconnect: function(conn) {
				Net.send(conn, createPostData());
				Net.close(conn);
				print('Notified hub of states uptate');
			}
		});
	} else {
		print('Cannot notify hub. Hub ip/hostname is not known');
	}
}

function createPostData() {
	let json = JSON.stringify(states);
	return 'POST /device-states-update HTTP/1.1'
		+ '\n' + 'Host: ' + hubHost 
		+ '\n' + 'content-type: application/json'
		+ '\n' + 'content-length: ' + JSON.stringify(json.length)
		+ '\n'
		+ '\n' + json;
	return JSON.stringify(states);
}

/*
let mqttConnect = ffi('bool mgos_mqtt_global_connect(void)');
let mqttDisconnect = ffi('void mgos_mqtt_global_disconnect(void)');

RPC.addHandler('setMqtt', function(data) {
	print('setMqtt', JSON.stringify(data));
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
*/
