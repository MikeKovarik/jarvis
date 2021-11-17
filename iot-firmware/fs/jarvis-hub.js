// ------------ RPC -------------------------

RPC.addHandler('whoami', function() {
	return whoami;
});

RPC.addHandler('state', function() {
	return state;
});

// ------------ MQTT -------------------------

function mqttSend(topic, data, description) {
	if (MQTT.isConnected()) {
		console.log('MQTT:', description);
		MQTT.pub(topic, JSON.stringify(data), 0);
	} else {
		console.log('MQTT: failed to', description, '. not connected to MQTT');
	}
}

function broadcastState() {
	mqttSend(mqtt.deviceTopic, state, 'broadcast state');
}

function broadcastAnnounce() {
	mqttSend(mqtt.devicesAnnounceTopic, whoami, 'announce device');
}

function broadcastUptime() {
	mqttSend(mqtt.uptimeTopic, {
		bootTime: whoami.bootTime,
		upTime: whoami.upTime,
	}, 'broadcast uptime');
}

function broadcastIp() {
	mqttSend(mqtt.ipTopic, {
		ip: whoami.ip,
		hostname: whoami.hostname,
	}, 'broadcast ip');
}

MQTT.sub(mqtt.getTopic, broadcastState, null);
MQTT.sub(mqtt.devicesScanTopic, broadcastAnnounce, null);

MQTT.setEventHandler(function(conn, ev, edata) {
	if (ev === MQTT.EV_CONNACK) {
		console.log('MQTT: CONNECTED');
		broadcastAnnounce();
	} else if (ev === MQTT.EV_CLOSE) {
		console.log('MQTT: DISCONNECTED');
	}
}, null);

// ------------ TIME -------------------------

Event.addHandler(MGOS_EVENT_TIME_CHANGED, function(ev, evdata, ud) {
	let now = Timer.now();
	console.log('TIME SYNCED:', now);
	let upTime = Sys.uptime();
	whoami.bootTime = floor(now - upTime) * 1000;
	whoami.upTime = upTime;
	broadcastUptime();
}, null);

// ------------ NET -------------------------

Event.addHandler(Net.STATUS_DISCONNECTED, function(ev, evdata, ud) {
	console.log('NET: DISCONNECTED');
}, null);

Event.addHandler(Net.STATUS_CONNECTING, function(ev, evdata, ud) {
	console.log('NET: CONNECTING');
}, null);

Event.addHandler(Net.STATUS_CONNECTED, function(ev, evdata, ud) {
	console.log('NET: CONNECTED');
}, null);

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
		console.log('NET: GOT_IP', resp.wifi.sta_ip);
		whoami.ip = resp.wifi.sta_ip;
		broadcastIp();
	}, null);
}, null);