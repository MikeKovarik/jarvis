function broadcast(topic, data, description) {
	if (MQTT.isConnected()) {
		//console.log('MQTT:', description);
		MQTT.pub(topic, JSON.stringify(data), 0);
	} else {
		console.log('MQTT: failed to', description, '. not connected to MQTT');
	}
}

// ------------ MQTT -------------------------

// Disabled because running enabling MQTT seems to drop packets when used with raspberry zero az hub

MQTT.setEventHandler(function(conn, ev, edata) {
	if (ev === MQTT.EV_CONNACK) {
		console.log('MQTT: CONNECTED');
		broadcastWhoami();
	} else if (ev === MQTT.EV_CLOSE) {
		console.log('MQTT: DISCONNECTED');
	}
}, null);


// ------------ RPC -------------------------

RPC.addHandler('whoami', function() {
	console.log('RPC.addHandler, whoami');
	return whoami;
});

RPC.addHandler('state', function() {
	console.log('RPC.addHandler, state');
	return state;
});

// ------------ BROADCASTS -------------------------

function broadcastState() {
    console.log('broadcastState()', JSON.stringify(state))
	broadcast(mqtt.deviceTopic, state, 'broadcast state');
}

function broadcastWhoami() {
    console.log('broadcastWhoami()')
	broadcast(mqtt.devicesAnnounceTopic, whoami, 'announce device');
}

function broadcastUptime() {
    console.log('broadcastUptime()')
	broadcast(mqtt.uptimeTopic, {
		bootTime: whoami.bootTime,
		upTime: whoami.upTime,
	}, 'broadcast uptime');
}

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

MQTT.sub(mqtt.devicesScanTopic, broadcastWhoami);
MQTT.sub(mqtt.getTopic, broadcastState);

// ------------ CUSTOM HANDLER API -------------------------

let handlers = {};
let cmdPort = 1610;

function addHandler(method, handler) {
	RPC.addHandler(method, handler);
	handlers[method] = handler;
}
