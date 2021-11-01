RPC.addHandler('whoami', function() {
	return whoami;
});

RPC.addHandler('state', function() {
	return state;
});

function broadcastState() {
	if (MQTT.isConnected()) {
		console.log('MQTT: broadcast state');
		MQTT.pub(mqtt.deviceTopic, JSON.stringify(state), 1);
	} else {
		console.log('MQTT: couldnt broadcast state');
	}
}

function broadcastAnnounce() {
	if (MQTT.isConnected()) {
		console.log('MQTT: announcing device');
		whoami.bootTime = floor(Timer.now() - Sys.uptime()) * 1000;
		MQTT.pub(mqtt.announceDeviceTopic, JSON.stringify(whoami), 1);
	} else {
		console.log('MQTT: couldnt announce device');
	}
}

MQTT.sub(mqtt.getTopic, function(conn, topic, msg) {
	console.log('Topic:', topic, 'message:', msg);
}, null);

MQTT.setEventHandler(function(conn, ev, edata) {
	if (ev === MQTT.EV_CONNACK) {
		console.log('MQTT: connected');
		broadcastState();
		broadcastAnnounce();
	} else if (ev === MQTT.EV_CLOSE) {
		console.log('MQTT: disconnected');
	}
}, null);