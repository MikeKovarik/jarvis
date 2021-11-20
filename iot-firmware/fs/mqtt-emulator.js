let pollPort = 1609;
let cmdPort = 1610;
let triggerPort = 1611;

let broadcastIp = '224.0.0.69';
let broadcastPort = 1609;
let broadcastAddr = 'udp://' + broadcastIp + ':' + JSON.stringify(broadcastPort);

let delimeter = '␊';

let topics = {};
let handlers = {};
let stateHandlers = [];

let EV_CONNACK = 1;
let EV_CLOSE = 2;

let tcpConn = undefined;

// ------------ EVENT HANDLERS -------------------------

Event.addHandler(Net.STATUS_CONNECTED, function(ev, evdata, ud) {
	console.log('MQTT-E: net connected')
	createTcpPollServer();
	createTcpCmdServer();
	createTcpTriggerServer();
	broadcastUdpAnnounce();
}, null);

function createTcpPollServer() {
	Net.serve({
		addr: 'tcp://' + JSON.stringify(pollPort),
		onconnect: function(conn) {
			console.log('MQTT-E: poll-server onconnect');
			tcpConn = conn;
			callAllEventHandlers(conn, EV_CONNACK);
			sendToHub(getMqttInfo());
		},
		onclose: function(conn) {
			console.log('MQTT-E: poll-server onclose');
			tcpConn = undefined;
			callAllEventHandlers(conn, EV_CLOSE);
		},
	});
}

function createTcpCmdServer() {
	Net.serve({
		addr: 'tcp://' + JSON.stringify(cmdPort),
		onconnect: function(conn) {
			console.log('MQTT-E: cmd-server onconnect');
		},
		ondata: function(conn, json) {
			console.log('MQTT-E: cmd-server ondata');
			handleDataFromHub(json);
		},
		onclose: function(conn) {
			console.log('MQTT-E: cmd-server onclose');
		},
	});
}

function createTcpTriggerServer() {
	Net.serve({
		addr: 'tcp://' + JSON.stringify(triggerPort),
		onconnect: function(conn, json) {
			console.log('# TRIGGER SERVER onconnect')
			broadcastUdpAnnounce();
		},
	});
}

function broadcastUdpAnnounce() {
	Net.connect({
		addr: broadcastAddr,
		onconnect: function(conn) {
    		console.log('MQTT-E: announce connected');
			Net.send(conn, 'yo!');
    		console.log('MQTT-E: announce done');
		},
		ondata: function(conn, data) {
    		console.log('MQTT-E: announce ondata', data);
			Net.discard(conn, data.length);  // Discard received data
		}
	});
}

// ------------ INTERNALS -------------------------

function getMqttInfo() {
	return {
		topics:      topics,
		willTopic:   Cfg.get('mqtt.will_topic'),
		willMessage: Cfg.get('mqtt.will_message'),
	}
}

function sendToHub(data) {
	if (isConnected()) {
		Net.send(tcpConn, JSON.stringify(data));
		Net.send(tcpConn, delimeter);
	}
}

function handleDataFromHub(json) {
	let data = JSON.parse(json);
	console.log('CMD:', JSON.stringify(data))
	if (data.topic && handlers[data.topic]) {
		console.log('executing', data.topic, ':', data.message);
		handlers[data.topic](data.message);
	}
}

function callAllEventHandlers(conn, ev) {
	for (let i = 0; i < stateHandlers.length; i++) {
		stateHandlers[i](conn, ev);
	}
}

// ------------ MONGOOSE MQTT API EMULATOR -------------------------

function isConnected() {
	return tcpConn !== undefined;
}

function sub(topic, handler) {
	topics[topic] = true;
	handlers[topic] = handler;
	sendToHub({
		topics: topics
	});
}

function pub(topic, message) {
	sendToHub({
		topic: topic,
		message: message
	});
}

function setEventHandler(handler) {
	stateHandlers.push(handler);
	//handler(conn, ev, edata);
}


let MQTT = {
	EV_CONNACK: EV_CONNACK,
	EV_CLOSE: EV_CLOSE,
	isConnected: isConnected,
	sub: sub,
	pub: pub,
	setEventHandler: setEventHandler,
}
